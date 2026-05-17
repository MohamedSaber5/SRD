package com.aast.booking.patterns.chain;

import com.aast.booking.models.Booking;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;

import java.util.HashMap;
import java.util.Map;

/**
 * DESIGN PATTERN: Chain of Responsibility — Concrete Handler (Step 2 of 2)
 *
 * Responsibility:
 *   The Branch Manager's step in the multi-purpose hall approval chain.
 *
 *   Triggers when: booking.status == "awaiting_manager_final"
 *
 *   Actions performed:
 *     1. Sets booking status → "approved_by_branch"
 *     2. Records approvedAt timestamp
 *     3. Sends a Firestore notification back to the original requester
 *        (they will see their booking is now fully approved)
 *
 * Usage contexts:
 *   A) As the SECOND link in Admin's chain:
 *        AdminApprovalHandler → BranchManagerApprovalHandler
 *      (In this context it is a no-op, because after AdminApprovalHandler runs
 *       the status is "awaiting_manager_final" — this handler skips until the
 *       Branch Manager actually clicks "approve" in their dashboard.)
 *
 *   B) As a STANDALONE handler — wired directly from BranchManagerService:
 *        new BranchManagerApprovalHandler().handle(booking, db)
 *      This is the path taken when the Branch Manager presses "اعتماد الطلب"
 *      in their dashboard.
 */
public class BranchManagerApprovalHandler extends BookingApprovalHandler {

    @Override
    public void handle(Booking booking, Firestore db) throws Exception {
        if (!"awaiting_manager_final".equals(booking.getStatus())) {
            // Not in our expected state — this is normal when called from Admin's chain
            System.out.println("[Chain] BranchManagerApprovalHandler: not awaiting_manager_final, skipping.");
            if (next != null) next.handle(booking, db);
            return;
        }

        System.out.println("[Chain] BranchManagerApprovalHandler: approving booking → approved");

        // ── Step 1: Update booking status in Firestore ────────────────────────
        // Use "approved" (not "approved_by_branch") to stay consistent with
        // the rest of the codebase: employee dashboard, admin history, etc.
        // Traceability is preserved via the approvedBy field.
        Map<String, Object> updates = new HashMap<>();
        updates.put("status",     "approved");
        updates.put("approvedBy", "branch_manager");   // audit trail
        updates.put("approvedAt", FieldValue.serverTimestamp());
        db.collection("bookings").document(booking.getId()).update(updates).get();

        // ── Step 2: Reflect on in-memory booking ──────────────────────────────
        booking.setStatus("approved");

        // ── Step 3: Notify the original requester ─────────────────────────────
        if (booking.getUserId() != null) {
            Map<String, Object> notification = new HashMap<>();
            notification.put("userId",    booking.getUserId());
            notification.put("title",     "✅ تم اعتماد طلب الحجز");
            notification.put("message",   "تم اعتماد طلب حجز القاعة في تاريخ " + booking.getDate() + " بواسطة مدير الفرع.");
            notification.put("type",      "booking_approved");
            notification.put("bookingId", booking.getId());
            notification.put("isRead",    false);
            notification.put("createdAt", FieldValue.serverTimestamp());
            db.collection("notifications").add(notification).get();
        }

        System.out.println("[Chain] BranchManagerApprovalHandler: done — booking fully approved.");

        // End of chain — no next handler expected here
        if (next != null) next.handle(booking, db);
    }
}
