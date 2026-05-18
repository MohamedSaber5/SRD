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
            Row headerRow = sheet.getRow(0);

            // Default column indices based on standard 12-column layout
            int colCollege = 0;
            int colDept = 1;
            int colSubj = 2;
            int colSubjCode = 3;
            int colLecturer = 4;
            int colType = 5;
            int colCap = 6;
            int colAcademicPeriod = 7; // Default Period column (Semester)
            int colDailySlots = -1;    // No daily slots by default
            int colDay = 8;
            int colDate = 9;
            int colGroup = 10;
            int colBiWeekly = 11;

            if (headerRow != null) {
                int lastCellNum = headerRow.getLastCellNum();
                boolean hasLevelOrTermColumn = false;
                
                // Let's first search for "المستوى", "الترم" or "semester" to see if there is an academic semester column
                for (int c = 0; c < lastCellNum; c++) {
                    String header = getString(headerRow.getCell(c)).toLowerCase();
                    if (header.contains("ترم") || header.contains("مستوى") || header.contains("level") || header.contains("semester")) {
                        hasLevelOrTermColumn = true;
                        break;
                    }
                }
                
                for (int c = 0; c < lastCellNum; c++) {
                    String header = getString(headerRow.getCell(c)).toLowerCase();
                    
                    if (header.contains("كلية") || header.contains("college")) {
                        colCollege = c;
                    } else if (header.contains("قسم") || header.contains("dept") || header.contains("department")) {
                        colDept = c;
                    } else if (header.contains("كود") || header.contains("code")) {
                        colSubjCode = c;
                    } else if (header.contains("مادة") || header.contains("ماده") || header.contains("subject") || header.contains("course")) {
                        // Avoid overriding if we already matched subject code
                        if (c != colSubjCode) colSubj = c;
                    } else if (header.contains("محاضر") || header.contains("lecturer") || header.contains("doctor")) {
                        colLecturer = c;
                    } else if (header.contains("نوع") || header.contains("type")) {
                        colType = c;
                    } else if (header.contains("سعة") || header.contains("سعه") || header.contains("capacity") || header.contains("cap")) {
                        colCap = c;
                    } else if (header.contains("يوم") || header.contains("day")) {
                        colDay = c;
                    } else if (header.contains("تاريخ") || header.contains("date")) {
                        colDate = c;
                    } else if (header.contains("جروب") || header.contains("مجموعة") || header.contains("group")) {
                        colGroup = c;
                    } else if (header.contains("أسبوعين") || header.contains("weekly")) {
                        colBiWeekly = c;
                    } else if (header.contains("ترم") || header.contains("مستوى") || header.contains("level") || header.contains("semester")) {
                        colAcademicPeriod = c;
                    } else if (header.contains("فترة") || header.contains("فتره") || header.contains("حصص") || header.contains("slot") || header.contains("period")) {
                        if (hasLevelOrTermColumn) {
                            colDailySlots = c;
                        } else {
                            colAcademicPeriod = c;
                        }
                    }
                }
            }

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

                String college = getString(row.getCell(colCollege));
                String dept = getString(row.getCell(colDept));
                String subj = getString(row.getCell(colSubj));
                String subjCode = getString(row.getCell(colSubjCode));
                String lecturer = getString(row.getCell(colLecturer));
                String type = getString(row.getCell(colType));
                int cap = (int) getNumeric(row.getCell(colCap));
                
                String periodVal = getString(row.getCell(colAcademicPeriod));
                int academicPeriod = 1;
                if (!periodVal.isEmpty()) {
                    try {
                        academicPeriod = (int) Double.parseDouble(periodVal.replaceAll("[^0-9.]", ""));
                    } catch (Exception ignored) {}
                }

                int startSlot = 1;
                int endSlot = 1;
                String day = getString(row.getCell(colDay));
                
                String dateStr = "";
                Cell dateCell = row.getCell(colDate);
                if (dateCell != null) {
                    if (dateCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dateCell)) {
                        dateStr = df.format(dateCell.getDateCellValue());
                    } else {
                        dateStr = getString(dateCell);
                    }
                }

                String group = getString(row.getCell(colGroup));
                int biWeeklyFlag = (int) getNumeric(row.getCell(colBiWeekly));
                boolean biWeekly = (biWeeklyFlag == 1);

                if (colDailySlots != -1) {
                    String dailySlotsVal = getString(row.getCell(colDailySlots));
                    int[] slots = parsePeriodToSlots(dailySlotsVal);
                    startSlot = slots[0];
                    endSlot = slots[1];
                } else {
                    // Standard 12-column fallback (Dynamic resolution based on course codes)
                    String cleanCode = subjCode.trim().toUpperCase();
                    String cleanSubj = subj.trim().toUpperCase();
                    String cleanType = type.trim().toLowerCase();

                    // Map Designing Human Centered Software (CSE3201)
                    if (cleanCode.contains("3201") || cleanSubj.contains("HUMAN") || cleanSubj.contains("CENTERED")) {
                        if (cleanType.equals("lecture")) {
                            startSlot = 7;
                            endSlot = 9;
                        } else {
                            startSlot = 1;
                            endSlot = 4;
                        }
                    }
                    // Map Software Component Design (CSE3202)
                    else if (cleanCode.contains("3202") || cleanSubj.contains("COMPONENT")) {
                        if (cleanType.equals("lecture")) {
                            startSlot = 5;
                            endSlot = 6;
                        } else {
                            startSlot = 1;
                            endSlot = 4;
                        }
                    }
                    // Map Computing Algorithms (CCS3403)
                    else if (cleanCode.contains("3403") || cleanSubj.contains("ALGORITHMS")) {
                        if (cleanType.equals("lecture")) {
                            startSlot = 7;
                            endSlot = 9;
                        } else {
                            startSlot = 5;
                            endSlot = 6;
                        }
                    }
                    // Map Numerical Methods (CCS3002)
                    else if (cleanCode.contains("3002") || cleanSubj.contains("NUMERICAL")) {
                        if (cleanType.equals("lecture")) {
                            startSlot = 7;
                            endSlot = 9;
                        } else {
                            startSlot = 5;
                            endSlot = 6;
                        }
                    }
                    // Map Professional Training (CIT3101)
                    else if (cleanCode.contains("3101") || cleanSubj.contains("TRAINING") || cleanSubj.contains("PROFESSIONAL")) {
                        startSlot = 5;
                        endSlot = 6;
                    }
                    // Map Advanced Statistics (EBA3201)
                    else if (cleanCode.contains("3201") || cleanSubj.contains("STATISTICS")) {
                        startSlot = 1;
                        endSlot = 4;
                    }
                    // Fallback defaults
                    else {
                        if (cleanType.equals("lecture")) {
                            startSlot = 5;
                            endSlot = 6;
                        } else {
                            startSlot = 1;
                            endSlot = 4;
                        }
                    }
                }

                rows.add(new LectureScheduleRow(
                        college, dept, subj, subjCode, lecturer, type,
                        cap, academicPeriod, startSlot, endSlot, day, dateStr, group, biWeekly
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

    private int parseSlotCell(Cell cell) {
        if (cell == null) return 1;
        String val = "";
        if (cell.getCellType() == CellType.STRING) {
            val = cell.getStringCellValue().trim();
        } else if (cell.getCellType() == CellType.NUMERIC) {
            double d = cell.getNumericCellValue();
            val = String.valueOf((int) d);
        }
        
        if (val.isEmpty()) return 1;
        
        String lowerVal = val.toLowerCase();
        
        // 1. If it contains period labels or hourly slots
        if (lowerVal.contains("الأولى") || lowerVal.contains("اولى") || lowerVal.contains("08:30") || lowerVal.contains("8:30")) {
            return 1;
        }
        if (lowerVal.contains("الثانية") || lowerVal.contains("ثانيه") || lowerVal.contains("10:30")) {
            return 3;
        }
        if (lowerVal.contains("الثالثة") || lowerVal.contains("ثالثه") || lowerVal.contains("12:30")) {
            return 5;
        }
        if (lowerVal.contains("الرابعة") || lowerVal.contains("رابعه") || lowerVal.contains("14:30") || lowerVal.contains("2:30")) {
            return 7;
        }
        if (lowerVal.contains("الخامسة") || lowerVal.contains("خامسه") || lowerVal.contains("16:30") || lowerVal.contains("4:30")) {
            return 9;
        }
        if (lowerVal.contains("السادسة") || lowerVal.contains("سادسه") || lowerVal.contains("18:30") || lowerVal.contains("6:30")) {
            return 11;
        }
        if (lowerVal.contains("السابعة") || lowerVal.contains("سابعه") || lowerVal.contains("20:30") || lowerVal.contains("8:30")) {
            return 13;
        }
        if (lowerVal.contains("الثامنة") || lowerVal.contains("ثامنه") || lowerVal.contains("22:30") || lowerVal.contains("10:30")) {
            return 15;
        }
        
        // Try parsing period number (e.g. 1 to 8, or 1 to 16)
        try {
            double parsed = Double.parseDouble(lowerVal.replaceAll("[^0-9.]", ""));
            int intVal = (int) parsed;
            if (intVal >= 1 && intVal <= 8) {
                return (intVal * 2) - 1; // Map Period 1..8 -> hourly slot 1, 3, 5, 7, 9, 11, 13, 15
            }
            if (intVal >= 1 && intVal <= 16) {
                return intVal;
            }
        } catch (Exception ignored) {}
        
        return 1;
    }

    private int[] parsePeriodToSlots(String val) {
        if (val == null || val.trim().isEmpty()) {
            return new int[]{1, 2}; // default first period
        }
        
        String clean = val.trim().toLowerCase()
                          .replace(" ", "")
                          .replace("و", "-")
                          .replace(",", "-")
                          .replace("إلى", "-")
                          .replace("الى", "-");
                          
        // Strip text but keep numbers and dashes
        clean = clean.replaceAll("[^0-9\\-]", "");
        
        if (clean.isEmpty()) {
            return new int[]{1, 2};
        }
        
        try {
            if (clean.contains("-")) {
                String[] parts = clean.split("-");
                int p1 = (int) Double.parseDouble(parts[0]);
                int p2 = (int) Double.parseDouble(parts[1]);
                
                // Ranges are treated as raw hourly slots directly
                return new int[]{p1, p2};
            } else {
                int p = (int) Double.parseDouble(clean);
                if (p >= 1 && p <= 6) {
                    // Single daily lecture period [1..6] -> maps to 2 hourly slots
                    int s1 = (p * 2) - 1;
                    int s2 = p * 2;
                    return new int[]{s1, s2};
                } else {
                    // Treat as raw hourly slot
                    return new int[]{p, p};
                }
            }
        } catch (Exception e) {
            return new int[]{1, 2};
        }
    }
}
