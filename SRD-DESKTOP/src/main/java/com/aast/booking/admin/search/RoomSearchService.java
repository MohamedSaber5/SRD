package com.aast.booking.admin.search;

import com.aast.booking.core.FirebaseService;
import com.aast.booking.models.Booking;
import com.aast.booking.models.Room;
import com.google.cloud.firestore.*;
import javafx.application.Platform;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;
import java.util.stream.Collectors;

/**
 * DESIGN PATTERN: Facade + Repository
 * SOLID:
 *   - SRP:  Only responsible for Firestore data access for the search feature.
 *   - DIP:  Controller depends on this service (abstraction), not directly on Firestore.
 *
 * Orchestrates:
 *   1. Fetching all rooms from Firestore (type-filtered, capacity-filtered).
 *   2. Fetching active bookings for the selected date.
 *   3. Delegating the overlap-detection to the chosen RoomSearchStrategy.
 *   4. Returning the available rooms to the caller on the JavaFX thread.
 *
 * All Firestore I/O is done on a background thread. Results are returned via
 * Platform.runLater() callbacks — same async pattern used throughout the project.
 */
public class RoomSearchService {

    // Statuses considered "active" (block a room), mirrors web roomService.js
    private static final List<String> ACTIVE_STATUSES = List.of(
            "pending", "awaiting_manager_final", "approved", "approved_by_branch"
    );

    /**
     * Executes the advanced room search.
     *
     * @param criteria   Search parameters (type, date, capacity, time/slot)
     * @param onResult   Called on the FX thread with the list of available rooms
     * @param onError    Called on the FX thread with any exception
     */
    public void searchAvailableRooms(SearchCriteria criteria,
                                     Consumer<List<Room>> onResult,
                                     Consumer<Exception> onError) {

        // Validate input via Strategy before hitting Firestore
        RoomSearchStrategy strategy = SearchStrategyFactory.createStrategy(criteria.getRoomType());
        String validationError = strategy.validateInput(criteria);
        if (validationError != null) {
            Platform.runLater(() -> onError.accept(new IllegalArgumentException(validationError)));
            return;
        }

        CompletableFuture.supplyAsync(() -> {
            try {
                Firestore db = FirebaseService.getInstance().getFirestore();

                // 1. Fetch all rooms matching the requested type
                QuerySnapshot roomsSnap = db.collection("rooms")
                        .whereEqualTo("type", criteria.getRoomType())
                        .get().get();

                List<Room> rooms = new ArrayList<>();
                for (DocumentSnapshot doc : roomsSnap.getDocuments()) {
                    Room r = mapRoom(doc);
                    // Filter out unavailable rooms and capacity constraint
                    if ("unavailable".equals(r.getStatus())) continue;
                    if (criteria.getMinCapacity() > 0 && r.getCapacity() < criteria.getMinCapacity()) continue;
                    rooms.add(r);
                }

                if (rooms.isEmpty()) return new ArrayList<Room>();

                // 2. Fetch active bookings for the requested date
                QuerySnapshot bookingsSnap = db.collection("bookings")
                        .whereEqualTo("date", criteria.getDate())
                        .whereIn("status", ACTIVE_STATUSES)
                        .get().get();

                List<Booking> activeBookings = new ArrayList<>();
                for (DocumentSnapshot doc : bookingsSnap.getDocuments()) {
                    activeBookings.add(Booking.fromDocument(doc));
                }

                // 3. Strategy determines which room IDs are occupied
                List<String> occupiedRoomIds = strategy.getOccupiedRoomIds(activeBookings, criteria);

                // 4. Filter out occupied rooms
                return rooms.stream()
                        .filter(r -> !occupiedRoomIds.contains(r.getId()))
                        .collect(Collectors.toList());

            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }).thenAccept(available -> {
            Platform.runLater(() -> onResult.accept(available));
        }).exceptionally(ex -> {
            Platform.runLater(() -> onError.accept(new Exception(ex.getCause())));
            return null;
        });
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private Room mapRoom(DocumentSnapshot doc) {
        Room r = new Room();
        r.setId(doc.getId());
        r.setRoomNumber(doc.getString("roomNumber"));
        r.setType(doc.getString("type"));
        r.setBuilding(doc.getString("building"));
        Object floorObj = doc.get("floor");
        r.setFloor(floorObj instanceof Number ? ((Number) floorObj).intValue() : 0);
        Object capObj = doc.get("capacity");
        r.setCapacity(capObj instanceof Number ? ((Number) capObj).intValue() : 0);
        r.setStatus(doc.getString("status"));
        return r;
    }
}
