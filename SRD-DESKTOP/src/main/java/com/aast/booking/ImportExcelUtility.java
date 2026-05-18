package com.aast.booking;

import com.aast.booking.core.FirebaseService;
import com.aast.booking.admin.schedule.LectureSchedulingEngine;
import java.io.File;

public class ImportExcelUtility {
    public static void main(String[] args) {
        try {
            System.out.println("Initializing Firebase...");
            FirebaseService.getInstance().initialize();
            
            if (!FirebaseService.getInstance().hasFirestoreAccess()) {
                System.err.println("Error: Firestore access is not available!");
                System.exit(1);
            }
            
            String desktopPath = System.getProperty("user.home") + "/Desktop/schedule_template.xlsx";
            File excelFile = new File(desktopPath);
            if (!excelFile.exists()) {
                System.err.println("Excel file not found at: " + excelFile.getAbsolutePath());
                System.exit(1);
            }
            
            System.out.println("Processing schedule from " + excelFile.getAbsolutePath() + "...");
            LectureSchedulingEngine engine = new LectureSchedulingEngine();
            
            engine.processSchedule(excelFile, false, (message, percentage) -> {
                System.out.printf("[%d%%] %s\n", (int)(percentage * 100), message);
            }).thenAccept(count -> {
                System.out.println("Import successful! Created " + count + " bookings.");
                System.exit(0);
            }).exceptionally(ex -> {
                System.err.println("Import failed!");
                ex.printStackTrace();
                System.exit(1);
                return null;
            });
            
            // Keep thread alive until async processing completes
            Thread.sleep(60000);
            
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
}
