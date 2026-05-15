package com.aast.booking.secretary.form;

import com.aast.booking.models.BookingRequest;

/**
 * DESIGN PATTERN: Decorator (Component Interface)
 */
public interface BookingService {
    String getDescription();
    double getCost();
    void applyTo(BookingRequest request);
}
