package com.receiptlyapp.backend.controller;

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
            file.transferTo(new File(filepath)); 

            return "File uploaded successfully"; 
        }
        catch(IOException e){
            e.printStackTrace();
            return "Upload failed";
        }

    }
}
