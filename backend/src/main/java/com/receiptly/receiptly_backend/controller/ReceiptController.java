package com.receiptly.receiptly_backend.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.receiptly.receiptly_backend.repository.ReceiptRepository;

import model.Receipt;

import java.io.File;
import java.io.IOException;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;




@RestController
@RequestMapping("/api/receipts")
@CrossOrigin 
public class ReceiptController {

    public ReceiptRepository receiptRepository; 

    public ReceiptController(ReceiptRepository receiptRepository){
        this.receiptRepository = receiptRepository; 
    }


    @GetMapping
    public List<Receipt> getAllReceipts() {
        return receiptRepository.findAll(); 
    }

    @PostMapping
    public Receipt createReceipt(@RequestBody Receipt receipt) {
        
        return  receiptRepository.save(receipt);
    }
    

    
    
    
}
