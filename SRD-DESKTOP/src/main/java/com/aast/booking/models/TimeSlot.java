package com.aast.booking.models;

import java.util.Arrays;
import java.util.List;

/**
 * Represents a time slot for booking.
 * Mirrors REGULAR_SLOTS and RAMADAN_SLOTS arrays in useBookingForm.js
 * Labels use 12-hour AM/PM format for better readability.
 */
public class TimeSlot {
    private final String from;   // internal 24h value stored in Firestore
    private final String to;
    private final String label;  // displayed in 12h format

    public TimeSlot(String from, String to, String label) {
        this.from = from;
        this.to = to;
        this.label = label;
    }

    // ── REGULAR_SLOTS ──────────────────────────────────────────────────────
    public static final List<TimeSlot> REGULAR_SLOTS = Arrays.asList(
        new TimeSlot("08:30", "10:10", "المحاضرة الأولى   •   8:30 ص – 10:10 ص"),
        new TimeSlot("10:30", "12:10", "المحاضرة الثانية  •   10:30 ص – 12:10 م"),
        new TimeSlot("12:30", "14:10", "المحاضرة الثالثة  •   12:30 م – 2:10 م"),
        new TimeSlot("14:30", "16:10", "المحاضرة الرابعة  •   2:30 م – 4:10 م"),
        new TimeSlot("16:30", "18:10", "المحاضرة الخامسة  •   4:30 م – 6:10 م"),
        new TimeSlot("18:30", "20:10", "المحاضرة السادسة  •   6:30 م – 8:10 م"),
        new TimeSlot("20:30", "22:10", "المحاضرة السابعة  •   8:30 م – 10:10 م"),
        new TimeSlot("22:30", "00:10", "المحاضرة الثامنة  •   10:30 م – 12:10 ص")
    );

    // ── RAMADAN_SLOTS ──────────────────────────────────────────────────────
    public static final List<TimeSlot> RAMADAN_SLOTS = Arrays.asList(
        new TimeSlot("09:30", "10:25", "الفترة الأولى   •   9:30 ص – 10:25 ص"),
        new TimeSlot("10:30", "11:25", "الفترة الثانية  •   10:30 ص – 11:25 ص"),
        new TimeSlot("11:30", "12:25", "الفترة الثالثة  •   11:30 ص – 12:25 م"),
        new TimeSlot("12:30", "13:25", "الفترة الرابعة  •   12:30 م – 1:25 م"),
        new TimeSlot("13:30", "14:25", "الفترة الخامسة  •   1:30 م – 2:25 م"),
        new TimeSlot("14:30", "15:25", "الفترة السادسة  •   2:30 م – 3:25 م"),
        new TimeSlot("15:30", "16:25", "الفترة السابعة  •   3:30 م – 4:25 م"),
        new TimeSlot("16:30", "17:25", "الفترة الثامنة  •   4:30 م – 5:25 م")
    );

    // ── Hour options for multi-purpose rooms (12h format display, 24h value) ──
    // Format: "HH:mm|h:mm ص/م" — we just show the label, store the 24h value
    public static final List<String> HOUR_OPTIONS = Arrays.asList(
        "08:00","09:00","10:00","11:00","12:00","13:00","14:00",
        "15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"
    );

    // 12h display for hour options
    public static String to12h(String h24) {
        if (h24 == null) return "";
        try {
            String[] parts = h24.split(":");
            int hour = Integer.parseInt(parts[0]);
            int min  = Integer.parseInt(parts[1]);
            String period = hour < 12 ? "ص" : "م";
            int h12 = hour % 12;
            if (h12 == 0) h12 = 12;
            return String.format("%d:%02d %s", h12, min, period);
        } catch (Exception e) { return h24; }
    }

    public String getFrom()  { return from; }
    public String getTo()    { return to; }
    public String getLabel() { return label; }

    @Override
    public String toString() { return label; }
}
