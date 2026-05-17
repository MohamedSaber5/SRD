package com.aast.booking.patterns.strategy;

import java.util.List;

/**
 * STRATEGY PATTERN (Prompt 10) — Availability Strategy Interface
 *
 * Problem: Time slot availability differs between Normal and Ramadan mode.
 * Multiple controllers (Admin, Secretary, BranchManager) all hardcode their own slot lists.
 *
 * Solution: Extract the slot logic into interchangeable strategies so that
 * switching modes is a one-liner: AvailabilityContext.setStrategy(isRamadan).
 *
 * Concrete implementations:
 *   - {@link NormalAvailabilityStrategy}  — full day slots 08:00 → 23:00
 *   - {@link RamadanAvailabilityStrategy} — shortened day 08:00 → 14:00, fixed multi-purpose at 17:25
 */
public interface IAvailabilityStrategy {

    /**
     * Returns the ordered list of available start-time slots for this mode.
     * Format: "HH:mm" (24h) — e.g. "08:00", "09:30".
     */
    List<String> getAvailableTimeSlots();

    /**
     * Validates whether a given time range is acceptable in this mode.
     * Used before submitting or approving a booking to guard rule violations.
     *
     * @param timeFrom start time "HH:mm"
     * @param timeTo   end time   "HH:mm"
     * @return true if the range is allowed
     */
    boolean isValidTimeRange(String timeFrom, String timeTo);

    /**
     * Multi-purpose room constraint: in Ramadan mode the allowed start time is fixed.
     * Returns the fixed time string (e.g. "17:25") or {@code null} if no constraint (Normal mode).
     */
    String getMultiPurposeFixedTime();

    /**
     * Returns the maximum end hour for multi-purpose room bookings.
     * Normal = 23, Ramadan = 17.
     */
    int getMultiPurposeMaxHour();

    /** Human-readable label for display (e.g. in header or tooltip). */
    String getModeName();
}
