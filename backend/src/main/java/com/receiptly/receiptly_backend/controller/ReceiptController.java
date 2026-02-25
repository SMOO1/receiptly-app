package com.receiptly.receiptly_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.receiptly.receiptly_backend.model.Receipt;
import com.receiptly.receiptly_backend.service.ReceiptService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/receipts")
@CrossOrigin
public class ReceiptController {

    public ReceiptService receiptService;

    public ReceiptController(ReceiptService receiptService) {
        this.receiptService = receiptService;
    }

    @GetMapping
    public List<Receipt> getAllReceipts() {
        return receiptService.getAllReceipts();
    }

    @GetMapping("/{id}")
    public Receipt getReceiptById(@PathVariable UUID id) {
        return receiptService.getReceiptById(id);
    }

    @PostMapping
    public Receipt createReceipt(@RequestBody Receipt receipt) {
        return receiptService.createreceipt(receipt);
    }

    @PutMapping("/{id}")
    public Receipt updateReceipt(@PathVariable UUID id, @RequestBody Receipt receipt) {
        return receiptService.updateReceipt(id, receipt);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReceipt(@PathVariable UUID id) {
        receiptService.deleteReceipt(id);
        return ResponseEntity.noContent().build();
    }
}
