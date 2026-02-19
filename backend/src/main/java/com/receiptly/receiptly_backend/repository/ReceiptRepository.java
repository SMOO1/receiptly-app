package com.receiptly.receiptly_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import model.Receipt;
import java.util.UUID;

public interface ReceiptRepository extends JpaRepository<Receipt, UUID> {

}
