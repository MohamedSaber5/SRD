package com.aast.booking.admin;

import com.aast.booking.models.Booking;

/**
 * DESIGN PATTERN: Decorator
 * Abstract base for booking decorators.
 */
public abstract class AdminBookingDecorator {
    protected Booking booking;

    public AdminBookingDecorator(Booking booking) {
        this.booking = booking;
    }

    public abstract void decorate();
}
