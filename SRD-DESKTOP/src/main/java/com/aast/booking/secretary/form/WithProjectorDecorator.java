package com.aast.booking.secretary.form;

import com.aast.booking.models.BookingRequest;

public class WithProjectorDecorator extends BookingDecorator {

    public WithProjectorDecorator(BookingService service) {
        super(service);
    }

    @Override
    public String getDescription() {
        return super.getDescription() + ", with Projector";
    }

    @Override
    public double getCost() {
        return super.getCost() + 25.0; // Additional cost for projector
    }

    @Override
    public void applyTo(BookingRequest request) {
        super.applyTo(request);
        request.setTotalCost(getCost());
    }
}
