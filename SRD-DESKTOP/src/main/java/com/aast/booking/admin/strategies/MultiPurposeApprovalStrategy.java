package com.aast.booking.admin.strategies;

import com.aast.booking.core.FirebaseService;
import com.aast.booking.models.Booking;
import com.aast.booking.patterns.chain.AdminApprovalHandler;
import com.aast.booking.patterns.chain.BranchManagerApprovalHandler;
import com.aast.booking.patterns.chain.BookingApprovalHandler;
import com.google.cloud.firestore.Firestore;

/**
 * STRATEGY PATTERN: Multi-Purpose Hall Approval Strategy
 *
 * Implements the approval flow for multi-purpose hall bookings.
 * Internally uses the CHAIN OF RESPONSIBILITY pattern (Prompt 6) to enforce
 * the mandatory two-step approval sequence:
 *
 *   Step 1 — AdminApprovalHandler:
 *     Triggers on status="pending"
 *     → assigns room, sets status="awaiting_manager_final", notifies branch managers
 *
 *   Step 2 — BranchManagerApprovalHandler:
 *     Triggers on status="awaiting_manager_final"
 *     → sets status="approved_by_branch", notifies requester
 *     (No-op in THIS call since status becomes "awaiting_manager_final" after step 1)
 *
 * The chain guarantees that even if new approval steps are added in the future
 * (e.g., Dean approval), only the chain needs to be extended — this class
 * and the controllers remain unchanged.
 */
public class MultiPurposeApprovalStrategy implements IApprovalStrategy {

    @Override
    public boolean approve(Booking booking, String roomId, boolean isUrgent) throws Exception {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) return false;

        // ── CHAIN OF RESPONSIBILITY (Prompt 6) ────────────────────────────────
        // Build the chain: Admin → BranchManager
        BookingApprovalHandler adminHandler = new AdminApprovalHandler(roomId, isUrgent);
        adminHandler.setNext(new BranchManagerApprovalHandler());

        // Execute the chain — handlers process the booking based on its current status.
        // AdminApprovalHandler handles "pending" → transitions to "awaiting_manager_final"
        // BranchManagerApprovalHandler is a no-op here (booking is not yet "awaiting_manager_final"
        // when the chain starts — it becomes that DURING AdminApprovalHandler's execution).
        adminHandler.handle(booking, db);

        return true;
    }
}
