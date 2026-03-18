package com.receiptly.receiptly_backend.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.Permission;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.*;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.receiptly.receiptly_backend.model.Receipt;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.logging.Logger;

@Service
public class GoogleSheetsService {

    private static final Logger logger = Logger.getLogger(GoogleSheetsService.class.getName());
    private static final String APPLICATION_NAME = "Receiptly";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    private Sheets sheetsService;
    private Drive driveService;
    private GoogleCredentials credentials;

    @Value("${google.credentials.json:}")
    private String credentialsJson;

    public GoogleSheetsService() {}

    @PostConstruct
    public void init() {
        try {
            InputStream credStream = null;
            if (credentialsJson != null && !credentialsJson.isEmpty()) {
                String fixedJson = credentialsJson.replace("\\n", "\n");
                credStream = new ByteArrayInputStream(fixedJson.getBytes(StandardCharsets.UTF_8));
            } else {
                ClassPathResource resource = new ClassPathResource("google-credentials.json");
                if (resource.exists()) {
                    credStream = resource.getInputStream();
                }
            }

            if (credStream != null) {
                this.credentials = GoogleCredentials.fromStream(credStream)
                        .createScoped(Arrays.asList(SheetsScopes.SPREADSHEETS, DriveScopes.DRIVE_FILE));
                HttpRequestInitializer requestInitializer = new HttpCredentialsAdapter(this.credentials);
                final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();

                this.sheetsService = new Sheets.Builder(HTTP_TRANSPORT, JSON_FACTORY, requestInitializer)
                        .setApplicationName(APPLICATION_NAME)
                        .build();

                this.driveService = new Drive.Builder(HTTP_TRANSPORT, JSON_FACTORY, requestInitializer)
                        .setApplicationName(APPLICATION_NAME)
                        .build();

                logger.info("[GoogleSheets] Sheets and Drive clients initialized successfully");
            } else {
                logger.warning("[GoogleSheets] No credentials available - Sheets export will be disabled");
            }
        } catch (Exception e) {
            logger.severe("[GoogleSheets] Failed to initialize Google API clients: " + e.getMessage());
        }
    }

    public String createSpreadsheet(String userEmail) throws Exception {
        if (sheetsService == null || driveService == null) {
            throw new IllegalStateException("Google Services are not initialized");
        }

        // Create the spreadsheet
        Spreadsheet spreadsheet = new Spreadsheet()
                .setProperties(new SpreadsheetProperties().setTitle("Receiptly Exports"));
        spreadsheet = sheetsService.spreadsheets().create(spreadsheet)
                .setFields("spreadsheetId")
                .execute();
        
        String spreadsheetId = spreadsheet.getSpreadsheetId();

        // Share with user
        Permission userPermission = new Permission()
                .setType("user")
                .setRole("writer")
                .setEmailAddress(userEmail);
        
        driveService.permissions().create(spreadsheetId, userPermission)
                .setSendNotificationEmail(true)
                .execute();

        // Write header row
        List<Object> headers = Arrays.asList("Date", "Vendor", "Total", "Image URL", "Receiptly ID");
        ValueRange body = new ValueRange().setValues(Collections.singletonList(headers));
        
        sheetsService.spreadsheets().values()
                .update(spreadsheetId, "Sheet1!A1:E1", body)
                .setValueInputOption("USER_ENTERED")
                .execute();

        return spreadsheetId;
    }

    public void verifySheetAccess(String spreadsheetId) throws Exception {
        if (sheetsService == null) {
            throw new IllegalStateException("Google Services are not initialized");
        }
        sheetsService.spreadsheets().get(spreadsheetId).setFields("spreadsheetId").execute();
    }

    public String getServiceAccountEmail() {
        if (credentials != null && credentials instanceof com.google.auth.oauth2.ServiceAccountCredentials) {
            return ((com.google.auth.oauth2.ServiceAccountCredentials) credentials).getClientEmail();
        }
        return null;
    }

    public void appendReceiptRow(String spreadsheetId, Receipt receipt) {
        if (sheetsService == null) {
            logger.warning("[GoogleSheets] Cannot append row, service not initialized");
            return;
        }

        try {
            String dateStr = receipt.getDate() != null ? receipt.getDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : "";
            List<Object> rowData = Arrays.asList(
                    dateStr,
                    receipt.getVendor() != null ? receipt.getVendor() : "",
                    receipt.getTotal() != null ? String.valueOf(receipt.getTotal()) : "",
                    receipt.getImage_url() != null ? receipt.getImage_url() : "",
                    receipt.getId() != null ? receipt.getId().toString() : ""
            );

            ValueRange body = new ValueRange().setValues(Collections.singletonList(rowData));

            sheetsService.spreadsheets().values()
                    .append(spreadsheetId, "Sheet1!A:E", body)
                    .setValueInputOption("USER_ENTERED")
                    .execute();
                    
            logger.info("[GoogleSheets] Appended receipt " + receipt.getId() + " to sheet " + spreadsheetId);
        } catch (Exception e) {
            logger.severe("[GoogleSheets] Failed to append row: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private Integer findRowIndexByReceiptId(String spreadsheetId, String receiptId) throws Exception {
        // Fetch only column E where IDs are stored
        ValueRange response = sheetsService.spreadsheets().values()
                .get(spreadsheetId, "Sheet1!E:E")
                .execute();
        
        List<List<Object>> values = response.getValues();
        if (values == null || values.isEmpty()) {
            return null;
        }

        // 1-indexed for Sheets API
        for (int i = 0; i < values.size(); i++) {
            List<Object> row = values.get(i);
            if (!row.isEmpty() && receiptId.equals(row.get(0).toString())) {
                return i + 1;
            }
        }
        return null;
    }

    private Integer getSheetIdByTitle(String spreadsheetId, String title) throws Exception {
        Spreadsheet spreadsheet = sheetsService.spreadsheets()
                .get(spreadsheetId)
                .setFields("sheets.properties(sheetId,title)")
                .execute();

        if (spreadsheet.getSheets() == null) return null;
        for (Sheet sheet : spreadsheet.getSheets()) {
            SheetProperties props = sheet.getProperties();
            if (props != null && title.equals(props.getTitle())) {
                return props.getSheetId();
            }
        }
        return null;
    }

    public void updateReceiptRow(String spreadsheetId, Receipt receipt) {
        if (sheetsService == null || receipt.getId() == null) return;
        
        try {
            Integer rowIndex = findRowIndexByReceiptId(spreadsheetId, receipt.getId().toString());
            if (rowIndex == null) {
                // ID not found, just append it
                appendReceiptRow(spreadsheetId, receipt);
                return;
            }

            String dateStr = receipt.getDate() != null ? receipt.getDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : "";
            List<Object> rowData = Arrays.asList(
                    dateStr,
                    receipt.getVendor() != null ? receipt.getVendor() : "",
                    receipt.getTotal() != null ? String.valueOf(receipt.getTotal()) : "",
                    receipt.getImage_url() != null ? receipt.getImage_url() : "",
                    receipt.getId().toString()
            );

            ValueRange body = new ValueRange().setValues(Collections.singletonList(rowData));
            String range = String.format("Sheet1!A%d:E%d", rowIndex, rowIndex);
            
            sheetsService.spreadsheets().values()
                    .update(spreadsheetId, range, body)
                    .setValueInputOption("USER_ENTERED")
                    .execute();
            
            logger.info("[GoogleSheets] Updated receipt " + receipt.getId() + " at row " + rowIndex);
        } catch (Exception e) {
            logger.severe("[GoogleSheets] Failed to update row: " + e.getMessage());
        }
    }

    public void deleteReceiptRow(String spreadsheetId, String receiptId) {
        if (sheetsService == null) return;
        
        try {
            Integer rowIndex = findRowIndexByReceiptId(spreadsheetId, receiptId);
            if (rowIndex == null) {
                logger.info("[GoogleSheets] Receipt " + receiptId + " not found in sheet, nothing to delete");
                return;
            }
            if (rowIndex <= 1) {
                logger.warning("[GoogleSheets] Refusing to delete header row for receiptId=" + receiptId);
                return;
            }

            Integer sheetId = getSheetIdByTitle(spreadsheetId, "Sheet1");
            if (sheetId == null) {
                throw new IllegalStateException("Could not resolve sheetId for Sheet1");
            }

            // Sheets API uses 0-based, end-exclusive indices for dimensions.
            int startIndex = rowIndex - 1;
            int endIndex = rowIndex;

            DeleteDimensionRequest deleteDimensionRequest = new DeleteDimensionRequest()
                    .setRange(new DimensionRange()
                            .setSheetId(sheetId)
                            .setDimension("ROWS")
                            .setStartIndex(startIndex)
                            .setEndIndex(endIndex));

            BatchUpdateSpreadsheetRequest batchRequest = new BatchUpdateSpreadsheetRequest()
                    .setRequests(Collections.singletonList(new Request().setDeleteDimension(deleteDimensionRequest)));

            sheetsService.spreadsheets().batchUpdate(spreadsheetId, batchRequest).execute();

            logger.info("[GoogleSheets] Deleted receipt " + receiptId + " at row " + rowIndex + " (shifted rows up)");
        } catch (Exception e) {
            logger.severe("[GoogleSheets] Failed to delete row: " + e.getMessage());
        }
    }

    public void syncAllReceipts(String spreadsheetId, List<Receipt> allReceipts) {
    if (sheetsService == null) return;

    try {
        ValueRange response = sheetsService.spreadsheets().values()
                .get(spreadsheetId, "Sheet1!A:E")
                .execute();

        List<List<Object>> values = response.getValues();
        int lastRow = (values == null) ? 0 : values.size();
        
        if (lastRow == 0) {
            // Write header
            List<Object> headers = Arrays.asList("Date", "Vendor", "Total", "Image URL", "Receiptly ID");
            ValueRange body = new ValueRange().setValues(Collections.singletonList(headers));
            sheetsService.spreadsheets().values()
                    .update(spreadsheetId, "Sheet1!A1:E1", body)
                    .setValueInputOption("USER_ENTERED")
                    .execute();
            lastRow = 1;
        }

        // Extract existing IDs from column 4 (E)
        List<String> existingIds = new java.util.ArrayList<>();
        if (values != null) {
            for (int i = 1; i < values.size(); i++) { // Skip header
                List<Object> row = values.get(i);
                if (row.size() >= 5) {
                    existingIds.add(row.get(4).toString());
                } else {
                    existingIds.add(""); 
                }
            }
        }

        List<List<Object>> rowsToAdd = new java.util.ArrayList<>();
        
        // Match user receipts against existing sheet
        for (Receipt receipt : allReceipts) {
            if (receipt.getId() == null) continue;
            String rId = receipt.getId().toString();
            
            if (existingIds.contains(rId)) {
                // Update in place
                updateReceiptRow(spreadsheetId, receipt);
            } else {
                // Queue for batch addition
                String dateStr = receipt.getDate() != null ? receipt.getDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : "";
                rowsToAdd.add(Arrays.asList(
                        dateStr,
                        receipt.getVendor() != null ? receipt.getVendor() : "",
                        receipt.getTotal() != null ? String.valueOf(receipt.getTotal()) : "",
                        receipt.getImage_url() != null ? receipt.getImage_url() : "",
                        rId
                ));
            }
        }

        // Batch append new ones
        if (!rowsToAdd.isEmpty()) {
            ValueRange appendBody = new ValueRange().setValues(rowsToAdd);
            sheetsService.spreadsheets().values()
                    .append(spreadsheetId, "Sheet1!A:E", appendBody)
                    .setValueInputOption("USER_ENTERED")
                    .execute();
            logger.info("[GoogleSheets] Synced: Appended " + rowsToAdd.size() + " new receipts.");
        }

    } catch (Exception e) {
        logger.severe("[GoogleSheets] Failed to sync all receipts: " + e.getMessage());
        e.printStackTrace();
    }
}
}
