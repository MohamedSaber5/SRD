package com.aast.booking.patterns.strategy;

import java.util.List;

/**
 * STRATEGY PATTERN (Prompt 10) — Ramadan Mode Concrete Strategy
 *
 * Applies when Ramadan mode is ON.
 * - Shortened day slots: 08:00 → 16:00 (hourly)
 * - Time range validation: bookings must end at or before 16:00
 * - Multi-purpose rooms: no fixed start time (free choice up to 16:00)
 * - Multi-purpose max end hour: 16 (4:00 PM)
 *
 * Mirrors the Ramadan rules in the React web app.
 */
public class RamadanAvailabilityStrategy implements IAvailabilityStrategy {

    /** Ramadan hourly slots — mirrors getHourOptions(16). */
    private static final List<String> SLOTS = List.of(
        "09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"
    );

    @Override
    public List<String> getAvailableTimeSlots() {
        return SLOTS;
    }

    @Override
    public boolean isValidTimeRange(String timeFrom, String timeTo) {
        int toMins = timeToMinutes(timeTo);
        int maxMins = timeToMinutes("16:00");
        return toMins <= maxMins;
    }

    @Override
    public String getMultiPurposeFixedTime() {
        // No fixed time — admin/user can pick freely
        return null;
    }

    @Override
    public int getMultiPurposeMaxHour() {
        return 16;
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
