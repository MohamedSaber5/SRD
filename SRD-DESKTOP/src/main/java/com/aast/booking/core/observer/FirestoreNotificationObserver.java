package com.aast.booking.core.observer;

import com.aast.booking.models.Booking;
import com.aast.booking.models.BookingNotification;
import com.aast.booking.services.NotificationService;

/**
 * OBSERVER PATTERN (Prompt 9) — Concrete Observer: Firestore Notification Writer
 *
 * Reacts to booking lifecycle events and writes a notification document to
 * the Firestore "notifications" collection.  The notification is addressed to
 * the *booking requester* (userId = booking.getUserId()) so the employee's
 * BookingListController (or SecretaryDashboardController) can display it.
 *
 * Arabic messages mirror those used in the existing React NotificationsPage.jsx.
 *
 * Usage — wire once (e.g. inside AdminBookingFacade):
 * <pre>
 *   BookingNotifierSubject.getInstance()
 *       .subscribe(new FirestoreNotificationObserver());
 * </pre>
 *
 * The Subject holds the reference — no need to keep a local field.
 */
public class FirestoreNotificationObserver implements IBookingObserver {

    @Override
    public void onBookingEvent(BookingEvent event) {
        Booking booking = event.getBooking();
        if (booking == null || booking.getUserId() == null) {
            System.err.println("[FirestoreNotificationObserver] Skipping — booking or userId is null.");
            return;
        }

        String message = buildMessage(event);
        if (message == null) return; // event type we don't notify for

        BookingNotification notification = new BookingNotification();
        notification.setUserId(booking.getUserId());
        notification.setMessage(message);
        notification.setType(isModification(event) ? "modification" : "info");
        notification.setRead(false);

        NotificationService.sendNotification(
            notification,
            () -> System.out.println("[FirestoreNotificationObserver] Notification sent → " + booking.getUserId()),
            ex -> System.err.println("[FirestoreNotificationObserver] Failed: " + ex.getMessage())
        );
    }

    // ─── Message Builder ──────────────────────────────────────────────────────

    private String buildMessage(BookingEvent event) {
        Booking b = event.getBooking();
        String date = b.getDate() != null ? b.getDate() : "—";
        String purpose = b.getPurpose() != null ? b.getPurpose() : "—";

        switch (event.getType()) {
            case APPROVED_BY_ADMIN:
                return "✅ تم اعتماد طلب الحجز المؤقت بتاريخ " + date
                    + " وهو بانتظار الموافقة النهائية من مدير الفرع.";

            case APPROVED:
                return "🎉 تم اعتماد طلب الحجز الخاص بك نهائياً!\n"
                    + "التاريخ: " + date + " | الغرض: " + purpose;

            case REJECTED:
                String reason = b.getRejectReason() != null
                    ? b.getRejectReason() : "—";
                return "❌ تم رفض طلب الحجز بتاريخ " + date
                    + "\nالسبب: " + reason;

            case URGENT:
                return "⚠️ تم تصنيف طلب الحجز الخاص بك بتاريخ " + date
                    + " كـ طلب عاجل وسيُعالج بأولوية.";

            case PENDING:
                return null; // don't notify on submit; the UI shows it already

            default:
                return null;
        }
    }

    private boolean isModification(BookingEvent event) {
        return event.getType() == BookingEvent.Type.REJECTED
            || event.getType() == BookingEvent.Type.APPROVED_BY_ADMIN;
    }
}
