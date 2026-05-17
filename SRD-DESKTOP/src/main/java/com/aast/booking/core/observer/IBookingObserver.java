package com.aast.booking.core.observer;

/**
 * OBSERVER PATTERN (Prompt 9) — Observer Interface
 *
 * Replaces the old {@link NotificationObserver} (which used a raw String message).
 * All concrete observers implement this interface and receive a typed {@link BookingEvent}.
 *
 * Concrete implementations:
 *   - UIBadgeObserver              → updates sidebar badge counter
 *   - FirestoreNotificationObserver → writes notification doc to Firestore
 *
 * The old NotificationObserver is kept for backward-compat with SecretaryDashboardController.
 */
public interface IBookingObserver {
    /**
     * Called by {@link BookingNotifierSubject} whenever a booking lifecycle event occurs.
     *
     * @param event the typed event carrying the Booking and its transition type
     */
    void onBookingEvent(BookingEvent event);
}
