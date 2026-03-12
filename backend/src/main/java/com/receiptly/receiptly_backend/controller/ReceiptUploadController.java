package com.receiptly.receiptly_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.receiptly.receiptly_backend.model.Receipt;
import com.receiptly.receiptly_backend.service.GoogleVisionService;
import com.receiptly.receiptly_backend.service.ReceiptService;
import com.receiptly.receiptly_backend.service.SupabaseStorageService;

import java.time.LocalDate;
import java.util.Map;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin
public class ReceiptUploadController {
    private static final Logger logger = Logger.getLogger(ReceiptUploadController.class.getName());
    
    private final ReceiptService receiptService;
    private final SupabaseStorageService storageService;
    private final GoogleVisionService visionService;

    public ReceiptUploadController(ReceiptService receiptService, SupabaseStorageService storageService, GoogleVisionService visionService) {
        this.receiptService = receiptService;
        this.storageService = storageService;
        this.visionService = visionService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> uploadReceipt(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = storageService.upload(file);
            logger.info("[Upload] Image uploaded successfully: " + imageUrl);
            
            Receipt receipt = new Receipt();
            receipt.setImage_url(imageUrl);
            
            // Try OCR but don't fail if it doesn't work
            try {
                String extractedText = visionService.extractText(file.getBytes());
                logger.info("[Upload] OCR extracted text length: " + (extractedText != null ? extractedText.length() : 0));
                
                Map<String, String> parsedData = visionService.parseReceiptText(extractedText);
                
                if (parsedData.get("vendor") != null && !parsedData.get("vendor").isEmpty()) {
                    String vendor = parsedData.get("vendor");
                    receipt.setVendor(vendor.length() > 255 ? vendor.substring(0, 255) : vendor);
                }
                if (parsedData.get("date") != null && !parsedData.get("date").isEmpty()) {
                    try {
                        receipt.setDate(LocalDate.parse(parsedData.get("date")));
                    } catch (Exception ignored) {}
                }
                if (parsedData.get("total") != null && !parsedData.get("total").isEmpty()) {
                    try {
                        receipt.setTotal(Float.parseFloat(parsedData.get("total")));
                    } catch (Exception ignored) {}
                }
            } catch (Exception e) {
                // OCR failed - log but continue with manual entry
                logger.warning("[Upload] OCR Processing failed (will require manual entry): " + e.getMessage());
            }
            
            Receipt saved = receiptService.createreceipt(receipt);
            logger.info("[Upload] Receipt saved with ID: " + saved.getId());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            logger.severe("[Upload] Upload failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }
}