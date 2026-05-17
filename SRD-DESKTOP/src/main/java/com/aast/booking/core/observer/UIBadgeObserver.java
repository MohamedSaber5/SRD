package com.aast.booking.core.observer;

import javafx.application.Platform;
import javafx.scene.control.Label;

/**
 * OBSERVER PATTERN (Prompt 9) — Concrete Observer: UI Badge
 *
 * Increments the sidebar notification badge whenever a relevant booking event
 * fires (APPROVED, APPROVED_BY_ADMIN, REJECTED, URGENT).
 *
 * Usage — in controller's initialize():
 * <pre>
 *   UIBadgeObserver badgeObserver = new UIBadgeObserver(notifBadgeLabel);
 *   BookingNotifierSubject.getInstance().subscribe(badgeObserver);
 * </pre>
 *
 * The controller must call {@link BookingNotifierSubject#unsubscribe(IBookingObserver)}
 * when the view is destroyed to avoid memory leaks.
 */
public class UIBadgeObserver implements IBookingObserver {

    private final Label badgeLabel;
    private int count = 0;

    /**
     * @param badgeLabel the Label in the sidebar that shows the unread count.
     *                   If null, the observer silently no-ops (safe for controllers
     *                   that don't have a notification badge in their layout).
     */
    public UIBadgeObserver(Label badgeLabel) {
        this.badgeLabel = badgeLabel;
    }

    @Override
    public void onBookingEvent(BookingEvent event) {
        if (badgeLabel == null) return;

        // Only react to events that produce a user-facing notification
        switch (event.getType()) {
            case APPROVED:
            case APPROVED_BY_ADMIN:
            case REJECTED:
            case URGENT:
                Platform.runLater(() -> {
                    count++;
                    badgeLabel.setText(String.valueOf(count));
                    badgeLabel.setVisible(true);
                    badgeLabel.setManaged(true);
                });
                break;
            default:
                // PENDING — not shown in the notification badge
                break;
        }
    }

    /** Resets the badge to zero (e.g. when the user opens the notifications panel). */
    public void resetBadge() {
        count = 0;
        Platform.runLater(() -> {
            if (badgeLabel != null) {
                badgeLabel.setText("0");
                badgeLabel.setVisible(false);
                badgeLabel.setManaged(false);
            }
        });
    }

    public int getCount() { return count; }
}
