package com.aast.booking.secretary.form;

import com.aast.booking.models.BookingRequest;

public abstract class BookingDecorator implements BookingService {
    protected BookingService wrappedService;

    public BookingDecorator(BookingService service) {
        this.wrappedService = service;
    }

    @Override
    public String getDescription() {
        return wrappedService.getDescription();
    }

    @Override
    public double getCost() {
        return wrappedService.getCost();
    }

    @Override
    public void applyTo(BookingRequest request) {
        wrappedService.applyTo(request);
    }
}
