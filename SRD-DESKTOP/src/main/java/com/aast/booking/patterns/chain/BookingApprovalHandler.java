package com.aast.booking.patterns.chain;

import com.aast.booking.models.Booking;
import com.google.cloud.firestore.Firestore;

/**
 * DESIGN PATTERN: Chain of Responsibility — Abstract Handler
 *
 * Problem Solved:
 *   Multi-purpose hall booking approval requires a strict two-step sequence:
 *     1. Admin reviews the request and assigns a room    → status: "awaiting_manager_final"
 *     2. Branch Manager gives the final approval         → status: "approved_by_branch"
 *
 *   Without this chain, the two steps are hardcoded in separate controllers
 *   with no formal guarantee of the ordering. Adding a new step (e.g., Dean approval)
 *   would require changes in multiple files.
 *
 * Solution:
 *   Each approval step is encapsulated in a handler. Handlers are linked in a chain;
 *   each handler either handles the booking (if it's in the right state) and
 *   passes it along, or simply forwards it to the next handler.
 *
 * Chain used by:
 *   MultiPurposeApprovalStrategy → AdminApprovalHandler → BranchManagerApprovalHandler
 *
 * Chain for Branch Manager direct approval:
 *   BranchManagerApprovalHandler (stand-alone — no next)
 */
public abstract class BookingApprovalHandler {

    /** The next handler in the chain. Null means end of chain. */
    protected BookingApprovalHandler next;

    /**
     * Links this handler to the next one in the chain.
     * Returns the next handler so calls can be chained:
     *   adminHandler.setNext(new BranchManagerApprovalHandler())
     *
     * @param next the handler to invoke after this one
     * @return the {@code next} handler (fluent)
     */
    public BookingApprovalHandler setNext(BookingApprovalHandler next) {
        this.next = next;
        return next;
    }

    /**
     * Handle the booking at this step in the approval chain.
     * Implementations must:
     *   1. Check if the booking is in the expected state for THIS handler.
     *   2. Perform their action (update Firestore status, send notification, etc.)
     *   3. Call {@code if (next != null) next.handle(booking, db)} to continue the chain.
     *
     * @param booking the booking being approved (state reflects latest Firestore values)
     * @param db      the Firestore instance (already opened by the caller)
     * @throws Exception if a Firestore write fails
     */
    public abstract void handle(Booking booking, Firestore db) throws Exception;
}
