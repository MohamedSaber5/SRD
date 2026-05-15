package com.aast.booking.services;

import com.aast.booking.models.Booking;
import com.aast.booking.models.Room;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.aast.booking.core.FirebaseService;
import javafx.application.Platform;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;
import java.util.stream.Collectors;

/**
 * SRP: This class is solely responsible for finding valid replacement rooms
 * during a room deletion process, ensuring no booking conflicts exist.
 */
public class RoomReplacementService {

    public static void getEligibleReplacementRooms(Room roomToDelete, List<Booking> activeBookingsToTransfer, List<Room> allRooms, Consumer<List<Room>> onSuccess, Consumer<Exception> onError) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) { onError.accept(new IllegalStateException("Firestore not available")); return; }

        CompletableFuture.runAsync(() -> {
            try {
                // 1. Filter by basic criteria: capacity >=, available, different id
                List<Room> candidates = allRooms.stream()
                        .filter(r -> r.getCapacity() >= roomToDelete.getCapacity())
                        .filter(r -> "available".equals(r.getStatus()))
                        .filter(r -> !r.getId().equals(roomToDelete.getId()))
                        .collect(Collectors.toList());

                if (candidates.isEmpty()) {
                    Platform.runLater(() -> onSuccess.accept(new ArrayList<>()));
                    return;
                }

                // 2. Fetch all active bookings for these candidates to check for conflicts
                List<String> candidateIds = candidates.stream().map(Room::getId).collect(Collectors.toList());
                
                // Firestore 'in' queries support max 10 elements. We might have more candidates, 
                // so fetching all bookings and filtering in-memory is safer and fast enough for a small dataset.
                List<Booking> allCandidateBookings = new ArrayList<>();
                List<QueryDocumentSnapshot> docs = db.collection("bookings")
                        .whereIn("status", java.util.Arrays.asList("pending", "approved", "awaiting_manager_final", "approved_by_branch"))
                        .get().get().getDocuments();

                for (QueryDocumentSnapshot doc : docs) {
                    if (candidateIds.contains(doc.getString("roomId"))) {
                        Booking b = new Booking();
                        b.setRoomId(doc.getString("roomId"));
                        b.setDate(doc.getString("date"));
                        b.setTimeFrom(doc.getString("timeFrom"));
                        b.setTimeTo(doc.getString("timeTo"));
                        allCandidateBookings.add(b);
                    }
                }

                // 3. Filter out candidates that have conflicts
                List<Room> validRooms = new ArrayList<>();
                for (Room candidate : candidates) {
                    List<Booking> candidateBookings = allCandidateBookings.stream()
                            .filter(b -> b.getRoomId().equals(candidate.getId()))
                            .collect(Collectors.toList());

                    boolean hasConflict = false;
                    for (Booking toTransfer : activeBookingsToTransfer) {
                        for (Booking existing : candidateBookings) {
                            if (isConflict(toTransfer, existing)) {
                                hasConflict = true;
                                break;
                            }
                        }
                        if (hasConflict) break;
                    }

                    if (!hasConflict) {
                        validRooms.add(candidate);
                    }
                }

                Platform.runLater(() -> onSuccess.accept(validRooms));
            } catch (Exception e) {
                Platform.runLater(() -> onError.accept(e));
            }
        });
    }

    private static boolean isConflict(Booking b1, Booking b2) {
        if (b1.getDate() == null || !b1.getDate().equals(b2.getDate())) return false;
        if (b1.getTimeFrom() == null || b1.getTimeTo() == null || b2.getTimeFrom() == null || b2.getTimeTo() == null) return false;

        int start1 = timeToMinutes(b1.getTimeFrom());
        int end1 = timeToMinutes(b1.getTimeTo());
        int start2 = timeToMinutes(b2.getTimeFrom());
        int end2 = timeToMinutes(b2.getTimeTo());

        return (start1 < end2) && (end1 > start2);
    }

    private static int timeToMinutes(String time) {
        try {
            String[] parts = time.split(":");
            return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
        } catch (Exception e) {
            return 0;
        }
    }
}
