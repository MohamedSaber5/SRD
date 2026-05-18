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

    /** Fetches Ramadan mode once. */
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

    /** Sets up real-time listener on the settings/system document for Ramadan mode. */
    public static ListenerRegistration listenToRamadanMode(Consumer<Boolean> onUpdate) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) {
            onUpdate.accept(false);
            return null;
        }
        return db.collection("settings").document("system").addSnapshotListener((snapshot, e) -> {
            if (e != null) {
                System.err.println("[RoomService] Ramadan listen failed: " + e.getMessage());
                return;
            }
            if (snapshot != null && snapshot.exists()) {
                boolean isRamadan = Boolean.TRUE.equals(snapshot.getBoolean("isRamadanMode"));
                Platform.runLater(() -> onUpdate.accept(isRamadan));
            } else {
                Platform.runLater(() -> onUpdate.accept(false));
            }
        });
    }

    public static void fetchRooms(Consumer<List<Room>> onSuccess, Consumer<Exception> onError) {
        if (!GlobalDataService.getInstance().isRoomCacheStale()) {
            System.out.println("[RoomService] Returning cached rooms");
            onSuccess.accept(GlobalDataService.getInstance().getCachedRooms());
            return;
        }

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
                System.out.println("[RoomService] Loaded " + rooms.size() + " rooms from Firestore");
                GlobalDataService.getInstance().setCachedRooms(rooms);
                Platform.runLater(() -> onSuccess.accept(rooms));
            } catch (InterruptedException | ExecutionException e) {
                System.err.println("[RoomService] Error: " + e.getMessage());
                Platform.runLater(() -> onError.accept(e));
            }
        });
        t.setDaemon(true);
        t.start();
    }

    public static void addRoom(Room room, Consumer<Void> onSuccess, Consumer<Exception> onError) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) { onError.accept(new IllegalStateException("Firestore not available")); return; }
        
        Thread t = new Thread(() -> {
            try {
                // Ensure room status is available
                room.setStatus("available");
                // Check uniqueness
                QuerySnapshot existing = db.collection("rooms")
                    .whereEqualTo("roomNumber", room.getRoomNumber())
                    .get().get();
                if (!existing.isEmpty()) {
                    Platform.runLater(() -> onError.accept(new Exception("اسم القاعة مستخدم بالفعل.")));
                    return;
                }
                
                DocumentReference docRef = db.collection("rooms").document(room.getRoomNumber());
                room.setId(room.getRoomNumber());
                docRef.set(room).get();
                GlobalDataService.getInstance().invalidateRooms();
                Platform.runLater(() -> onSuccess.accept(null));
            } catch (Exception e) {
                Platform.runLater(() -> onError.accept(e));
            }
        });
        t.setDaemon(true); t.start();
    }

    public static void updateRoom(Room room, Consumer<Void> onSuccess, Consumer<Exception> onError) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) { onError.accept(new IllegalStateException("Firestore not available")); return; }

        Thread t = new Thread(() -> {
            try {
                // Check uniqueness
                QuerySnapshot existing = db.collection("rooms")
                    .whereEqualTo("roomNumber", room.getRoomNumber())
                    .get().get();
                boolean duplicate = false;
                for (DocumentSnapshot doc : existing.getDocuments()) {
                    String docId = doc.getString("id") != null ? doc.getString("id") : doc.getId();
                    if (!docId.equals(room.getId())) duplicate = true;
                }
                if (duplicate) {
                    Platform.runLater(() -> onError.accept(new Exception("اسم القاعة مستخدم بالفعل.")));
                    return;
                }

                db.collection("rooms").document(room.getId()).set(room).get();
                GlobalDataService.getInstance().invalidateRooms();
                Platform.runLater(() -> onSuccess.accept(null));
            } catch (Exception e) {
                Platform.runLater(() -> onError.accept(e));
            }
        });
        t.setDaemon(true); t.start();
    }

    public static void deleteRoom(String roomId, String replacementRoomId, Consumer<Void> onSuccess, Consumer<Exception> onError) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) { onError.accept(new IllegalStateException("Firestore not available")); return; }

        Thread t = new Thread(() -> {
            try {
                WriteBatch batch = db.batch();
                
                if (replacementRoomId != null) {
                    QuerySnapshot bookings = db.collection("bookings")
                        .whereEqualTo("roomId", roomId)
                        .get().get();
                    for (DocumentSnapshot doc : bookings.getDocuments()) {
                        batch.update(doc.getReference(), "roomId", replacementRoomId);
                    }
                }
                
                batch.delete(db.collection("rooms").document(roomId));
                batch.commit().get();
                
                GlobalDataService.getInstance().invalidateRooms();
                Platform.runLater(() -> onSuccess.accept(null));
            } catch (Exception e) {
                Platform.runLater(() -> onError.accept(e));
            }
        });
        t.setDaemon(true); t.start();
    }

    public static void fetchRoomBookings(String roomId, Consumer<List<com.aast.booking.models.Booking>> onSuccess, Consumer<Exception> onError) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) { onError.accept(new IllegalStateException("Firestore not available")); return; }

        Thread t = new Thread(() -> {
            try {
                QuerySnapshot snapshot = db.collection("bookings")
                    .whereEqualTo("roomId", roomId)
                    .get().get();

                List<com.aast.booking.models.Booking> bookings = new ArrayList<>();
                for (DocumentSnapshot doc : snapshot.getDocuments()) {
                    com.aast.booking.models.Booking b = new com.aast.booking.models.Booking();
                    b.setId(doc.getId());
                    b.setRoomId(doc.getString("roomId"));
                    b.setRoomType(doc.getString("roomType"));
                    b.setDate(doc.getString("date"));
                    b.setTimeFrom(doc.getString("timeFrom"));
                    b.setTimeTo(doc.getString("timeTo"));
                    b.setStatus(doc.getString("status"));
                    b.setPurpose(doc.getString("purpose"));
                    b.setResponsibleName(doc.getString("responsibleName"));
                    b.setUserName(doc.getString("userName"));
                    String courseName = doc.getString("courseName");
                    b.setPurpose(courseName != null ? courseName : b.getPurpose());
                    bookings.add(b);
                }
                Platform.runLater(() -> onSuccess.accept(bookings));
            } catch (Exception e) {
                Platform.runLater(() -> onError.accept(e));
            }
        });
        t.setDaemon(true); t.start();
    }
}
