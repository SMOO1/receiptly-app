package com.receiptly.receiptly_backend.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "receipts")
public class Receipt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String vendor;
    private String date;
    private Double total;
    private String image_url;

    @Lob
    @Column(columnDefinition = "BYTEA")
    private byte[] imageData;

    private String imageType;

    // Default constructor required by JPA
    public Receipt() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getVendor() { return vendor; }
    public void setVendor(String vendor) { this.vendor = vendor; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public String getImage_url() { return image_url; }
    public void setImage_url(String image_url) { this.image_url = image_url; }

    public byte[] getImageData() { return imageData; }
    public void setImageData(byte[] imageData) { this.imageData = imageData; }

    public String getImageType() { return imageType; }
    public void setImageType(String imageType) { this.imageType = imageType; }
}
