package com.aast.booking.admin.facade;

import com.aast.booking.admin.strategies.IApprovalStrategy;
import com.aast.booking.admin.strategies.LectureApprovalStrategy;
import com.aast.booking.admin.strategies.MultiPurposeApprovalStrategy;
import com.aast.booking.core.FirebaseService;
import com.aast.booking.models.Booking;
import com.google.cloud.firestore.*;
import javafx.application.Platform;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.function.Consumer;

/**
 * FACADE PATTERN: Simplifies the interaction with Firestore and underlying services
 * for the Admin Dashboard.
 */
public class AdminBookingFacade {

    /**
     * OBSERVER PATTERN (Prompt 9) — Bootstrap
     * Register FirestoreNotificationObserver as a singleton subscriber.
     * Stored as a static final field so the same object reference is used in
     * addIfAbsent() — prevents duplicate registration across multiple instances.
     */
    private static final com.aast.booking.core.observer.FirestoreNotificationObserver
        FIRESTORE_OBSERVER = new com.aast.booking.core.observer.FirestoreNotificationObserver();

    static {
        com.aast.booking.core.observer.BookingNotifierSubject.getInstance()
            .subscribe(FIRESTORE_OBSERVER);
        System.out.println("[AdminBookingFacade] FirestoreNotificationObserver registered.");
    }

    private ListenerRegistration pendingRequestsListener;

    /**
     * OBSERVER PATTERN: Listens to pending requests in real-time.
     */
    public void listenToPendingRequests(Consumer<List<Booking>> onUpdate, Consumer<Exception> onError) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) {
            onError.accept(new IllegalStateException("Firestore not available"));
            return;
        }

        List<String> statuses = List.of("pending");

        if (pendingRequestsListener != null) {
            pendingRequestsListener.remove();
        }

        pendingRequestsListener = db.collection("bookings")
                .whereIn("status", statuses)
                .limit(100)
                .addSnapshotListener((snapshots, e) -> {
                    if (e != null) {
                        Platform.runLater(() -> onError.accept(e));
                        return;
                    }

                    if (snapshots != null) {
                        List<Booking> list = new ArrayList<>();
                        for (DocumentSnapshot doc : snapshots.getDocuments()) {
                            list.add(Booking.fromDocument(doc));
                        }
                        list.sort((a, b) -> {
                            if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                            return b.getCreatedAt().compareTo(a.getCreatedAt());
                        });
                        Platform.runLater(() -> onUpdate.accept(list));
                    }
                });
    }

    public void stopListening() {
        if (pendingRequestsListener != null) {
            pendingRequestsListener.remove();
            pendingRequestsListener = null;
        }
    }

    /**
     * Approves a booking using the appropriate strategy based on roomType.
     * Uses Command Pattern for decoupling and tracking.
     */
    public void approveRequest(Booking booking, String roomId, boolean isUrgent, Runnable onSuccess, Consumer<Exception> onError) {
        new com.aast.booking.patterns.command.ApproveBookingCommand(booking, roomId, isUrgent, onSuccess, onError).execute();
    }

    /**
     * Rejects a booking and saves alternative suggestions, and notifies the user.
     * Uses Command Pattern for decoupling and tracking.
     */
    public void rejectRequest(Booking booking, String reason, String suggestedRoom, String suggestedDate, String suggestedTimeFrom, String suggestedTimeTo, Runnable onSuccess, Consumer<Exception> onError) {
        new com.aast.booking.patterns.command.RejectBookingCommand(booking, reason, suggestedRoom, suggestedDate, suggestedTimeFrom, suggestedTimeTo, onSuccess, onError).execute();
    }

    /**
     * Checks room availability. Returns a Map of displayString -> docId for available rooms.
     * The controller shows the display string but saves the docId as roomId.
     */
    public void getAvailableRooms(String date, String timeFrom, String timeTo, String type, int capacity,
                                   Consumer<Map<String, String>> onResult, Consumer<Exception> onError) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) {
            onError.accept(new IllegalStateException("Firestore not available"));
            return;
        }

        Thread t = new Thread(() -> {
            try {
                // Map booking roomType to rooms collection type field
                String roomTypeFilter = "multi".equals(type) ? "multi" : "fixed";

                // Fetch ALL rooms of matching type (filter capacity in-memory to avoid composite index)
                QuerySnapshot roomsSnap = db.collection("rooms")
                        .whereEqualTo("type", roomTypeFilter)
                        .get().get();

                // Map: docId -> displayName, filtered by capacity
                Map<String, String> docIdToDisplay = new HashMap<>();
                for (DocumentSnapshot doc : roomsSnap.getDocuments()) {
                    Object capObj = doc.get("capacity");
                    int roomCap = capObj instanceof Number ? ((Number) capObj).intValue() : 0;
                    if (roomCap >= capacity || capacity == 0) {
                        String roomNum = doc.getString("roomNumber");
                        String building = doc.getString("building");
                        String floor = doc.get("floor") != null ? doc.get("floor").toString() : null;
                        String display = roomNum != null ? roomNum : doc.getId();
                        if (building != null) { display += " (" + building; }
                        if (floor != null)    { display += " - الدور " + floor; }
                        if (building != null) { display += ")"; }
                        docIdToDisplay.put(doc.getId(), display);
                    }
                }

                if (docIdToDisplay.isEmpty()) {
                    Platform.runLater(() -> onResult.accept(new HashMap<>()));
                    return;
                }

                // Fetch bookings on the same date that already occupy a room
                List<String> busyStatuses = List.of("approved", "approved_by_branch", "awaiting_manager_final");
                QuerySnapshot bookingsSnap = db.collection("bookings")
                        .whereEqualTo("date", date)
                        .whereIn("status", busyStatuses)
                        .get().get();

                // Remove rooms whose time overlaps
                for (DocumentSnapshot bDoc : bookingsSnap.getDocuments()) {
                    String bTimeFrom = bDoc.getString("timeFrom");
                    String bTimeTo   = bDoc.getString("timeTo");
                    String bRoomId   = bDoc.getString("roomId");
                    if (bRoomId != null && docIdToDisplay.containsKey(bRoomId)) {
                        if (isTimeOverlap(timeFrom, timeTo, bTimeFrom, bTimeTo)) {
                            docIdToDisplay.remove(bRoomId);
                        }
                    }
                }

                // Return Map<displayString, docId> — controller shows display, stores docId
                Map<String, String> displayToDocId = new HashMap<>();
                docIdToDisplay.forEach((docId, display) -> displayToDocId.put(display, docId));

                Platform.runLater(() -> onResult.accept(displayToDocId));

            } catch (Exception e) {
                e.printStackTrace();
                Platform.runLater(() -> onError.accept(e));
            }
        });
        t.setDaemon(true);
        t.start();
    }

    // Helper for time overlap.
    // Assuming format "hh:mm a" or comparable string, or we convert to minutes from midnight.
    // Note: Simple string comparison for standard times works if 24hr, but here we have "08:00 AM" etc.
    // For safety, let's convert to minutes.
    private boolean isTimeOverlap(String start1, String end1, String start2, String end2) {
        if (start1 == null || end1 == null || start2 == null || end2 == null) return false;
        int s1 = timeToMinutes(start1);
        int e1 = timeToMinutes(end1);
        int s2 = timeToMinutes(start2);
        int e2 = timeToMinutes(end2);

        return Math.max(s1, s2) < Math.min(e1, e2);
    }

    private int timeToMinutes(String time) {
        // Supports both "HH:mm" (24h) and "HH:mm AM/PM" (12h) formats
        try {
            if (time == null || time.isEmpty()) return 0;
            String[] parts = time.trim().split("\\s+");
            String[] hm = parts[0].split(":");
            int h = Integer.parseInt(hm[0]);
            int m = Integer.parseInt(hm[1]);
            if (parts.length > 1) {
                // 12h with AM/PM
                String ampm = parts[1];
                if (ampm.equalsIgnoreCase("PM") && h < 12) h += 12;
                if (ampm.equalsIgnoreCase("AM") && h == 12) h = 0;
            }
            // else 24h — use as-is
            return h * 60 + m;
        } catch (Exception e) {
            return 0;
        }
    }
}
