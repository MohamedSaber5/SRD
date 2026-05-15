package com.aast.booking.services;

import com.aast.booking.core.FirebaseService;
import com.aast.booking.core.SessionManager;
import com.aast.booking.models.BookingNotification;
import com.google.cloud.firestore.*;
import javafx.application.Platform;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.function.Consumer;

/**
 * Handles Firestore CRUD for notifications.
 * Uses get() on background thread for Admin SDK compatibility.
 */
public class NotificationService {

    public static void listenToMyNotifications(Consumer<List<BookingNotification>> onUpdate,
                                               Consumer<Exception> onError) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) { onError.accept(new IllegalStateException("Firestore not available")); return; }

        String uid = SessionManager.getInstance().getCurrentUser().getUid();

        Thread t = new Thread(() -> {
            try {
                QuerySnapshot snapshot = db.collection("notifications")
                    .whereEqualTo("userId", uid)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .get().get();

                List<BookingNotification> list = new ArrayList<>();
                for (DocumentSnapshot doc : snapshot.getDocuments()) {
                    list.add(BookingNotification.fromDocument(doc));
                }
                Platform.runLater(() -> onUpdate.accept(list));

            } catch (InterruptedException | ExecutionException e) {
                System.err.println("[NotificationService] Error: " + e.getMessage());
                Platform.runLater(() -> onError.accept(e));
            }
        });
        t.setDaemon(true);
        t.start();
    }

    public static void stopListening() { /* no-op */ }

    public static void markAsRead(String id, Runnable onSuccess, Consumer<Exception> onError) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) return;

        Thread t = new Thread(() -> {
            try {
                db.collection("notifications").document(id).update("read", true).get();
                if (onSuccess != null) Platform.runLater(onSuccess);
            } catch (InterruptedException | ExecutionException e) {
                if (onError != null) Platform.runLater(() -> onError.accept(e));
            }
        });
        t.setDaemon(true);
        t.start();
    }

    public static void markAllRead(List<BookingNotification> notifications,
                                   Runnable onSuccess, Consumer<Exception> onError) {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) return;

        Thread t = new Thread(() -> {
            try {
                for (BookingNotification n : notifications) {
                    if (!n.isRead()) {
                        db.collection("notifications").document(n.getId())
                            .update("read", true).get();
                    }
                }
                if (onSuccess != null) Platform.runLater(onSuccess);
            } catch (InterruptedException | ExecutionException e) {
                if (onError != null) Platform.runLater(() -> onError.accept(e));
            }
        });
        t.setDaemon(true);
        t.start();
    }
}
