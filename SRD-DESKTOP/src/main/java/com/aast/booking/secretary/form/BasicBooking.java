package com.aast.booking.secretary.form;

import com.aast.booking.models.BookingRequest;

public class BasicBooking implements BookingService {
    @Override
    public String getDescription() {
        return "Basic Room Booking";
    }

    @Override
    public double getCost() {
        return 50.0; // Base cost
    }

    @Override
    public void applyTo(BookingRequest request) {
        request.setTotalCost(getCost());
    }
}
