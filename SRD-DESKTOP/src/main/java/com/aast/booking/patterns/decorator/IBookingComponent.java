package com.aast.booking.patterns.decorator;

import com.aast.booking.models.Booking;

/**
 * DESIGN PATTERN: Decorator
 *
 * The component interface for the Booking Decorator chain.
 *
 * Problem Solved:
 *   When the Admin approves a multi-purpose hall booking and marks it as "urgent",
 *   the booking needs extra behaviour applied on top of it (setting isUrgent=true,
 *   status=awaiting_manager_final, priority="urgent") WITHOUT modifying the core
 *   Booking model or the approval logic.  A Decorator wraps the booking and adds
 *   behaviour transparently.
 *
 * Roles:
 *   IBookingComponent       ← this interface (the "Component")
 *   BaseBookingComponent    ← concrete component wrapping a plain Booking
 *   UrgentRequestDecorator  ← adds urgent behaviour on top of any IBookingComponent
 *
 * Used by:
 *   - patterns/command/ApproveBookingCommand   → wraps booking before strategy execution
 *   - admin/strategies/MultiPurposeApprovalStrategy → reads decorated booking state
 */
public interface IBookingComponent {

    /**
     * Returns the underlying {@link Booking} object, potentially modified by decorators.
     */
    Booking getBooking();

    /**
     * Returns the display priority string for this booking.
     * @return "normal" for plain bookings, "urgent" when wrapped by UrgentRequestDecorator.
     */
    String getDisplayPriority();
}
