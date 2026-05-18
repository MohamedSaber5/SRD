package com.aast.booking.admin.search;

import java.util.List;

/**
 * SOLID: Single Responsibility — this class ONLY defines the time slot data.
 *        It is the single source of truth for slot definitions (mirrors useBookingForm.js).
 *
 * Used by AdvancedSearchController to populate the lecture slot ComboBox.
 * Respects Ramadan mode by returning a different slot list.
 *
 * Hour options for multi-purpose rooms mirror the web's getHourOptions() utility:
 *   generates hourly steps from 08:00 to maxTime (23:00 normal / 17:00 Ramadan).
 */
public class RoomSlotConfig {

    private RoomSlotConfig() { /* utility — not instantiable */ }

    // ── Regular Lecture Slots (mirrors REGULAR_SLOTS in useBookingForm.js) ──

    public static final List<LectureSlot> REGULAR_SLOTS = List.of(
        new LectureSlot("08:30", "10:30", "الفترة 1 + 2 (8:30 ص - 10:30 ص)"),
        new LectureSlot("10:30", "12:30", "الفترة 3 + 4 (10:30 ص - 12:30 م)"),
        new LectureSlot("12:30", "14:30", "الفترة 5 + 6 (12:30 م - 2:30 م)"),
        new LectureSlot("14:30", "16:30", "الفترة 7 + 8 (2:30 م - 4:30 م)"),
        new LectureSlot("16:30", "18:30", "الفترة 9 + 10 (4:30 م - 6:30 م)"),
        new LectureSlot("18:30", "20:30", "الفترة 11 + 12 (6:30 م - 8:30 م)"),
        new LectureSlot("20:30", "22:30", "الفترة 13 + 14 (8:30 م - 10:30 م)"),
        new LectureSlot("22:30", "00:30", "الفترة 15 + 16 (10:30 م - 12:30 ص)")
    );

    // ── Ramadan Lecture Slots (mirrors RAMADAN_SLOTS in useBookingForm.js) ──

    public static final List<LectureSlot> RAMADAN_SLOTS = List.of(
        new LectureSlot("09:30", "10:25", "الفترة الأولى   (9:30 ص - 10:25 ص)"),
        new LectureSlot("10:30", "11:25", "الفترة الثانية  (10:30 ص - 11:25 ص)"),
        new LectureSlot("11:30", "12:25", "الفترة الثالثة  (11:30 ص - 12:25 م)"),
        new LectureSlot("12:30", "13:25", "الفترة الرابعة  (12:30 م - 1:25 م)"),
        new LectureSlot("13:30", "14:25", "الفترة الخامسة  (1:30 م - 2:25 م)"),
        new LectureSlot("14:30", "15:25", "الفترة السادسة  (2:30 م - 3:25 م)"),
        new LectureSlot("15:30", "16:25", "الفترة السابعة  (3:30 م - 4:25 م)"),
        new LectureSlot("16:30", "17:25", "الفترة الثامنة  (4:30 م - 5:25 م)")
    );

    // ── Hour options for multi-purpose rooms (mirrors getHourOptions()) ───

    /**
     * Returns hourly options from 08:00 to maxHour (inclusive).
     * Normal mode: maxHour = 23.  Ramadan mode: maxHour = 17.
     */
    public static List<LectureSlot> getHourOptions(int maxHour) {
        List<LectureSlot> options = new java.util.ArrayList<>();
        for (int h = 8; h <= maxHour; h++) {
            String value = String.format("%02d:00", h);
            String label = formatTime(value);
            options.add(new LectureSlot(value, value, label)); // from==to — controller only uses from
        }
        return options;
    }

    /**
     * Converts 24h "HH:mm" to 12h Arabic label (e.g. "8:00 ص", "2:00 م").
     * Mirrors the web's formatTime() utility.
     */
    public static String formatTime(String time24) {
        if (time24 == null || !time24.contains(":")) return time24;
        String[] parts = time24.split(":");
        int hour = Integer.parseInt(parts[0]);
        int min  = Integer.parseInt(parts[1]);
        String suffix = (hour < 12) ? "ص" : "م";
        int h12 = hour % 12;
        if (h12 == 0) h12 = 12;
        return String.format("%d:%02d %s", h12, min, suffix);
    }

    /** Returns the active slot list based on Ramadan mode. */
    public static List<LectureSlot> getActiveSlots(boolean isRamadanMode) {
        return isRamadanMode ? RAMADAN_SLOTS : REGULAR_SLOTS;
    }

    /** Returns the max end-hour for multi rooms (mirrors multiMaxTime in web). */
    public static int getMultiMaxHour(boolean isRamadanMode) {
        return isRamadanMode ? 17 : 23;
    }
}
