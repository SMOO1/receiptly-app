package com.receiptly.receiptly_backend.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.receiptly.receiptly_backend.model.Receipt;
import com.receiptly.receiptly_backend.repository.ReceiptRepository;
import com.receiptly.receiptly_backend.service.ReceiptService;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;




@RestController
@RequestMapping("/api/receipts")
@CrossOrigin 
public class ReceiptController {

    public ReceiptService receiptService; 

    public ReceiptController(ReceiptService receiptService){
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
        
        return  receiptService.createreceipt(receipt);
    }
    

    
    
    
}
