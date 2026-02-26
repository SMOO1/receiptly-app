package com.receiptly.receiptly_backend.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.receiptly.receiptly_backend.model.Receipt;
import com.receiptly.receiptly_backend.service.ReceiptService;

import java.io.IOException;
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

    @PostMapping("/upload")
    public Receipt uploadReceipt(@RequestParam("file") MultipartFile file) throws IOException {
        Receipt receipt = new Receipt();
        receipt.setImageData(file.getBytes());
        receipt.setImageType(file.getContentType());
        receipt.setImage_url("/api/receipts/{id}/image"); 
        Receipt saved = receiptService.createreceipt(receipt);
        saved.setImage_url("/api/receipts/" + saved.getId() + "/image");
        return receiptService.updateReceipt(saved.getId(), saved);
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getReceiptImage(@PathVariable UUID id) {
        Receipt receipt = receiptService.getReceiptById(id);
        if (receipt.getImageData() == null) {
            return ResponseEntity.notFound().build();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                receipt.getImageType() != null ? receipt.getImageType() : "image/jpeg"));

        return new ResponseEntity<>(receipt.getImageData(), headers, HttpStatus.OK);
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
