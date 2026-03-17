package com.receiptly.receiptly_backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "google_sheet_id", nullable = true)
    private String googleSheetId;

    @Column(name = "auto_export", nullable = false)
    private Boolean autoExport = false;

    @Column(name = "created_at", nullable = true)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = true)
    private OffsetDateTime updatedAt;

    public UserSettings() {}

    public UserSettings(UUID userId, String googleSheetId, Boolean autoExport) {
        this.userId = userId;
        this.googleSheetId = googleSheetId;
        this.autoExport = autoExport;
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getGoogleSheetId() { return googleSheetId; }
    public void setGoogleSheetId(String googleSheetId) { this.googleSheetId = googleSheetId; }

    public Boolean getAutoExport() { return autoExport; }
    public void setAutoExport(Boolean autoExport) { this.autoExport = autoExport; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
