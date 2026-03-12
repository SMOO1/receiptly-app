package com.receiptly.receiptly_backend.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GoogleVisionService {

    private static final Logger logger = Logger.getLogger(GoogleVisionService.class.getName());
    private ImageAnnotatorClient visionClient;

    public GoogleVisionService(@Value("${google.credentials.json:}") String credentialsJson) {
        try {
            InputStream credStream = null;
            
            if (credentialsJson != null && !credentialsJson.isEmpty()) {
                logger.info("[GoogleVision] Loading credentials from environment variable");
                // Fix escaped newlines in the private key
                String fixedJson = credentialsJson.replace("\\n", "\n");
                credStream = new ByteArrayInputStream(fixedJson.getBytes(StandardCharsets.UTF_8));
            } else {
                try {
                    ClassPathResource resource = new ClassPathResource("google-credentials.json");
                    if (resource.exists()) {
                        logger.info("[GoogleVision] Loading credentials from classpath resource");
                        credStream = resource.getInputStream();
                    }
                } catch (Exception e) {
                    logger.warning("[GoogleVision] No credentials file found on classpath");
                }
            }
            
            if (credStream != null) {
                GoogleCredentials credentials = GoogleCredentials.fromStream(credStream)
                        .createScoped(List.of("https://www.googleapis.com/auth/cloud-vision"));
                ImageAnnotatorSettings settings = ImageAnnotatorSettings.newBuilder()
                        .setCredentialsProvider(() -> credentials)
                        .build();
                this.visionClient = ImageAnnotatorClient.create(settings);
                logger.info("[GoogleVision] Vision client initialized successfully");
            } else {
                logger.warning("[GoogleVision] No credentials available - OCR will be disabled");
                this.visionClient = null;
            }
        } catch (Exception e) {
            logger.severe("[GoogleVision] Failed to initialize Vision client: " + e.getMessage());
            this.visionClient = null;
        }
    }

    public String extractText(byte[] imageBytes) throws IOException {
        if (visionClient == null) {
            throw new IOException("Google Vision client not initialized");
        }

        ByteString imgBytes = ByteString.copyFrom(imageBytes);
        Image image = Image.newBuilder().setContent(imgBytes).build();
        Feature feature = Feature.newBuilder().setType(Feature.Type.TEXT_DETECTION).build();
        AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                .addFeatures(feature)
                .setImage(image)
                .build();

        BatchAnnotateImagesResponse response = visionClient.batchAnnotateImages(List.of(request));
        AnnotateImageResponse res = response.getResponsesList().get(0);

        if (res.hasError()) {
            throw new IOException("Vision API error: " + res.getError().getMessage());
        }

        if (res.getTextAnnotationsList().isEmpty()) {
            return "";
        }

        String fullText = res.getTextAnnotations(0).getDescription();
        logger.info("[GoogleVision] Extracted text length: " + fullText.length());
        return fullText;
    }

    public Map<String, String> parseReceiptText(String text) {
        Map<String, String> result = new HashMap<>();
        result.put("vendor", parseVendor(text));
        result.put("date", parseDate(text));
        result.put("total", parseTotal(text));
        logger.info("[GoogleVision] Parsed receipt - vendor: " + result.get("vendor")
                + ", date: " + result.get("date") + ", total: " + result.get("total"));
        return result;
    }

    private String parseVendor(String text) {
        String[] lines = text.split("\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty() && trimmed.length() > 1) {
                // Skip lines that just look like dates/numbers/punctuation
                if (trimmed.matches("^[\\d/\\-.$%:]+$")) continue;
                return trimmed;
            }
        }
        return "";
    }

    private String parseDate(String text) {
        List<Pattern> patterns = List.of(
                Pattern.compile("(\\d{1,2})[/\\-](\\d{1,2})[/\\-](\\d{4})"), // MM/DD/YYYY
                Pattern.compile("(\\d{4})[/\\-](\\d{1,2})[/\\-](\\d{1,2})"), // YYYY-MM-DD
                Pattern.compile("(\\d{1,2})[/\\-](\\d{1,2})[/\\-](\\d{2})(?!\\d)") // MM/DD/YY
        );

        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                try {
                    String match = matcher.group(0);
                    if (match.matches("\\d{4}[/\\-]\\d{1,2}[/\\-]\\d{1,2}")) {
                        LocalDate date = LocalDate.parse(match.replace("/", "-"), DateTimeFormatter.ofPattern("yyyy-M-d"));
                        return date.toString();
                    }
                    if (match.matches("\\d{1,2}[/\\-]\\d{1,2}[/\\-]\\d{4}")) {
                        String[] parts = match.replace("/", "-").split("-");
                        return LocalDate.of(Integer.parseInt(parts[2]), Integer.parseInt(parts[0]), Integer.parseInt(parts[1])).toString();
                    }
                    if (match.matches("\\d{1,2}[/\\-]\\d{1,2}[/\\-]\\d{2}")) {
                        String[] parts = match.replace("/", "-").split("-");
                        int year = Integer.parseInt(parts[2]);
                        year += (year > 50) ? 1900 : 2000;
                        return LocalDate.of(year, Integer.parseInt(parts[0]), Integer.parseInt(parts[1])).toString();
                    }
                } catch (Exception e) {
                    logger.warning("[GoogleVision] Failed to parse date: " + matcher.group(0));
                }
            }
        }
        return "";
    }

    private String parseTotal(String text) {
        String[] lines = text.split("\\n");
        Pattern totalPattern = Pattern.compile("(?i)(total|amount\\s*due|balance\\s*due|grand\\s*total)\\s*[:\\s$]*\\$?\\s*(\\d+[.,]\\d{2})");
        
        // Match explicit total keywords
        for (int i = lines.length - 1; i >= 0; i--) {
            Matcher matcher = totalPattern.matcher(lines[i]);
            if (matcher.find()) {
                return matcher.group(2).replace(",", "");
            }
        }

        // Fallback: pick the largest price-looking string
        Pattern amountPattern = Pattern.compile("\\$?\\s*(\\d+[.,]\\d{2})");
        float maxAmount = 0;
        String maxAmountStr = "";
        Matcher matcher = amountPattern.matcher(text);
        while (matcher.find()) {
            String amtStr = matcher.group(1).replace(",", "");
            try {
                float amt = Float.parseFloat(amtStr);
                if (amt > maxAmount) {
                    maxAmount = amt;
                    maxAmountStr = amtStr;
                }
            } catch (NumberFormatException ignored) {}
        }
        return maxAmountStr;
    }
}