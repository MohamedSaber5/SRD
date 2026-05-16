package com.aast.booking.admin.schedule;

import com.aast.booking.core.FirebaseService;
import com.aast.booking.models.Room;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

/**
 * SOLID: SRP — Responsible only for querying Firestore to find:
 *   1. All fixed rooms.
 *   2. Existing active bookings on a specific date and time slot.
 */
public class RoomAvailabilityChecker {

    private final Firestore db;

    public RoomAvailabilityChecker() {
        this.db = FirebaseService.getInstance().getFirestore();
    }

    /**
     * Gets all "fixed" rooms that are not marked "unavailable".
     */
    public List<Room> getAllFixedRooms() throws ExecutionException, InterruptedException {
        QuerySnapshot snap = db.collection("rooms")
                .whereEqualTo("type", "fixed")
                .get().get();
        
        List<Room> rooms = new ArrayList<>();
        for (DocumentSnapshot doc : snap.getDocuments()) {
            Room r = Room.fromDocument(doc);
            if (!"unavailable".equals(r.getStatus())) {
                rooms.add(r);
            }
        }
        return rooms;
    }

    /**
     * Finds the IDs of all rooms that are ALREADY booked on this date and exact slot.
     * Uses a provided list of bookings (pre-fetched) to avoid repetitive Firestore calls.
     */
    public List<String> getOccupiedRoomIds(String date, String timeFrom, String timeTo, List<com.aast.booking.models.Booking> preFetchedBookings) {
        List<String> occupied = new ArrayList<>();
        for (var b : preFetchedBookings) {
            if (date.equals(b.getDate()) && timeFrom.equals(b.getTimeFrom()) && timeTo.equals(b.getTimeTo())) {
                occupied.add(b.getRoomId());
            }
        }
        return occupied;
    }

    /**
     * Fetches all active bookings once to be used as a cache.
     */
    public List<com.aast.booking.models.Booking> fetchAllActiveBookings() throws ExecutionException, InterruptedException {
        List<String> activeStatuses = List.of("pending", "awaiting_manager_final", "approved", "approved_by_branch");
        QuerySnapshot snap = db.collection("bookings")
                .whereIn("status", activeStatuses)
                .get().get();

        List<com.aast.booking.models.Booking> list = new ArrayList<>();
        for (DocumentSnapshot doc : snap.getDocuments()) {
            com.aast.booking.models.Booking b = new com.aast.booking.models.Booking();
            b.setRoomId(doc.getString("roomId"));
            b.setDate(doc.getString("date"));
            b.setTimeFrom(doc.getString("timeFrom"));
            b.setTimeTo(doc.getString("timeTo"));
            list.add(b);
        }
        return list;
    }
}
