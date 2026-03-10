package com.receiptly.receiptly_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.receiptly.receiptly_backend.model.Receipt;
import com.receiptly.receiptly_backend.service.ReceiptService;
import com.receiptly.receiptly_backend.service.SupabaseStorageService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/receipts")
@CrossOrigin
public class ReceiptController {

    private final ReceiptService receiptService;
    private final SupabaseStorageService storageService;

    public ReceiptController(ReceiptService receiptService, SupabaseStorageService storageService) {
        this.receiptService = receiptService;
        this.storageService = storageService;
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

    @PutMapping("/{id}")
    public Receipt updateReceipt(@PathVariable UUID id, @RequestBody Receipt receipt) {
        return receiptService.updateReceipt(id, receipt);
    }

    @DeleteMapping("/{id}")
    public void deleteReceipt(@PathVariable UUID id) {
        receiptService.deleteReceipt(id);
    }
}
