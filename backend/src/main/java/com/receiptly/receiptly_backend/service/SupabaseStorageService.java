package com.receiptly.receiptly_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import java.util.logging.Logger;

@Service
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.bucket}")
    private String bucket;

    private static final Logger logger = Logger.getLogger(SupabaseStorageService.class.getName());

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public String upload(MultipartFile file) throws IOException, InterruptedException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String objectPath = UUID.randomUUID() + extension;

        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + objectPath;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(uploadUrl))
                .header("Authorization", "Bearer " + supabaseKey)
                .header("Content-Type", file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .POST(HttpRequest.BodyPublishers.ofByteArray(file.getBytes()))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed to upload to Supabase Storage: " + response.body());
        }

        // Return only the objectPath (private — no public URL)
        return objectPath;
    }

    public String getSignedUrl(String objectPath, long expiresInSeconds) throws IOException, InterruptedException {
        String signUrl = supabaseUrl + "/storage/v1/object/sign/" + bucket + "/" + objectPath;
        logger.info("[SupabaseStorage] Requesting signed URL from: " + signUrl);

        String body = "{\"expiresIn\":" + expiresInSeconds + "}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(signUrl))
                .header("Authorization", "Bearer " + supabaseKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        logger.info("[SupabaseStorage] Sign response status: " + response.statusCode());
        logger.info("[SupabaseStorage] Sign response body: " + response.body());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed to get signed URL: " + response.body());
        }

        String responseBody = response.body();
        String tokenKey = "token=";
        int tokenStart = responseBody.indexOf(tokenKey);
        if (tokenStart == -1) {
            throw new RuntimeException("No token found in signed URL response: " + responseBody);
        }
        int tokenEnd = responseBody.indexOf("\"", tokenStart);
        String token = tokenEnd == -1
            ? responseBody.substring(tokenStart + tokenKey.length())
            : responseBody.substring(tokenStart + tokenKey.length(), tokenEnd);

        String finalUrl = supabaseUrl + "/storage/v1/object/sign/" + bucket + "/" + objectPath + "?token=" + token;
        logger.info("[SupabaseStorage] Final signed URL: " + finalUrl);
        return finalUrl;
    }

    public void delete(String objectPath) throws IOException, InterruptedException {
        if (objectPath == null || objectPath.isBlank()) {
            return;
        }
        // Strip to just the objectPath if a full URL was accidentally stored
        String path = objectPath;
        if (objectPath.contains("/storage/v1/object/")) {
            path = objectPath.substring(objectPath.lastIndexOf(bucket + "/") + bucket.length() + 1);
        }
        String deleteUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + path;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(deleteUrl))
                .header("Authorization", "Bearer " + supabaseKey)
                .DELETE()
                .build();

        httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }
}