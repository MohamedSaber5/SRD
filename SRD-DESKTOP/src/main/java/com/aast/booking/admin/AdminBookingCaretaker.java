package com.aast.booking.admin;

import java.util.Stack;

/**
 * DESIGN PATTERN: Memento (Caretaker)
 * Manages form state history for Undo/Reset.
 */
public class AdminBookingCaretaker {
    private final Stack<AdminBookingMemento> history = new Stack<>();

    public void save(AdminBookingMemento memento) {
        history.push(memento);
    }

    public AdminBookingMemento undo() {
        if (!history.isEmpty()) {
            return history.pop();
        }
        return null;
    }

    public void clear() {
        history.clear();
    }
}
