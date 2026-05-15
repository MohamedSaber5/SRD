package com.aast.booking.secretary.notification;

public class SystemNotification extends Notification {
    private final String message;

    public SystemNotification(NotificationSender sender, String message) {
        super(sender);
        this.message = message;
    }

    @Override
    public void dispatch() {
        sender.send("System Alert: " + message);
    }
}
