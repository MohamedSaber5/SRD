package com.aast.booking.patterns.prototype;

import com.aast.booking.models.Booking;

/**
 * DESIGN PATTERN: Prototype
 *
 * Defines the contract for creating a "resubmission clone" of a Booking.
 *
 * Problem Solved:
 *   When an employee re-submits a rejected booking using the suggested
 *   alternative (تقديم الطلب بالبديل), we need a fresh Booking object
 *   that carries the original request data but applies the admin's suggested
 *   alternative (room / date / time) and resets its lifecycle state.
 *
 * Why a dedicated interface instead of raw Cloneable?
 *   - Cloneable gives no compile-time guarantee on the clone() signature.
 *   - IBookingPrototype makes the intent explicit and discoverable.
 *   - Any future model that supports resubmission simply implements this interface.
 *
 * Used by:
 *   - Booking.cloneForResubmit()          → the concrete implementation
 *   - employee/BookingListController       → calls booking.cloneForResubmit()
 *   - admin/AdminBookingFormController     → calls lastBooking.cloneForResubmit() for repeat bookings
 */
public interface IBookingPrototype {

    /**
     * Creates a deep copy of this booking for re-submission.
     *
     * The returned clone will:
     *  - Copy all request data (room type, date, time, purpose, capacity, requirements…)
     *  - Apply any suggested alternatives from the rejection (suggestedRoomId, suggestedDate, …)
     *  - Reset lifecycle fields: id=null, status="pending", isUrgent=false, createdAt=null
     *  - Clear all rejection metadata: rejectReason, suggested* fields
     *
     * @return a new, independent Booking ready for submission as a fresh request.
     */
    Booking cloneForResubmit();
}
