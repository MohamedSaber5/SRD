package com.aast.booking.secretary.notification;

import com.aast.booking.core.observer.BookingNotifierSubject;

public class InAppNotificationSender implements NotificationSender {
    @Override
    public void send(String message) {
        // Connects the Bridge to the existing Observer Pattern
        BookingNotifierSubject.getInstance().notifyObservers(message);
    }
}
