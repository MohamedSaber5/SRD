package com.aast.booking.services;

import com.aast.booking.core.FirebaseService;
import com.aast.booking.core.SessionManager;
import com.aast.booking.models.Booking;
import com.google.cloud.firestore.*;
import javafx.application.Platform;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.function.Consumer;

/**
 * Handles Firestore CRUD for bookings.
 * Uses get() on background thread instead of addSnapshotListener
 * for reliability with the Admin SDK.
 */
public class BookingService {

    public static void listenToMyBookings(Consumer<List<Booking>> onUpdate, Consumer<Exception> onError) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) {
            onError.accept(new IllegalStateException("Firestore not available"));
            return;
        }

        String uid = SessionManager.getInstance().getCurrentUser().getUid();
        System.out.println("[BookingService] Fetching bookings for uid: " + uid);

        Thread t = new Thread(() -> {
            try {
                QuerySnapshot snapshot = db.collection("bookings")
                    .whereEqualTo("userId", uid)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .get()
                    .get(); // blocking — safe on background thread

                List<Booking> bookings = new ArrayList<>();
                for (DocumentSnapshot doc : snapshot.getDocuments()) {
                    bookings.add(Booking.fromDocument(doc));
                }
                System.out.println("[BookingService] Found " + bookings.size() + " bookings");
                Platform.runLater(() -> onUpdate.accept(bookings));

            } catch (InterruptedException | ExecutionException e) {
                System.err.println("[BookingService] Error: " + e.getMessage());
                Platform.runLater(() -> onError.accept(e));
            }
        });
        t.setDaemon(true);
        t.start();
    }

    public static void stopListening() { /* no-op with get() approach */ }

    public static void submitBooking(Booking booking, Runnable onSuccess, Consumer<Exception> onError) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) { onError.accept(new IllegalStateException("Firestore not available")); return; }

        Thread t = new Thread(() -> {
            try {
                var docData = booking.toMap();
                docData.put("createdAt", FieldValue.serverTimestamp());
                db.collection("bookings").add(docData).get();
                Platform.runLater(onSuccess);
            } catch (InterruptedException | ExecutionException e) {
                Platform.runLater(() -> onError.accept(e));
            }
        });
        t.setDaemon(true);
        t.start();
    }

    /**
     * PROTOTYPE PATTERN: Clone rejected booking + apply suggested values.
     */
    public static Booking cloneWithSuggestions(Booking rejected) {
        Booking cloned = rejected.clone();
        if (rejected.getSuggestedRoomId() != null && !rejected.getSuggestedRoomId().isEmpty())
            cloned.setRoomId(rejected.getSuggestedRoomId());
        if (rejected.getSuggestedDate() != null && !rejected.getSuggestedDate().isEmpty())
            cloned.setDate(rejected.getSuggestedDate());
        if (rejected.getSuggestedTimeFrom() != null && !rejected.getSuggestedTimeFrom().isEmpty())
            cloned.setTimeFrom(rejected.getSuggestedTimeFrom());
        if (rejected.getSuggestedTimeTo() != null && !rejected.getSuggestedTimeTo().isEmpty())
            cloned.setTimeTo(rejected.getSuggestedTimeTo());

        var user = SessionManager.getInstance().getCurrentUser();
        cloned.setUserId(user.getUid());
        cloned.setUserName(user.getDisplayName());
        return cloned;
    }
}
