package com.aast.booking.secretary.form;

/**
 * DESIGN PATTERN: Decorator
 * Adds Official Event priority logic.
 */
public class OfficialEventDecorator extends BookingDecorator {

    public OfficialEventDecorator(BookingService decoratedService) {
        super(decoratedService);
    }

    @Override
    public void applyTo(com.aast.booking.models.BookingRequest request) {
        super.applyTo(request);
        // Maybe add some metadata
    }

    @Override
    public String getDescription() {
        return super.getDescription() + " - (مناسبة رسمية للكلية - مؤتمر أو ندوة عامة)";
    }
}
