package com.aast.booking.admin.strategies;

import com.aast.booking.models.Booking;

/**
 * STRATEGY PATTERN: Defines the approval behavior for different types of bookings.
 */
public interface IApprovalStrategy {
    /**
     * Executes the approval logic for a booking.
     *
     * @param booking  The booking to approve.
     * @param roomId   The selected room ID.
     * @param isUrgent Whether the booking is marked as urgent.
     * @return true if successful, false otherwise.
     */
    boolean approve(Booking booking, String roomId, boolean isUrgent) throws Exception;
}
