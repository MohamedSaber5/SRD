package com.aast.booking.admin.schedule;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.File;
import java.io.FileInputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;

/**
 * SOLID: SRP — Only handles parsing the .xlsx file into LectureScheduleRow objects.
 * Depends on Apache POI.
 */
public class ExcelScheduleParser {

    public List<LectureScheduleRow> parse(File file) throws Exception {
        List<LectureScheduleRow> rows = new ArrayList<>();
        SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd");

        try (FileInputStream fis = new FileInputStream(file);
             Workbook workbook = new XSSFWorkbook(fis)) {

            Sheet sheet = workbook.getSheetAt(0);
            boolean isFirstRow = true;

            for (Row row : sheet) {
                if (isFirstRow) { // Skip header
                    isFirstRow = false;
                    continue;
                }
                
                // Stop if row is completely empty
                if (row == null || row.getCell(0) == null || row.getCell(0).getCellType() == CellType.BLANK) {
                    break;
                }

                String college = getString(row.getCell(0));
                String dept = getString(row.getCell(1));
                String subj = getString(row.getCell(2));
                String subjCode = getString(row.getCell(3));
                String lecturer = getString(row.getCell(4));
                String type = getString(row.getCell(5));
                
                // Capacity: sometimes stored as float/int
                int cap = (int) getNumeric(row.getCell(6));
                int slot = (int) getNumeric(row.getCell(7));
                String day = getString(row.getCell(8));
                
                // Date parsing (POI handles date cells differently)
                String dateStr = "";
                Cell dateCell = row.getCell(9);
                if (dateCell != null) {
                    if (dateCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dateCell)) {
                        dateStr = df.format(dateCell.getDateCellValue());
                    } else {
                        dateStr = getString(dateCell);
                    }
                }

                String group = getString(row.getCell(10));
                
                // biWeekly: 0 = weekly, 1 = bi-weekly
                int biWeeklyFlag = (int) getNumeric(row.getCell(11));
                boolean biWeekly = (biWeeklyFlag == 1);

                rows.add(new LectureScheduleRow(
                        college, dept, subj, subjCode, lecturer, type,
                        cap, slot, day, dateStr, group, biWeekly
                ));
            }
        }
        return rows;
    }

    private String getString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue().trim();
            case NUMERIC: 
                // In case a number (like group 1) is typed, convert to string safely
                long val = (long) cell.getNumericCellValue();
                if (cell.getNumericCellValue() == val) {
                    return String.valueOf(val);
                } else {
                    return String.valueOf(cell.getNumericCellValue());
                }
            default: return "";
        }
    }

    private double getNumeric(Cell cell) {
        if (cell == null) return 0;
        if (cell.getCellType() == CellType.NUMERIC) return cell.getNumericCellValue();
        if (cell.getCellType() == CellType.STRING) {
            try { return Double.parseDouble(cell.getStringCellValue().trim()); } 
            catch (NumberFormatException e) { return 0; }
        }
        return 0;
    }
}
