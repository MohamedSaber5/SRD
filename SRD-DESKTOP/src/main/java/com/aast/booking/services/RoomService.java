package com.aast.booking.services;

import com.aast.booking.core.FirebaseService;
import com.aast.booking.models.Room;
import com.google.cloud.firestore.*;
import javafx.application.Platform;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.function.Consumer;

/**
 * Fetches rooms and Ramadan setting from Firestore.
 * Uses get() on background thread for Admin SDK compatibility.
 */
public class RoomService {

    /** Fetches Ramadan mode once (no real-time listener in Admin SDK). */
    public static void fetchRamadanMode(Consumer<Boolean> onUpdate) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) { onUpdate.accept(false); return; }

        Thread t = new Thread(() -> {
            try {
                DocumentSnapshot snap = db.collection("settings").document("system").get().get();
                boolean isRamadan = snap.exists() && Boolean.TRUE.equals(snap.getBoolean("isRamadanMode"));
                Platform.runLater(() -> onUpdate.accept(isRamadan));
            } catch (InterruptedException | ExecutionException e) {
                Platform.runLater(() -> onUpdate.accept(false));
            }
        });
        t.setDaemon(true);
        t.start();
    }

    /** Keep this signature so BookingFormController compiles — wraps fetchRamadanMode. */
    public static ListenerRegistration listenToRamadanMode(Consumer<Boolean> onUpdate) {
        fetchRamadanMode(onUpdate);
        return null; // no real listener needed
    }

    public static void fetchRooms(Consumer<List<Room>> onSuccess, Consumer<Exception> onError) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) { onError.accept(new IllegalStateException("Firestore not available")); return; }

        Thread t = new Thread(() -> {
            try {
                QuerySnapshot snapshot = db.collection("rooms")
                    .orderBy("id", Query.Direction.ASCENDING)
                    .get().get();

                List<Room> rooms = new ArrayList<>();
                for (DocumentSnapshot doc : snapshot.getDocuments()) {
                    rooms.add(Room.fromDocument(doc));
                }
                System.out.println("[RoomService] Loaded " + rooms.size() + " rooms");
                Platform.runLater(() -> onSuccess.accept(rooms));
            } catch (InterruptedException | ExecutionException e) {
                System.err.println("[RoomService] Error: " + e.getMessage());
                Platform.runLater(() -> onError.accept(e));
            }
        });
        t.setDaemon(true);
        t.start();
    }
}
