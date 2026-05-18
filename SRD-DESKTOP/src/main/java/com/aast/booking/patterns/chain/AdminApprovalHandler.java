package com.aast.booking.patterns.chain;

import com.aast.booking.models.Booking;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

import java.util.HashMap;
import java.util.Map;

/**
 * DESIGN PATTERN: Chain of Responsibility — Concrete Handler (Step 1 of 2)
 *
 * Responsibility:
 *   The Admin's step in the multi-purpose hall approval chain.
 *
 *   Triggers when: booking.status == "pending"
 *
 *   Actions performed:
 *     1. Sets booking status → "awaiting_manager_final"
 *     2. Assigns the roomId to the booking
 *     3. Applies isUrgent / priority flags (as set by the Decorator)
 *     4. Sends a Firestore notification to ALL branch managers
 *     5. Passes the updated booking to the next handler in the chain
 *        (i.e., BranchManagerApprovalHandler — but it will do nothing since
 *         the status is now "awaiting_manager_final", not "approved_by_branch")
 *
 * Chain position:
 *   AdminApprovalHandler → BranchManagerApprovalHandler
 *
 * Used by:
 *   MultiPurposeApprovalStrategy.approve()
 */
public class AdminApprovalHandler extends BookingApprovalHandler {

    private final String roomId;      // room assigned by admin
    private final boolean isUrgent;   // urgency flag (set by Decorator before chain)

    /**
     * @param roomId   the Firestore document ID of the assigned room
     * @param isUrgent whether the admin marked this booking as urgent
     */
    public AdminApprovalHandler(String roomId, boolean isUrgent) {
        this.roomId   = roomId;
        this.isUrgent = isUrgent;
    }

    @Override
    public void handle(Booking booking, Firestore db) throws Exception {
        if (!"pending".equals(booking.getStatus())) {
            // Not in our expected state — pass along the chain
            System.out.println("[Chain] AdminApprovalHandler: booking not pending, skipping.");
            if (next != null) next.handle(booking, db);
            return;
        }

        System.out.println("[Chain] AdminApprovalHandler: reviewing pending booking → awaiting_manager_final");

        // ── Step 1: Update booking status in Firestore ────────────────────────
        Map<String, Object> updates = new HashMap<>();
        updates.put("status",   "awaiting_manager_final");
        updates.put("roomId",   roomId);
        updates.put("isUrgent", isUrgent);
        updates.put("priority", isUrgent ? "urgent" : "normal"); // Web Dashboard compat.
        updates.put("updatedAt", FieldValue.serverTimestamp());
        db.collection("bookings").document(booking.getId()).update(updates).get();

        // ── IMPORTANT: Do NOT call booking.setStatus() here ──────────────────
        // The in-memory booking must keep its original "pending" status so that
        // BranchManagerApprovalHandler (which checks for "awaiting_manager_final")
        // is a no-op in this same chain call.
        // BranchManagerApprovalHandler runs STANDALONE later when the Branch Manager
        // actually clicks "اعتماد الطلب" in their dashboard.
        booking.setRoomId(roomId);
        booking.setUrgent(isUrgent);

        // ── Step 3: Notify all branch managers via Firestore ─────────────────
        QuerySnapshot managersSnap = db.collection("users")
                .whereEqualTo("role", "branch_manager")
                .get()
                .get();

        for (QueryDocumentSnapshot mDoc : managersSnap.getDocuments()) {
            Map<String, Object> notification = new HashMap<>();
            notification.put("userId",    mDoc.getId());
            notification.put("title",     isUrgent ? "🚨 طلب عاجل — اعتماد نهائي مطلوب" : "اعتماد نهائي مطلوب");
            notification.put("message",   "هناك طلب حجز قاعة متعددة الأغراض (" + roomId + ") بانتظار اعتمادك النهائي");
            notification.put("type",      "manager_action");
            notification.put("bookingId", booking.getId());
            notification.put("isRead",    false);
            notification.put("createdAt", FieldValue.serverTimestamp());
            db.collection("notifications").add(notification).get();
        }

        System.out.println("[Chain] AdminApprovalHandler: done — notified branch managers, passing to next handler.");

        // ── Step 4: Pass to next handler (BranchManagerApprovalHandler will
        //    be a no-op here since status is now "awaiting_manager_final",
        //    not "approved_by_branch") ──────────────────────────────────────
        if (next != null) next.handle(booking, db);
    }
}
