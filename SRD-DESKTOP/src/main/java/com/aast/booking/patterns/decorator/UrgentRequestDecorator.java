package com.aast.booking.patterns.decorator;

import com.aast.booking.models.Booking;

/**
 * DESIGN PATTERN: Decorator — Concrete Decorator
 *
 * Wraps any {@link IBookingComponent} and marks the underlying booking as
 * "urgent" — jumping it to the front of the Branch Manager's review queue.
 *
 * What it does on construction:
 *   1. Sets {@code booking.isUrgent = true}
 *   2. Sets {@code booking.status  = "awaiting_manager_final"} (skip normal queue)
 *   3. Sets {@code booking.priority = "urgent"} (Web Dashboard compatibility field)
 *
 * Why a Decorator and not just an if-block in the controller?
 *   - The controller should not know HOW urgency is applied — only THAT it is.
 *   - A Decorator keeps the Booking model and the approval strategy clean.
 *   - Additional decorators (e.g., "VIPDecorator", "RamadanDecorator") can be
 *     stacked in the same chain without changing existing code (Open/Closed Principle).
 *
 * Usage (in ApproveBookingCommand):
 * <pre>
 *   IBookingComponent component = new BaseBookingComponent(booking);
 *   if (isUrgent) {
 *       component = new UrgentRequestDecorator(component); // wraps + sets flags
 *   }
 *   Booking decorated = component.getBooking(); // fully configured booking
 * </pre>
 */
public class UrgentRequestDecorator implements IBookingComponent {

    private final IBookingComponent wrapped;

    /**
     * Wraps {@code component} and immediately applies urgent flags to the booking.
     *
     * @param component the component to decorate (must not be null)
     */
    public UrgentRequestDecorator(IBookingComponent component) {
        if (component == null) throw new IllegalArgumentException("UrgentRequestDecorator: component must not be null");
        this.wrapped = component;

        // Apply urgent behaviour to the underlying booking right away
        Booking booking = wrapped.getBooking();
        booking.setUrgent(true);
        booking.setStatus("awaiting_manager_final");  // jump the queue
        booking.setPriority("urgent");                 // Web Dashboard compatibility
    }

    @Override
    public Booking getBooking() {
        return wrapped.getBooking();
    }

    @Override
    public String getDisplayPriority() {
        return "urgent";
    }
}
