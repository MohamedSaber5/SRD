package com.aast.booking.patterns.strategy;

import java.util.List;

/**
 * STRATEGY PATTERN (Prompt 10) — Ramadan Mode Concrete Strategy
 *
 * Applies when Ramadan mode is ON.
 * - Shortened day slots: 08:00 → 14:00 (hourly)
 * - Time range validation: no bookings starting at 14:00 or later
 * - Multi-purpose rooms: fixed start time at 17:25 (إفطار window)
 * - Multi-purpose max end hour: 17
 *
 * Mirrors the Ramadan rules in the React web app's useBookingForm.js.
 */
public class RamadanAvailabilityStrategy implements IAvailabilityStrategy {

    /** Ramadan hourly slots — mirrors getHourOptions(17) in the web app. */
    private static final List<String> SLOTS = List.of(
        "08:00","09:00","10:00","11:00","12:00","13:00","14:00","17:25"
    );

    @Override
    public List<String> getAvailableTimeSlots() {
        return SLOTS;
    }

    @Override
    public boolean isValidTimeRange(String timeFrom, String timeTo) {
        // Ramadan rule: bookings must start before 14:00
        int fromMins = timeToMinutes(timeFrom);
        int cutoffMins = timeToMinutes("14:00");
        return fromMins <= cutoffMins;
    }

    @Override
    public String getMultiPurposeFixedTime() {
        // Multi-purpose rooms in Ramadan must start at 17:25 (إفطار time)
        return "17:25";
    }

    @Override
    public int getMultiPurposeMaxHour() {
        return 17;
    }

    @Override
    public String getModeName() {
        return "وضع رمضان 🌙";
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private int timeToMinutes(String time) {
        if (time == null || !time.contains(":")) return 0;
        String[] parts = time.split(":");
        try {
            return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
