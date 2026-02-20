package com.receiptly.receiptly_backend.model;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name="receipts")
public class Receipt {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;
    private OffsetDateTime created_at; 
    private UUID user_id; 
    private String vendor; 
    private LocalDate date; 
    private Float total; 
    private String image_url; 


    public Receipt(){
    }

    public Receipt(UUID id, OffsetDateTime created_at, UUID user_id, String vendor, 
                LocalDate date, Float total, String image_url){

        this.id = id;
        this.created_at = created_at; 
        this.user_id = user_id;
        this.vendor = vendor;
        this.date = date; 
        this.total = total; 
        this. image_url = image_url;
    }


    // Getters

    public UUID getId() {
            return id;
    }

    public OffsetDateTime getCreated_at() {
        return created_at;
        }

    public UUID getUser_id() {
        return user_id;
    }

    public String getVendor() {
        return vendor;
    }

    public LocalDate getDate() {
        return date;
    }

    public Float getTotal() {
        return total;
    }

    public String getImage_url() {
        return image_url;
    }


    // Setters

    public void setId(UUID id) {
        this.id = id;
    }

    public void setCreated_at(OffsetDateTime created_at) {
        this.created_at = created_at;
    }

    public void setUser_id(UUID user_id) {
        this.user_id = user_id;
    }

    public void setVendor(String vendor) {
        this.vendor = vendor;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public void setTotal(Float total) {
        this.total = total;
    }

    public void setImage_url(String image_url) {
        this.image_url = image_url;
    }

}
