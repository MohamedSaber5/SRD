package com.aast.booking.secretary.notification;

/**
 * DESIGN PATTERN: Bridge (Abstraction)
 */
public abstract class Notification {
    protected NotificationSender sender;

    protected Notification(NotificationSender sender) {
        this.sender = sender;
    }

    public abstract void dispatch();
}
