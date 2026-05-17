package com.aast.booking.core.observer;

import com.aast.booking.models.Booking;

/**
 * OBSERVER PATTERN (Prompt 9) — Event Value Object
 *
 * Carries all the data that observers need to react to a booking lifecycle change.
 * Immutable by design — created once and broadcast to all subscribers.
 *
 * Used by:
 *   - BookingNotifierSubject.publish(BookingEvent)
 *   - IBookingObserver.onBookingEvent(BookingEvent)
 *   - UIBadgeObserver          — reads type to increment badge
 *   - FirestoreNotificationObserver — reads booking + type to write notification doc
 */
public class BookingEvent {

    /** All supported lifecycle transitions that observers can react to. */
    public enum Type {
        /** Admin sent booking to Branch Manager queue */
        APPROVED_BY_ADMIN,
        /** Branch Manager gave final approval */
        APPROVED,
        /** Admin or BranchManager rejected the request */
        REJECTED,
        /** New booking submitted — shown as "pending" */
        PENDING,
        /** Booking flagged as urgent by Admin */
        URGENT
    }

    private final Booking booking;
    private final Type    type;

    public BookingEvent(Booking booking, Type type) {
        this.booking = booking;
        this.type    = type;
    }

    public Booking getBooking() { return booking; }
    public Type    getType()    { return type;    }

    @Override
    public String toString() {
        return "[BookingEvent type=" + type
            + " bookingId=" + (booking != null ? booking.getId() : "null") + "]";
    }
}
