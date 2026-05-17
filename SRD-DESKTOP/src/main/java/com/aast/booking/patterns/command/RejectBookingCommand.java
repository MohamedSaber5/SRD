package com.aast.booking.patterns.command;

import com.aast.booking.services.BranchManagerService;

import com.aast.booking.services.GlobalDataService;
import com.aast.booking.models.Booking;
import com.aast.booking.core.FirebaseService;
import com.aast.booking.core.observer.BookingEvent;
import com.aast.booking.core.observer.BookingNotifierSubject;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FieldValue;
import javafx.application.Platform;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;

public class RejectBookingCommand implements ICommand {
    private final String bookingId;
    private final Booking booking;
    private final String reason;
    private final String suggestedRoom;
    private final String suggestedDate;
    private final String suggestedTimeFrom;
    private final String suggestedTimeTo;
    private final boolean isAdmin;
    private final Runnable onSuccess;
    private final Consumer<Exception> onError;

    // For Branch Manager
    public RejectBookingCommand(String bookingId, Runnable onSuccess) {
        this.bookingId = bookingId;
        this.booking = null;
        this.reason = null;
        this.suggestedRoom = null;
        this.suggestedDate = null;
        this.suggestedTimeFrom = null;
        this.suggestedTimeTo = null;
        this.isAdmin = false;
        this.onSuccess = onSuccess;
        this.onError = ex -> ex.printStackTrace();
    }

    // For Admin
    public RejectBookingCommand(Booking booking, String reason, String suggestedRoom, String suggestedDate, String suggestedTimeFrom, String suggestedTimeTo, Runnable onSuccess, Consumer<Exception> onError) {
        this.bookingId = booking.getId();
        this.booking = booking;
        this.reason = reason;
        this.suggestedRoom = suggestedRoom;
        this.suggestedDate = suggestedDate;
        this.suggestedTimeFrom = suggestedTimeFrom;
        this.suggestedTimeTo = suggestedTimeTo;
        this.isAdmin = true;
        this.onSuccess = onSuccess;
        this.onError = onError;
    }

    @Override
    public void execute() {
        if (isAdmin) {
            Firestore db = FirebaseService.getInstance().getFirestore();
            if (db == null) return;

            Thread t = new Thread(() -> {
                try {
                    // 1. Update Booking
                    Map<String, Object> updates = new HashMap<>();
                    updates.put("status", "rejected");
                    updates.put("rejectReason", reason);
                    if (suggestedRoom != null && !suggestedRoom.isEmpty()) updates.put("suggestedRoomId", suggestedRoom);
                    if (suggestedDate != null && !suggestedDate.isEmpty()) updates.put("suggestedDate", suggestedDate);
                    if (suggestedTimeFrom != null && !suggestedTimeFrom.isEmpty()) updates.put("suggestedTimeFrom", suggestedTimeFrom);
                    if (suggestedTimeTo != null && !suggestedTimeTo.isEmpty()) updates.put("suggestedTimeTo", suggestedTimeTo);
                    updates.put("updatedAt", FieldValue.serverTimestamp());

                    db.collection("bookings").document(booking.getId()).update(updates).get();

                    // 2. Notify the employee
                    String suggestionText = "";
                    if ((suggestedRoom != null && !suggestedRoom.isEmpty()) || (suggestedDate != null && !suggestedDate.isEmpty()) || (suggestedTimeFrom != null && !suggestedTimeFrom.isEmpty())) {
                        suggestionText = " البديل المقترح: ";
                        if (suggestedRoom != null && !suggestedRoom.isEmpty()) suggestionText += "القاعة " + suggestedRoom + " ";
                        if (suggestedDate != null && !suggestedDate.isEmpty()) suggestionText += "يوم " + suggestedDate + " ";
                        if (suggestedTimeFrom != null && !suggestedTimeFrom.isEmpty()) suggestionText += "من " + suggestedTimeFrom + " إلى " + suggestedTimeTo;
                    }

                    Map<String, Object> notification = new HashMap<>();
                    notification.put("userId", booking.getUserId());
                    notification.put("title", "تم رفض طلبك / يتطلب تعديل");
                    notification.put("message", "تم رفض الحجز لأن القاعة أو الوقت غير متاح. السبب: " + (reason != null && !reason.isEmpty() ? reason : "غير محدد") + "." + suggestionText);
                    notification.put("type", "rejection_alert");
                    notification.put("bookingId", booking.getId());
                    notification.put("isRead", false);
                    notification.put("createdAt", FieldValue.serverTimestamp());

                    db.collection("notifications").add(notification).get();

                    GlobalDataService.getInstance().invalidateBookings();
                    // OBSERVER PATTERN (Prompt 9): fire REJECTED event
                    // Set reason on booking so FirestoreNotificationObserver can read it
                    booking.setRejectReason(reason);
                    BookingNotifierSubject.getInstance().publish(
                        new BookingEvent(booking, BookingEvent.Type.REJECTED)
                    );
                    Platform.runLater(onSuccess);
                } catch (Exception e) {
                    e.printStackTrace();
                    Platform.runLater(() -> onError.accept(e));
                }
            });
            t.setDaemon(true);
            t.start();
        } else {
            BranchManagerService.getInstance().updateBookingStatus(bookingId, "rejected")
                .thenRun(() -> {
                    GlobalDataService.getInstance().invalidateBookings();
                    // OBSERVER PATTERN (Prompt 9): fire REJECTED event (BM path)
                    if (booking != null) {
                        BookingNotifierSubject.getInstance().publish(
                            new BookingEvent(booking, BookingEvent.Type.REJECTED)
                        );
                    }
                    if (onSuccess != null) onSuccess.run();
                })
                .exceptionally(ex -> {
                    if (onError != null) {
                        onError.accept(ex instanceof Exception ? (Exception) ex : new Exception(ex));
                    }
                    return null;
                });
        }
    }

    @Override
    public void undo() {
        BranchManagerService.getInstance().updateBookingStatus(bookingId, "pending")
            .thenRun(() -> GlobalDataService.getInstance().invalidateBookings());
    }
}
