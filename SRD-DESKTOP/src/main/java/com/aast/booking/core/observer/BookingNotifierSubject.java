package com.aast.booking.core.observer;

import java.util.ArrayList;
import java.util.List;

public class BookingNotifierSubject {
    private static BookingNotifierSubject instance;
    private final List<NotificationObserver> observers = new ArrayList<>();

    private BookingNotifierSubject() {}

    public static BookingNotifierSubject getInstance() {
        if (instance == null) {
            instance = new BookingNotifierSubject();
        }
        return instance;
    }

    public void addObserver(NotificationObserver observer) {
        observers.add(observer);
    }

    public void removeObserver(NotificationObserver observer) {
        observers.remove(observer);
    }

    public void notifyObservers(String message) {
        for (NotificationObserver observer : observers) {
            observer.onNotificationReceived(message);
        }
    }
}
