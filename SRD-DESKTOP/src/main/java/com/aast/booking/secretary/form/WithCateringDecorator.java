package com.aast.booking.secretary.form;

import com.aast.booking.models.BookingRequest;

public class WithCateringDecorator extends BookingDecorator {

    public WithCateringDecorator(BookingService service) {
        super(service);
    }

    @Override
    public String getDescription() {
        return super.getDescription() + ", with Catering Service";
    }

    @Override
    public double getCost() {
        return super.getCost() + 100.0; // Additional cost for catering
    }

    @Override
    public void applyTo(BookingRequest request) {
        super.applyTo(request);
        request.setTotalCost(getCost());
    }
}
