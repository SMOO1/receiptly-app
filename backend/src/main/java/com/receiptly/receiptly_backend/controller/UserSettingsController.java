package com.receiptly.receiptly_backend.controller;

import com.receiptly.receiptly_backend.model.UserSettings;
import com.receiptly.receiptly_backend.repository.UserSettingsRepository;
import com.receiptly.receiptly_backend.service.GoogleSheetsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.receiptly.receiptly_backend.repository.ReceiptRepository;

@RestController
@RequestMapping("/api/user-settings")
@CrossOrigin
public class UserSettingsController {

    private final UserSettingsRepository repository;
    private final GoogleSheetsService googleSheetsService;
    private final ReceiptRepository receiptRepository;

    public UserSettingsController(UserSettingsRepository repository, GoogleSheetsService googleSheetsService, ReceiptRepository receiptRepository) {
        this.repository = repository;
        this.googleSheetsService = googleSheetsService;
        this.receiptRepository = receiptRepository;
    }

    @GetMapping
    public ResponseEntity<?> getSettings(@RequestHeader(value = "X-User-Id") String userId) {
        try {
            UUID uid = parseUserId(userId);
            Optional<UserSettings> settingsOpt = repository.findById(uid);
            UserSettings settings = settingsOpt.orElse(new UserSettings(uid, null, false));
            
            String serviceEmail = googleSheetsService.getServiceAccountEmail();
            
            return ResponseEntity.ok(Map.of(
                "settings", settings,
                "serviceAccountEmail", serviceEmail != null ? serviceEmail : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/connect")
    public ResponseEntity<?> connectGoogleSheet(
            @RequestHeader(value = "X-User-Id") String userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            @RequestBody Map<String, String> payload
    ) {
        try {
            UUID uid = parseUserId(userId);
            String action = payload.get("action"); // "create" or "link"
            String sheetUrl = payload.get("sheetUrl");
            
            String sheetId = null;

            if ("create".equals(action)) {
                if (userEmail == null || userEmail.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "User email is required to create and share a sheet"));
                }
                sheetId = googleSheetsService.createSpreadsheet(userEmail);
            } else if ("link".equals(action)) {
                if (sheetUrl == null || sheetUrl.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Sheet URL is required to link an existing sheet"));
                }
                sheetId = extractSheetId(sheetUrl);
                try {
                    googleSheetsService.verifySheetAccess(sheetId);
                } catch (Exception e) {
                    if (e.getMessage() != null && e.getMessage().contains("403")) {
                        return ResponseEntity.status(403).body(Map.of("error", "Permission denied. Please ensure you shared the sheet with " + googleSheetsService.getServiceAccountEmail() + " as Editor."));
                    }
                    throw e;
                }
            } else if ("disconnect".equals(action)) {
                sheetId = null;
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid action. Use 'create', 'link', or 'disconnect'"));
            }

            UserSettings settings = repository.findById(uid).orElse(new UserSettings(uid, null, false));
            settings.setGoogleSheetId(sheetId);
            if (sheetId == null) {
                settings.setAutoExport(false);
            }
            if (settings.getCreatedAt() == null) settings.setCreatedAt(OffsetDateTime.now());
            settings.setUpdatedAt(OffsetDateTime.now());
            repository.save(settings);

            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<?> updateSettings(
            @RequestHeader(value = "X-User-Id") String userId,
            @RequestBody UserSettings updatedSettings
    ) {
        try {
            UUID uid = parseUserId(userId);
            UserSettings settings = repository.findById(uid).orElse(new UserSettings(uid, null, false));
            settings.setAutoExport(updatedSettings.getAutoExport());
            
            if (updatedSettings.getGoogleSheetId() != null && updatedSettings.getGoogleSheetId().isEmpty()) {
                settings.setGoogleSheetId(null);
            }
            if (settings.getCreatedAt() == null) settings.setCreatedAt(OffsetDateTime.now());
            settings.setUpdatedAt(OffsetDateTime.now());
            
            repository.save(settings);
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<?> syncAllReceipts(@RequestHeader(value = "X-User-Id") String userId) {
        try {
            UUID uid = parseUserId(userId);
            UserSettings settings = repository.findById(uid).orElse(null);
            if (settings == null || settings.getGoogleSheetId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "No Google Sheet connected for user"));
            }

            // Quick one-time patch for the dev database to claim orphaned receipts created before User Auth was strictly enforced
            java.util.List<com.receiptly.receiptly_backend.model.Receipt> globalReceipts = this.receiptRepository.findAll();
            for (com.receiptly.receiptly_backend.model.Receipt r : globalReceipts) {
                if (r.getUser_id() == null) {
                    r.setUser_id(uid);
                    this.receiptRepository.save(r);
                }
            }

            java.util.List<com.receiptly.receiptly_backend.model.Receipt> allReceipts = this.receiptRepository.findAllByUserId(uid);
            
            new Thread(() -> {
                googleSheetsService.syncAllReceipts(settings.getGoogleSheetId(), allReceipts);
            }).start();
            
            return ResponseEntity.ok(Map.of("message", "Sync started in background with " + allReceipts.size() + " receipts."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private String extractSheetId(String url) {
        if (!url.contains("http")) {
            return url; // assume it's already an ID
        }
        Pattern pattern = Pattern.compile("/spreadsheets/d/([a-zA-Z0-9-_]+)");
        Matcher matcher = pattern.matcher(url);
        if (matcher.find()) {
            return matcher.group(1);
        }
        throw new IllegalArgumentException("Invalid Google Sheets URL");
    }

    private UUID parseUserId(String userIdStr) {
        if (userIdStr != null && userIdStr.equals("demo-user-id")) {
            return UUID.fromString("00000000-0000-0000-0000-000000000001");
        }
        return UUID.fromString(userIdStr);
    }
}
