package com.aast.booking.patterns.decorator;

import com.aast.booking.models.Booking;

/**
 * DESIGN PATTERN: Decorator — Concrete Component
 *
 * The base (non-decorated) wrapper around a plain {@link Booking}.
 * Represents a booking with default / normal priority.
 *
 * This is the starting point of the Decorator chain:
 *   IBookingComponent component = new BaseBookingComponent(booking);
 *   // Optionally wrap:
 *   if (isUrgent) component = new UrgentRequestDecorator(component);
 *   Booking result = component.getBooking(); // modified booking ready for save
 */
public class BaseBookingComponent implements IBookingComponent {

    private final Booking booking;

    /**
     * @param booking the raw Booking to wrap. Must not be null.
     */
    public BaseBookingComponent(Booking booking) {
        if (booking == null) throw new IllegalArgumentException("BaseBookingComponent: booking must not be null");
        this.booking = booking;
    }

    @Override
    public Booking getBooking() {
        return booking;
    }

    @Override
    public String getDisplayPriority() {
        return "normal";
    }
}
