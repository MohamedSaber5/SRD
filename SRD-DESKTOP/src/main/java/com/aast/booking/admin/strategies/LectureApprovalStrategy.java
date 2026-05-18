package com.aast.booking.admin.strategies;

import com.aast.booking.core.FirebaseService;
import com.aast.booking.models.Booking;
import com.google.cloud.firestore.Firestore;
import java.util.HashMap;
import java.util.Map;

public class LectureApprovalStrategy implements IApprovalStrategy {

    @Override
    public boolean approve(Booking booking, String roomId, boolean isUrgent) throws Exception {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) return false;

        Map<String, Object> updates = new HashMap<>();
        updates.put("status", "approved");
        updates.put("roomId", roomId);
        updates.put("updatedAt", com.google.cloud.firestore.FieldValue.serverTimestamp());

        // Update in Firestore (blocking since it's on background thread)
        db.collection("bookings").document(booking.getId()).update(updates).get();

        return true;
    }
}
