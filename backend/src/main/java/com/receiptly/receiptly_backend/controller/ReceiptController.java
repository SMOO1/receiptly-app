package com.receiptly.receiptly_backend.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;


@RestController
@RequestMapping("/api/receipts")
@CrossOrigin 
public class ReceiptController {

    private static final String UPLOAD_DIR = "uploads/";

    @PostMapping("/upload")
    public String uploadReceipt(@RequestParam("file") MultipartFile file) {
        
        if(file.isEmpty()){
            return "No file uploaded"; 
        }

        try {
            File directory = new File(UPLOAD_DIR);
            if(!directory.exists()){
                directory.mkdirs(); 
            }

            String filepath = UPLOAD_DIR + file.getOriginalFilename();
            File destination = new File(filepath).getAbsoluteFile();
            file.transferTo(destination);

            return "File uploaded successfully " + destination.getPath(); 
        }
        catch(IOException e){
            e.printStackTrace();
            return "Upload failed: " + e.getMessage();
        }

    }
}
