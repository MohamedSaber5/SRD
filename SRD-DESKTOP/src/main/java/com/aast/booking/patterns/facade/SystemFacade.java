package com.aast.booking.patterns.facade;

import com.aast.booking.admin.facade.AdminBookingFacade;
import com.aast.booking.models.Booking;
import com.aast.booking.models.BookingNotification;
import com.aast.booking.models.Room;
import com.aast.booking.patterns.command.UpdateRoomCommand;
import com.aast.booking.services.BookingService;
import com.aast.booking.services.BranchManagerService;
import com.aast.booking.services.GlobalDataService;
import com.aast.booking.services.NotificationService;
import com.aast.booking.services.RoomService;

import java.util.List;
import java.util.function.Consumer;

/**
 * DESIGN PATTERN: Facade + Singleton
 *
 * Problem Solved:
 *   Each dashboard controller (Admin, BranchManager, Secretary, Employee) was calling
 *   multiple services directly — BookingService, RoomService, AdminBookingFacade,
 *   BranchManagerService, NotificationService — with no single coordination point.
 *   This caused:
 *     1. Scattered logic: the same fetch + cache-check pattern repeated everywhere.
 *     2. Tight coupling: controllers depended on 5+ concrete service classes.
 *     3. Cache bypass: some controllers skipped GlobalDataService and read Firestore directly.
 *
 * Solution:
 *   SystemFacade is the ONLY entry-point that controllers need.
 *   Internally it delegates to the appropriate services and enforces cache use.
 *
 * Singleton:
 *   Thread-safe double-checked locking (same pattern as GlobalDataService).
 *
 * Wired into:
 *   - AdminDashboardController   → getPendingBookings(), getRooms()
 *   - SecretaryDashboardController → getRooms(), submitBooking(), getMyBookings()
 *   - BranchManagerDashboardController → getPendingMultiBookings(), approveBooking()
 *   - BookingListController (employee) → getMyBookings(), submitBooking()
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * API Surface:
 *
 *   ── Rooms ──────────────────────────────────────────────────────────────────
 *   getRooms(onSuccess, onError)          → cache-aware room fetch
 *   updateRoom(room, onSuccess, onError)  → UpdateRoomCommand + cache invalidation
 *   invalidateRooms()                     → bust room cache (call after write)
 *
 *   ── Bookings (Admin) ───────────────────────────────────────────────────────
 *   listenToPendingBookings(onUpdate, onError)  → Admin Firestore listener
 *   invalidateBookings()                        → bust booking cache
 *
 *   ── Bookings (Branch Manager) ──────────────────────────────────────────────
 *   getPendingMultiBookings(onSuccess, onError) → multi + awaiting_manager_final
 *   getHistoryMultiBookings(onSuccess, onError) → multi + approved/rejected
 *   approveMultiBooking(booking, onSuccess)     → BranchManagerApprovalHandler chain
 *
 *   ── Bookings (Employee / Secretary) ────────────────────────────────────────
 *   getMyBookings(onSuccess, onError)    → bookings for current session user
 *   submitBooking(booking, onSuccess, onError) → Firestore add
 *
 *   ── Notifications ──────────────────────────────────────────────────────────
 *   getMyNotifications(onSuccess, onError)
 *   sendNotification(notification, onSuccess, onError)
 *   markNotificationRead(id, onSuccess, onError)
 *   markAllNotificationsRead(list, onSuccess, onError)
 *
 *   ── Ramadan Mode ───────────────────────────────────────────────────────────
 *   fetchRamadanMode(onResult)
 * ─────────────────────────────────────────────────────────────────────────────
 */
public class SystemFacade {

    // ── Singleton ─────────────────────────────────────────────────────────────
    private static volatile SystemFacade instance;

    private SystemFacade() {}

    public static SystemFacade getInstance() {
        if (instance == null) {
            synchronized (SystemFacade.class) {
                if (instance == null) instance = new SystemFacade();
            }
        }
        return instance;
    }

    // ── Internal service references ───────────────────────────────────────────
    private final GlobalDataService   cache   = GlobalDataService.getInstance();
    private final AdminBookingFacade  adminFacade = new AdminBookingFacade();

    // ══════════════════════════════════════════════════════════════════════════
    // ROOMS
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Cache-aware room fetch.
     * Serves from GlobalDataService cache when fresh; reads Firestore otherwise.
     */
    public void getRooms(Consumer<List<Room>> onSuccess, Consumer<Exception> onError) {
        // RoomService already checks the cache internally
        RoomService.fetchRooms(onSuccess, onError);
    }

    /**
     * Update a room via the Command pattern + bust room cache.
     */
    public void updateRoom(Room room, Runnable onSuccess, Consumer<Exception> onError) {
        new UpdateRoomCommand(room, onSuccess, onError).execute();
    }

    /**
     * Bust the room cache (call after any room add/delete).
     */
    public void invalidateRooms() {
        cache.invalidateRooms();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BOOKINGS — Admin
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Attach a Firestore snapshot listener for pending bookings (Admin view).
     * Replaces direct AdminBookingFacade.listenToPendingRequests() calls.
     */
    public void listenToPendingBookings(Consumer<List<Booking>> onUpdate,
                                        Consumer<Exception> onError) {
        adminFacade.listenToPendingRequests(onUpdate, onError);
    }

    /**
     * Bust the booking cache (call after every approve/reject/submit).
     */
    public void invalidateBookings() {
        cache.invalidateBookings();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BOOKINGS — Branch Manager
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Fetch multi-purpose hall bookings awaiting Branch Manager final approval.
     */
    public void getPendingMultiBookings(Consumer<List<Booking>> onSuccess,
                                        Consumer<Exception> onError) {
        BranchManagerService.getInstance()
            .fetchPendingBookings()
            .thenAccept(onSuccess)
            .exceptionally(ex -> {
                onError.accept(ex instanceof Exception ? (Exception) ex : new Exception(ex));
                return null;
            });
    }

    /**
     * Fetch multi-purpose hall booking history (approved + rejected).
     */
    public void getHistoryMultiBookings(Consumer<List<Booking>> onSuccess,
                                        Consumer<Exception> onError) {
        BranchManagerService.getInstance()
            .fetchHistoryBookings()
            .thenAccept(onSuccess)
            .exceptionally(ex -> {
                onError.accept(ex instanceof Exception ? (Exception) ex : new Exception(ex));
                return null;
            });
    }

    /**
     * Branch Manager final approval via Chain of Responsibility.
     * Internally uses BranchManagerApprovalHandler:
     *   - validates status == "awaiting_manager_final"
     *   - sets status = "approved"
     *   - notifies requester via Firestore notification
     */
    public void approveMultiBooking(Booking booking,
                                    Runnable onSuccess,
                                    Consumer<Exception> onError) {
        BranchManagerService.getInstance()
            .approveBookingViaChain(booking)
            .thenRun(() -> {
                invalidateBookings();
                if (onSuccess != null) onSuccess.run();
            })
            .exceptionally(ex -> {
                if (onError != null) onError.accept(ex instanceof Exception ? (Exception) ex : new Exception(ex));
                return null;
            });
    }

    /**
     * Branch Manager rejection — direct status update.
     */
    public void rejectMultiBooking(String bookingId,
                                   Runnable onSuccess,
                                   Consumer<Exception> onError) {
        BranchManagerService.getInstance()
            .updateBookingStatus(bookingId, "rejected")
            .thenRun(() -> {
                invalidateBookings();
                if (onSuccess != null) onSuccess.run();
            })
            .exceptionally(ex -> {
                if (onError != null) onError.accept(ex instanceof Exception ? (Exception) ex : new Exception(ex));
                return null;
            });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BOOKINGS — Employee / Secretary
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Fetch bookings for the currently logged-in user.
     */
    public void getMyBookings(Consumer<List<Booking>> onSuccess,
                              Consumer<Exception> onError) {
        BookingService.listenToMyBookings(onSuccess, onError);
    }

    /**
     * Submit a new booking to Firestore and bust the booking cache.
     */
    public void submitBooking(Booking booking,
                              Runnable onSuccess,
                              Consumer<Exception> onError) {
        BookingService.submitBooking(booking, () -> {
            invalidateBookings();
            if (onSuccess != null) onSuccess.run();
        }, onError);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // NOTIFICATIONS
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Fetch notifications for the current user (sorted by date desc).
     */
    public void getMyNotifications(Consumer<List<BookingNotification>> onSuccess,
                                   Consumer<Exception> onError) {
        NotificationService.listenToMyNotifications(onSuccess, onError);
    }

    /**
     * Send a notification document to Firestore.
     */
    public void sendNotification(BookingNotification notification,
                                 Runnable onSuccess,
                                 Consumer<Exception> onError) {
        NotificationService.sendNotification(notification, onSuccess, onError);
    }

    /**
     * Mark a single notification as read.
     */
    public void markNotificationRead(String notificationId,
                                     Runnable onSuccess,
                                     Consumer<Exception> onError) {
        NotificationService.markAsRead(notificationId, onSuccess, onError);
    }

    /**
     * Mark all notifications in the list as read.
     */
    public void markAllNotificationsRead(List<BookingNotification> notifications,
                                         Runnable onSuccess,
                                         Consumer<Exception> onError) {
        NotificationService.markAllRead(notifications, onSuccess, onError);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RAMADAN MODE
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Fetch the current Ramadan mode flag from Firestore settings.
     * Delegates to BranchManagerService which owns the settings/system document.
     */
    public void fetchRamadanMode(Consumer<Boolean> onResult) {
        BranchManagerService.getInstance()
            .fetchRamadanMode()
            .thenAccept(onResult)
            .exceptionally(ex -> {
                System.err.println("[SystemFacade] fetchRamadanMode error: " + ex.getMessage());
                onResult.accept(false); // safe default
                return null;
            });
    }

    /**
     * Attach a real-time listener to the system settings document for Ramadan mode.
     */
    public com.google.cloud.firestore.ListenerRegistration listenToRamadanMode(Consumer<Boolean> onUpdate) {
        return RoomService.listenToRamadanMode(onUpdate);
    }
}
