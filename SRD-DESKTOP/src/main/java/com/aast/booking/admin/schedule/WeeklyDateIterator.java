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
     * @param slotIndex   1-8 (1 = المحاضرة الأولى)
     * @param isRamadan   whether Ramadan mode is active
     * @return the LectureSlot, or null if index out of range
     */
    public LectureSlot resolveSlot(int slotIndex, boolean isRamadan) {
        List<LectureSlot> slots = RoomSlotConfig.getActiveSlots(isRamadan);
        int idx = slotIndex - 1; // convert to 0-based
        if (idx < 0 || idx >= slots.size()) return null;
        return slots.get(idx);
    }
}
