package com.aast.booking.secretary.form;

import java.util.Stack;

public class BookingCaretaker {
    private final Stack<BookingMemento> mementoStack = new Stack<>();

    public void saveState(BookingMemento memento) {
        mementoStack.push(memento);
    }

    public BookingMemento restoreState() {
        if (!mementoStack.isEmpty()) {
            return mementoStack.pop();
        }
        return null;
    }
    
    public boolean canRestore() {
        return !mementoStack.isEmpty();
    }
}
