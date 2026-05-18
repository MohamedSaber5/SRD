package com.aast.booking;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.File;
import java.io.FileInputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;

public class InspectColumns {
    public static void main(String[] args) {
        try {
            File file = new File("C:/Users/Mohamed Saber/Desktop/schedule_template.xlsx");
            if (!file.exists()) {
                System.out.println("File does not exist!");
                return;
            }
            File outFile = new File("d:/term 6/SRD/SRD-DESKTOP/inspect_output.txt");
            try (FileInputStream fis = new FileInputStream(file);
                 Workbook wb = new XSSFWorkbook(fis);
                 PrintWriter pw = new PrintWriter(outFile, "UTF-8")) {
                
                Sheet sheet = wb.getSheetAt(0);
                Row header = sheet.getRow(0);
                pw.println("--- HEADERS ---");
                for (int i = 0; i < header.getLastCellNum(); i++) {
                    pw.println("Col " + i + ": " + header.getCell(i));
                }
                
                pw.println("\n--- ALL ROWS ---");
                for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                    Row row = sheet.getRow(r);
                    if (row == null) continue;
                    pw.print("Row " + r + ": ");
                    for (int c = 0; c < row.getLastCellNum(); c++) {
                        Cell cell = row.getCell(c);
                        pw.print("Col" + c + "=[" + (cell != null ? cell.toString() : "") + "] ");
                    }
                    pw.println();
                }
                System.out.println("Written inspect_output.txt successfully!");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
