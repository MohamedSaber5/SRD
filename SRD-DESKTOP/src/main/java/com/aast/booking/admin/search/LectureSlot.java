package com.aast.booking.admin.search;

/**
 * SOLID: Single Responsibility — immutable value object for a lecture time slot.
 *
 * Mirrors REGULAR_SLOTS / RAMADAN_SLOTS arrays from the web's useBookingForm.js.
 * Carries the display label (shown in ComboBox) and the raw 24h from/to times
 * (used for overlap detection against bookings in Firestore).
 */
public class LectureSlot {

    private final String from;
    private final String to;
    private final String label;

    public LectureSlot(String from, String to, String label) {
        this.from  = from;
        this.to    = to;
        this.label = label;
    }

    public String getFrom()  { return from; }
    public String getTo()    { return to; }
    public String getLabel() { return label; }

    @Override
    public String toString() { return label; }
}
