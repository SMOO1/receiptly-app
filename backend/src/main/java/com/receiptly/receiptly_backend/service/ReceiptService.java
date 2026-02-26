package com.receiptly.receiptly_backend.service;

import com.receiptly.receiptly_backend.model.Receipt;
import com.receiptly.receiptly_backend.repository.ReceiptRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
public class ReceiptService {

    private final ReceiptRepository receiptRepository;

    public ReceiptService(ReceiptRepository receiptRepository) {
        this.receiptRepository = receiptRepository;
    }

    public List<Receipt> getAllReceipts() {
        return receiptRepository.findAll();
    }

    public Receipt getReceiptById(UUID id) {
        return receiptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Receipt not found with id: " + id));
    }

    public Receipt createreceipt(Receipt receipt) {
        return receiptRepository.save(receipt);
    }

    public Receipt createReceiptWithImage(MultipartFile file) throws IOException {
        Receipt receipt = new Receipt();
        receipt.setImageData(file.getBytes());
        receipt.setImageType(file.getContentType());

        // Save first to get the generated ID
        Receipt saved = receiptRepository.save(receipt);

        // Now set the image URL with the real ID
        saved.setImage_url("/api/receipts/" + saved.getId() + "/image");
        return receiptRepository.save(saved);
    }

    public Receipt updateReceipt(UUID id, Receipt updated) {
        Receipt existing = receiptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Receipt not found with id: " + id));
        existing.setVendor(updated.getVendor());
        existing.setDate(updated.getDate());
        existing.setTotal(updated.getTotal());
        existing.setImage_url(updated.getImage_url());
        if (updated.getImageData() != null) {
            existing.setImageData(updated.getImageData());
            existing.setImageType(updated.getImageType());
        }
        return receiptRepository.save(existing);
    }

    public void deleteReceipt(UUID id) {
        if (!receiptRepository.existsById(id)) {
            throw new RuntimeException("Receipt not found with id: " + id);
        }
        receiptRepository.deleteById(id);
    }
}
