package com.aast.booking.secretary.form;

/**
 * DESIGN PATTERN: Decorator
 * Adds Holiday priority logic.
 */
public class HolidayDecorator extends BookingDecorator {

    public HolidayDecorator(BookingService decoratedService) {
        super(decoratedService);
    }

    @Override
    public void applyTo(com.aast.booking.models.BookingRequest request) {
        super.applyTo(request);
        // Maybe add some metadata or just update the description
    }

    @Override
    public String getDescription() {
        return super.getDescription() + " - (يضيف نقاط أولوية للطلب عند مدير الفرع - حدث خلال عطلة)";
    }
}
