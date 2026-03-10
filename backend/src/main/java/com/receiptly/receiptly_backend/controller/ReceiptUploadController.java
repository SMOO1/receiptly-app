package com.receiptly.receiptly_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.receiptly.receiptly_backend.model.Receipt;
import com.receiptly.receiptly_backend.service.ReceiptService;
import com.receiptly.receiptly_backend.service.SupabaseStorageService;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin
public class ReceiptUploadController {

    private final ReceiptService receiptService;
    private final SupabaseStorageService storageService;

    public ReceiptUploadController(ReceiptService receiptService, SupabaseStorageService storageService) {
        this.receiptService = receiptService;
        this.storageService = storageService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> uploadReceipt(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = storageService.upload(file);
            Receipt receipt = new Receipt();
            receipt.setImage_url(imageUrl);
            Receipt saved = receiptService.createreceipt(receipt);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(java.util.Map.of("error", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }
}