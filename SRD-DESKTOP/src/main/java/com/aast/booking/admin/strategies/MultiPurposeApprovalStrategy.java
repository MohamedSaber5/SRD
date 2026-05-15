package com.aast.booking.admin.strategies;

import com.aast.booking.core.FirebaseService;
import com.aast.booking.models.Booking;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.FieldValue;
import java.util.HashMap;
import java.util.Map;

public class MultiPurposeApprovalStrategy implements IApprovalStrategy {

    @Override
    public boolean approve(Booking booking, String roomId, boolean isUrgent) throws Exception {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) return false;

        // 1. Update Booking Status
        Map<String, Object> updates = new HashMap<>();
        updates.put("status", "awaiting_manager_final");
        updates.put("roomId", roomId);
        updates.put("isUrgent", isUrgent);
        
        db.collection("bookings").document(booking.getId()).update(updates).get();

        // 2. Notify all branch managers
        QuerySnapshot managersSnap = db.collection("users")
                .whereEqualTo("role", "branch_manager")
                .get()
                .get();

        for (QueryDocumentSnapshot mDoc : managersSnap.getDocuments()) {
            Map<String, Object> notification = new HashMap<>();
            notification.put("userId", mDoc.getId());
            notification.put("title", "اعتماد نهائي مطلوب");
            notification.put("message", "هناك طلب حجز قاعة متعددة الأغراض (" + roomId + ") بانتظار اعتمادك النهائي");
            notification.put("type", "manager_action");
            notification.put("bookingId", booking.getId());
            notification.put("isRead", false);
            notification.put("createdAt", FieldValue.serverTimestamp());

            db.collection("notifications").add(notification).get();
        }

        return true;
    }
}
