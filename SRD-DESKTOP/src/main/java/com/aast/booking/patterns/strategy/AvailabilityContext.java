package com.aast.booking.patterns.strategy;

import java.util.List;

/**
 * STRATEGY PATTERN (Prompt 10) — Context
 *
 * The single object that controllers hold. Switching between Normal and Ramadan
 * mode is a one-liner: {@code context.setStrategy(isRamadan)}.
 *
 * Controllers use this context to:
 *  1. Populate time ComboBoxes:  {@link #getSlots()}
 *  2. Validate submitted ranges: {@link #validate(String, String)}
 *  3. Apply Ramadan constraints: {@link #getMultiPurposeFixedTime()} / {@link #getMultiPurposeMaxHour()}
 *
 * Usage example — in any booking controller's initialize() + after fetchRamadanMode():
 * <pre>
 *   private final AvailabilityContext availabilityContext = new AvailabilityContext();
 *
 *   // in initialize():
 *   systemFacade.fetchRamadanMode(isRamadan -> {
 *       availabilityContext.setStrategy(isRamadan);
 *       refreshTimeSlots();
 *   });
 *
 *   private void refreshTimeSlots() {
 *       List&lt;String&gt; slots = availabilityContext.getSlots();
 *       timeFromCombo.setItems(FXCollections.observableArrayList(slots));
 *       timeToCombo.setItems(FXCollections.observableArrayList(slots));
 *   }
 * </pre>
 */
public class AvailabilityContext {

    private IAvailabilityStrategy strategy;

    /** Starts with Normal strategy as the safe default. */
    public AvailabilityContext() {
        this.strategy = new NormalAvailabilityStrategy();
    }

    /**
     * Switches the active strategy based on the Ramadan mode flag.
     * Call this after {@code SystemFacade.fetchRamadanMode()} resolves.
     *
     * @param isRamadan true → {@link RamadanAvailabilityStrategy},
     *                  false → {@link NormalAvailabilityStrategy}
     */
    public void setStrategy(boolean isRamadan) {
        this.strategy = isRamadan
            ? new RamadanAvailabilityStrategy()
            : new NormalAvailabilityStrategy();
    }

    /** Direct injection of a custom strategy (useful for testing). */
    public void setStrategy(IAvailabilityStrategy strategy) {
        this.strategy = strategy;
    }

    // ── Delegate to active strategy ────────────────────────────────────────

    /** Available start-time slots for the active mode. */
    public List<String> getSlots() {
        return strategy.getAvailableTimeSlots();
    }

    /**
     * Validates whether the given time range is allowed.
     * Returns false in Ramadan mode if timeFrom ≥ 14:00.
     */
    public boolean validate(String timeFrom, String timeTo) {
        return strategy.isValidTimeRange(timeFrom, timeTo);
    }

    /**
     * Returns the fixed multi-purpose start time for Ramadan ("17:25"), or null for Normal.
     * Controllers should pre-select this value if non-null.
     */
    public String getMultiPurposeFixedTime() {
        return strategy.getMultiPurposeFixedTime();
    }

    /** Max hour for multi-purpose room booking: 17 (Ramadan) or 23 (Normal). */
    public int getMultiPurposeMaxHour() {
        return strategy.getMultiPurposeMaxHour();
    }

    /** Human-readable mode name for display ("وضع عادي" / "وضع رمضان 🌙"). */
    public String getModeName() {
        return strategy.getModeName();
    }

    /** Returns true if the active strategy is Ramadan mode. */
    public boolean isRamadanMode() {
        return strategy instanceof RamadanAvailabilityStrategy;
    }
}
