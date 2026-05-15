package com.aast.booking.services;

import com.aast.booking.core.FirebaseService;
import com.aast.booking.models.Booking;
import com.google.cloud.firestore.*;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * DESIGN PATTERN: Facade / Singleton
 * 
 * SOLID: Single Responsibility Principle (SRP)
 */
public class BranchManagerService {
    private static BranchManagerService instance;
    private final Firestore db;
    private final ExecutorService executor = Executors.newFixedThreadPool(4);

    private BranchManagerService() {
        this.db = FirebaseService.getInstance().getFirestore();
    }

    public static synchronized BranchManagerService getInstance() {
        if (instance == null) {
            instance = new BranchManagerService();
        }
        return instance;
    }

    public CompletableFuture<List<Map<String, Object>>> fetchMultiPurposeRooms() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("[DEBUG] Fetching multi-purpose rooms...");
                QuerySnapshot rSnap = db.collection("rooms")
                    .whereEqualTo("type", "multi")
                    .get().get();
                List<Map<String, Object>> rooms = new ArrayList<>();
                for (DocumentSnapshot doc : rSnap.getDocuments()) {
                    Map<String, Object> data = doc.getData();
                    data.put("id", doc.getId());
                    rooms.add(data);
                }
                System.out.println("[DEBUG] Successfully fetched " + rooms.size() + " rooms.");
                return rooms;
            } catch (Exception e) {
                System.err.println("[ERROR] Failed to fetch rooms: " + e.getMessage());
                throw new RuntimeException(e);
            }
        }, executor);
    }

    public CompletableFuture<List<Booking>> fetchPendingBookings() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("[DEBUG] Fetching pending bookings...");
                QuerySnapshot bSnap = db.collection("bookings")
                    .whereEqualTo("roomType", "multi")
                    .whereEqualTo("status", "awaiting_manager_final")
                    .get().get();
                List<Booking> pending = new ArrayList<>();
                for (DocumentSnapshot doc : bSnap.getDocuments()) {
                    pending.add(Booking.fromDocument(doc));
                }
                System.out.println("[DEBUG] Successfully fetched " + pending.size() + " pending bookings.");
                return pending;
            } catch (Exception e) {
                System.err.println("[ERROR] Failed to fetch pending bookings: " + e.getMessage());
                throw new RuntimeException(e);
            }
        }, executor);
    }

    public CompletableFuture<List<Booking>> fetchHistoryBookings() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("[DEBUG] Fetching history bookings...");
                QuerySnapshot snap = db.collection("bookings")
                    .whereEqualTo("roomType", "multi")
                    .whereIn("status", Arrays.asList("approved", "rejected"))
                    .get().get();
                List<Booking> list = new ArrayList<>();
                for (DocumentSnapshot doc : snap.getDocuments()) {
                    list.add(Booking.fromDocument(doc));
                }
                System.out.println("[DEBUG] Successfully fetched " + list.size() + " history bookings.");
                return list;
            } catch (Exception e) {
                System.err.println("[ERROR] Failed to fetch history: " + e.getMessage());
                throw new RuntimeException(e);
            }
        }, executor);
    }

    public CompletableFuture<Void> updateBookingStatus(String bookingId, String status) {
        return CompletableFuture.runAsync(() -> {
            try {
                db.collection("bookings").document(bookingId)
                    .update("status", status, "updatedAt", FieldValue.serverTimestamp())
                    .get();
                System.out.println("[DEBUG] Booking " + bookingId + " status updated to " + status);
            } catch (Exception e) {
                System.err.println("[ERROR] Failed to update status: " + e.getMessage());
                throw new RuntimeException(e);
            }
        }, executor);
    }

    public CompletableFuture<Boolean> fetchRamadanMode() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                DocumentSnapshot doc = db.collection("settings").document("system").get().get();
                return doc.exists() && Boolean.TRUE.equals(doc.getBoolean("isRamadanMode"));
            } catch (Exception e) {
                System.err.println("[ERROR] Failed to fetch Ramadan mode: " + e.getMessage());
                return false;
            }
        }, executor);
    }

    public CompletableFuture<Void> setRamadanMode(boolean on) {
        return CompletableFuture.runAsync(() -> {
            try {
                db.collection("settings").document("system")
                    .set(Collections.singletonMap("isRamadanMode", on), SetOptions.merge())
                    .get();
            } catch (Exception e) {
                System.err.println("[ERROR] Failed to set Ramadan mode: " + e.getMessage());
                throw new RuntimeException(e);
            }
        }, executor);
    }
}
