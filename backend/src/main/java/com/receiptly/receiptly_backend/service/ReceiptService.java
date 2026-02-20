package com.receiptly.receiptly_backend.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID; 
import org.springframework.stereotype.Service;

import com.receiptly.receiptly_backend.model.Receipt;
import com.receiptly.receiptly_backend.repository.ReceiptRepository;

@Service
public class ReceiptService {
    private final ReceiptRepository receiptRepository; 

    public ReceiptService(ReceiptRepository receiptRepository){
        this.receiptRepository = receiptRepository; 
    }

    public List<Receipt> getAllReceipts(){
        return receiptRepository.findAll();
    }

    public Receipt createreceipt(Receipt receipt){
        receipt.setCreated_at(OffsetDateTime.now());
        return receiptRepository.save(receipt);
    }

    public Receipt getReceiptById(UUID id){
        return receiptRepository.findById(id).orElseThrow(() -> new RuntimeException("Receipt not found"));
    }
}
