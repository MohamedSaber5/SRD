package com.aast.booking.models;

import com.google.cloud.firestore.DocumentSnapshot;

/**
 * Represents a room fetched from Firestore "rooms" collection.
 * Mirrors the rooms data structure used in BookingStep1BasicInfo.jsx.
 */
public class Room {
    private String id;          // Firestore document ID = room identifier
    private String roomNumber;  // e.g., "A-101"
    private String type;        // "fixed" (lecture) or "multi" (multi-purpose)
    private int capacity;
    private int floor;          // 1, 2, or 3

    public Room() {}

    public static Room fromDocument(DocumentSnapshot doc) {
        Room r = new Room();
        r.id = doc.getString("id") != null ? doc.getString("id") : doc.getId();
        r.roomNumber = doc.getString("roomNumber");
        r.type = doc.getString("type");
        r.capacity = doc.getLong("capacity") != null ? doc.getLong("capacity").intValue() : 0;
        r.floor = doc.getLong("floor") != null ? doc.getLong("floor").intValue() : 1;
        return r;
    }

    // Getters
    public String getId() { return id; }
    public String getRoomNumber() { return roomNumber; }
    public String getType() { return type; }
    public int getCapacity() { return capacity; }
    public int getFloor() { return floor; }

    public boolean isMultiPurpose() { return "multi".equals(type); }
    public boolean isFixedLecture() { return "fixed".equals(type); }

    @Override
    public String toString() {
        return roomNumber + " (سعة: " + capacity + ")";
    }
}
