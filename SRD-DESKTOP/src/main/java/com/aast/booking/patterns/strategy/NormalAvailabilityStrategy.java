package com.aast.booking.patterns.strategy;

import java.util.List;

/**
 * STRATEGY PATTERN (Prompt 10) — Normal Mode Concrete Strategy
 *
 * Applies when Ramadan mode is OFF.
 * - Full working day slots: 08:00 → 23:00 (hourly)
 * - No time-range restrictions
 * - No fixed multi-purpose start time (any hour allowed)
 *
 * Slot list mirrors {@code getHourOptions(23)} from the existing {@code RoomSlotConfig}.
 */
public class NormalAvailabilityStrategy implements IAvailabilityStrategy {

    /** Hourly slots from 08:00 to 23:00 — mirrors web getHourOptions(23). */
    private static final List<String> SLOTS = List.of(
        "08:00","09:00","10:00","11:00","12:00","13:00",
        "14:00","15:00","16:00","17:00","18:00","19:00",
        "20:00","21:00","22:00","23:00"
    );

    @Override
    public List<String> getAvailableTimeSlots() {
        return SLOTS;
    }

    @Override
    public boolean isValidTimeRange(String timeFrom, String timeTo) {
        // Normal mode has no time restrictions — all ranges are valid
        return true;
    }

    @Override
    public String getMultiPurposeFixedTime() {
        // No fixed time — admin/user can pick freely
        return null;
    }

    @Override
    public int getMultiPurposeMaxHour() {
        return 23;
    }

    @Override
    public String getModeName() {
        return "وضع عادي";
    }
}
