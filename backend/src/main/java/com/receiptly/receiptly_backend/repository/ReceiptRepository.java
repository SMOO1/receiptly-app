package com.receiptly.receiptly_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.receiptly.receiptly_backend.model.Receipt;

import java.util.List;
import java.util.UUID;

public interface ReceiptRepository extends JpaRepository<Receipt, UUID> {
    
    @Query("SELECT r FROM Receipt r WHERE r.user_id = :userId")
    List<Receipt> findAllByUserId(@Param("userId") UUID userId);
}
