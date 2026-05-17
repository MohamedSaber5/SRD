package com.aast.booking.core.observer;

import java.util.concurrent.CopyOnWriteArrayList;

/**
 * OBSERVER PATTERN (Prompt 9) — Concrete Subject / Event Bus (Singleton)
 *
 * Problem with the previous version:
 *   - Used ArrayList + non-volatile static field → NOT thread-safe.
 *   - Only carried a raw String message → observers had no structured data.
 *   - Was never connected to any real action (approve/reject fired nothing).
 *
 * Fixes:
 *   1. Thread-safe Singleton (volatile + double-checked locking).
 *   2. CopyOnWriteArrayList — safe to iterate while observers add/remove themselves.
 *   3. Typed {@link BookingEvent} instead of raw String.
 *   4. {@link #publish(BookingEvent)} replaces notifyObservers(String).
 *
 * The old {@link #addObserver(NotificationObserver)} / {@link #notifyObservers(String)}
 * are kept as deprecated bridges so SecretaryDashboardController compiles without changes.
 *
 * Wired into:
 *   - {@link com.aast.booking.admin.facade.AdminBookingFacade} fires events after approve/reject
 *   - {@link com.aast.booking.patterns.chain.BranchManagerApprovalHandler} fires APPROVED event
 *   - Admin / BranchManager dashboards subscribe UIBadgeObserver on initialize()
 */
public class BookingNotifierSubject {

    // ── Thread-safe Singleton ─────────────────────────────────────────────────
    private static volatile BookingNotifierSubject instance;

    private BookingNotifierSubject() {}

    public static BookingNotifierSubject getInstance() {
        if (instance == null) {
            synchronized (BookingNotifierSubject.class) {
                if (instance == null) instance = new BookingNotifierSubject();
            }
        }
        return instance;
    }

    // ── Observer lists ────────────────────────────────────────────────────────
    /** New typed observers (Prompt 9) */
    private final CopyOnWriteArrayList<IBookingObserver> bookingObservers =
        new CopyOnWriteArrayList<>();

    /** Legacy observers for backward-compat with SecretaryDashboardController */
    private final CopyOnWriteArrayList<NotificationObserver> legacyObservers =
        new CopyOnWriteArrayList<>();

    // ── New typed API ─────────────────────────────────────────────────────────

    public void subscribe(IBookingObserver observer) {
        if (observer != null) bookingObservers.addIfAbsent(observer);
    }

    public void unsubscribe(IBookingObserver observer) {
        bookingObservers.remove(observer);
    }

    /**
     * Publish a typed event to all registered {@link IBookingObserver}s.
     * Called by AdminBookingFacade / BranchManagerApprovalHandler after each action.
     */
    public void publish(BookingEvent event) {
        System.out.println("[BookingNotifierSubject] Publishing: " + event);
        for (IBookingObserver observer : bookingObservers) {
            try {
                observer.onBookingEvent(event);
            } catch (Exception ex) {
                System.err.println("[BookingNotifierSubject] Observer error: " + ex.getMessage());
            }
        }
    }

    // ── Legacy backward-compatible API ────────────────────────────────────────

    /** @deprecated Use {@link #subscribe(IBookingObserver)} with typed events. */
    @Deprecated
    public void addObserver(NotificationObserver observer) {
        if (observer != null) legacyObservers.addIfAbsent(observer);
    }

    /** @deprecated Use {@link #unsubscribe(IBookingObserver)}. */
    @Deprecated
    public void removeObserver(NotificationObserver observer) {
        legacyObservers.remove(observer);
    }

    /**
     * @deprecated Use {@link #publish(BookingEvent)} for structured events.
     *             This method still works for legacy callers (e.g. SecretaryDashboardController).
     */
    @Deprecated
    public void notifyObservers(String message) {
        for (NotificationObserver o : legacyObservers) {
            try { o.onNotificationReceived(message); }
            catch (Exception ex) { System.err.println("[BookingNotifierSubject] Legacy observer error: " + ex.getMessage()); }
        }
    }
}
