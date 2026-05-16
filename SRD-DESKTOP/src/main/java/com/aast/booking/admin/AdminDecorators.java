package com.aast.booking.admin;

import com.aast.booking.models.Booking;

class AdminOfficialDecorator extends AdminBookingDecorator {
    public AdminOfficialDecorator(Booking booking) { super(booking); }
    @Override
    public void decorate() {
        booking.setPurpose("[رسمي] " + booking.getPurpose());
        // Could also set a flag if the model had one
    }
}

class AdminHolidayDecorator extends AdminBookingDecorator {
    public AdminHolidayDecorator(Booking booking) { super(booking); }
    @Override
    public void decorate() {
        booking.setPurpose(booking.getPurpose() + " (خارج أوقات العمل)");
    }
}
