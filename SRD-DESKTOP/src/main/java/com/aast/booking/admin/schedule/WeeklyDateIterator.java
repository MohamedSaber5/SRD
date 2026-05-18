package com.aast.booking.admin.schedule;

import com.aast.booking.admin.search.LectureSlot;
import com.aast.booking.admin.search.RoomSlotConfig;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * SOLID: SRP — only generates the list of booking dates for a lecture.
 *        Knows nothing about rooms, Firestore, or UI.
 *
 * Logic:
 *   - Term = 16 weeks starting from startDate.
 *   - biWeekly=false: all 16 weeks (startDate, +7, +14, ..., +105)
 *   - biWeekly=true:  every other week — week 1,3,5,7,9,11,13,15
 *                     (startDate, +14, +28, ..., +98) = 8 occurrences
 *
 * Also resolves slotIndex → (timeFrom, timeTo) via RoomSlotConfig.
 */
public class WeeklyDateIterator {

    private static final int TERM_WEEKS = 16;

    /**
     * Generate dates on which this lecture will occur.
     *
     * @param startDate ISO date of the FIRST occurrence (e.g. "2026-09-06")
     * @param biWeekly  true = every 2 weeks, false = every week
     * @return ordered list of LocalDate for every booking occurrence in the term
     */
    public List<LocalDate> generateDates(String startDate, boolean biWeekly) {
        LocalDate first = LocalDate.parse(startDate);
        List<LocalDate> dates = new ArrayList<>();
        int step = biWeekly ? 2 : 1; // weeks to jump each time
        int occurrences = biWeekly ? TERM_WEEKS / 2 : TERM_WEEKS;

        for (int i = 0; i < occurrences; i++) {
            dates.add(first.plusWeeks((long) i * step));
        }
        return dates;
    }

    /**
     * Resolves a 1-based slot index to the actual LectureSlot (timeFrom, timeTo).
     *
     * @param periodIndex 1-16 (e.g. 5 = الفترة الخامسة)
     * @param isBiWeekly  whether this lecture is every 2 weeks
     * @param isRamadan   whether Ramadan mode is active
     * @return the LectureSlot, or null if index out of range
     */
    public LectureSlot resolveSlot(int periodIndex, boolean isBiWeekly, boolean isRamadan) {
        String timeFrom = getPeriodStartTime(periodIndex);
        String timeTo;
        if (isBiWeekly) {
            timeTo = getPeriodEndTime(periodIndex); // covers only periodIndex
        } else {
            timeTo = getPeriodEndTime(periodIndex + 1); // covers periodIndex, periodIndex+1
        }
        
        String label = "الفترة " + periodIndex + (isBiWeekly ? "" : " + " + (periodIndex + 1));
        return new LectureSlot(timeFrom, timeTo, label);
    }

    public LectureSlot resolveSlot(int slotIndex, boolean isRamadan) {
        return resolveSlot(slotIndex, false, isRamadan);
    }

    public LectureSlot resolveSlot(int startSlot, int endSlot, boolean isRamadan) {
        String timeFrom = getPeriodStartTime(startSlot);
        String timeTo = getPeriodEndTime(endSlot);
        String label = "سلوت " + startSlot + " - " + endSlot;
        return new LectureSlot(timeFrom, timeTo, label);
    }

    private String getPeriodStartTime(int period) {
        switch (period) {
            case 1: return "08:30";
            case 2: return "09:30";
            case 3: return "10:30";
            case 4: return "11:30";
            case 5: return "12:30";
            case 6: return "13:30";
            case 7: return "14:30";
            case 8: return "15:30";
            case 9: return "16:30";
            case 10: return "17:30";
            case 11: return "18:30";
            case 12: return "19:30";
            case 13: return "20:30";
            case 14: return "21:30";
            case 15: return "22:30";
            case 16: return "23:30";
            default: return "08:30";
        }
    }
    
    private String getPeriodEndTime(int period) {
        switch (period) {
            case 1: return "09:30";
            case 2: return "10:30";
            case 3: return "11:30";
            case 4: return "12:30";
            case 5: return "13:30";
            case 6: return "14:30";
            case 7: return "15:30";
            case 8: return "16:30";
            case 9: return "17:30";
            case 10: return "18:30";
            case 11: return "19:30";
            case 12: return "20:30";
            case 13: return "21:30";
            case 14: return "22:30";
            case 15: return "23:30";
            case 16: return "00:30";
            default: return "10:30";
        }
    }
}
