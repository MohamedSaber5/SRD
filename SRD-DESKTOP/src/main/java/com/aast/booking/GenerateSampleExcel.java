package com.aast.booking;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.FileOutputStream;

public class GenerateSampleExcel {
    public static void main(String[] args) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Schedule");

            // إنشاء عناوين الأعمدة (الـ Header)
            Row headerRow = sheet.createRow(0);
            String[] columns = {
                "الكلية", "القسم", "المادة", "كود المادة", "اسم المحاضر",
                "نوع المحاضرة", "السعة", "الفترة", "اليوم", "تاريخ البداية",
                "الجروب", "كل أسبوعين (0/1)"
            };
            
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // بيانات الأمثلة
            // 0=weekly, 1=bi-weekly
            Object[][] data = {
                {"الهندسة", "حاسبات", "هياكل البيانات", "CS201", "د. أحمد", "lecture", 40, 1, "الأحد", "2026-10-04", "A", 0},
                {"الهندسة", "حاسبات", "هياكل البيانات", "CS201", "م. علي", "section", 20, 3, "الإثنين", "2026-10-05", "A", 1},
                {"إدارة الأعمال", "تسويق", "أساسيات التسويق", "MKT101", "د. سارة", "lecture", 60, 2, "الثلاثاء", "2026-10-06", "B", 0},
                {"اللوجستيات", "نقل بحري", "إدارة الموانئ", "LOG305", "د. محمد", "lecture", 50, 4, "الأربعاء", "2026-10-07", "C", 0}
            };

            int rowNum = 1;
            for (Object[] rowData : data) {
                Row row = sheet.createRow(rowNum++);
                for (int i = 0; i < rowData.length; i++) {
                    Cell cell = row.createCell(i);
                    if (rowData[i] instanceof String) {
                        cell.setCellValue((String) rowData[i]);
                    } else if (rowData[i] instanceof Integer) {
                        cell.setCellValue((Integer) rowData[i]);
                    }
                }
            }
            
            for(int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            String home = System.getProperty("user.home");
            String filePath = home + "/Desktop/sample_schedule.xlsx";
            try (FileOutputStream fileOut = new FileOutputStream(filePath)) {
                workbook.write(fileOut);
            }

            System.out.println("Excel file created successfully at: " + filePath);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
