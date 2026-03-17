package com.receiptly.receiptly_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.receiptly.receiptly_backend.model.Receipt;
import com.receiptly.receiptly_backend.service.ReceiptService;
import com.receiptly.receiptly_backend.service.SupabaseStorageService;

import com.receiptly.receiptly_backend.repository.UserSettingsRepository;
import com.receiptly.receiptly_backend.service.GoogleSheetsService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/receipts")
@CrossOrigin
public class ReceiptController {

    private final ReceiptService receiptService;
    private final SupabaseStorageService storageService;
    private final UserSettingsRepository userSettingsRepository;
    private final GoogleSheetsService sheetsService;

    public ReceiptController(ReceiptService receiptService, SupabaseStorageService storageService, UserSettingsRepository userSettingsRepository, GoogleSheetsService sheetsService) {
        this.receiptService = receiptService;
        this.storageService = storageService;
        this.userSettingsRepository = userSettingsRepository;
        this.sheetsService = sheetsService;
    }

    @GetMapping
    public List<Receipt> getAllReceipts() {
        return receiptService.getAllReceipts();
    }

    @PostMapping
    public Receipt createReceipt(@RequestBody Receipt receipt) {
        return receiptService.createreceipt(receipt);
    }

    @GetMapping("/{id}")
    public Receipt getReceiptById(@PathVariable UUID id) {
        return receiptService.getReceiptById(id);
    }

    @GetMapping("/{id}/signed-url")
    public ResponseEntity<?> getSignedUrl(@PathVariable UUID id) {
        try {
            Receipt receipt = receiptService.getReceiptById(id);
            String objectPath = receipt.getImage_url();
            if (objectPath == null || objectPath.isBlank()) {
                return ResponseEntity.ok(java.util.Map.of("signedUrl", ""));
            }
            String signedUrl = storageService.getSignedUrl(objectPath, 3600);
            return ResponseEntity.ok(java.util.Map.of("signedUrl", signedUrl));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public Receipt updateReceipt(@PathVariable UUID id, @RequestBody Receipt receipt) {
        Receipt updated = receiptService.updateReceipt(id, receipt);
        
        // Auto Update existing sheet row
        if (updated.getUser_id() != null) {
            userSettingsRepository.findById(updated.getUser_id()).ifPresent(settings -> {
                if (Boolean.TRUE.equals(settings.getAutoExport()) && settings.getGoogleSheetId() != null) {
                    new Thread(() -> {
                        sheetsService.updateReceiptRow(settings.getGoogleSheetId(), updated);
                    }).start();
                }
            });
        }
        
        return updated;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReceipt(@PathVariable UUID id) {
        try {
            Receipt existing = receiptService.getReceiptById(id);
            
            // Auto Delete row from sheet
            if (existing != null && existing.getUser_id() != null) {
                userSettingsRepository.findById(existing.getUser_id()).ifPresent(settings -> {
                    if (Boolean.TRUE.equals(settings.getAutoExport()) && settings.getGoogleSheetId() != null) {
                        new Thread(() -> {
                            sheetsService.deleteReceiptRow(settings.getGoogleSheetId(), existing.getId().toString());
                        }).start();
                    }
                });
            }
            
            receiptService.deleteReceipt(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            // Probably already deleted or missing, fail gracefully.
            return ResponseEntity.noContent().build();
        }
    }
}
