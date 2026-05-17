package com.aast.booking.patterns.command;

import com.aast.booking.services.BranchManagerService;

import com.aast.booking.services.GlobalDataService;
import com.aast.booking.models.Booking;
import com.aast.booking.admin.strategies.IApprovalStrategy;
import com.aast.booking.admin.strategies.LectureApprovalStrategy;
import com.aast.booking.admin.strategies.MultiPurposeApprovalStrategy;
import com.aast.booking.patterns.decorator.BaseBookingComponent;
import com.aast.booking.patterns.decorator.IBookingComponent;
import com.aast.booking.patterns.decorator.UrgentRequestDecorator;
import javafx.application.Platform;
import java.util.function.Consumer;

public class ApproveBookingCommand implements ICommand {
    private final String bookingId;
    private final Booking booking;
    private final String roomId;
    private final boolean isUrgent;
    private final boolean isAdmin;
    private final Runnable onSuccess;
    private final Consumer<Exception> onError;

    // For Branch Manager — legacy (bookingId only, no chain notification)
    public ApproveBookingCommand(String bookingId, Runnable onSuccess) {
        this.bookingId = bookingId;
        this.booking = null;
        this.roomId = null;
        this.isUrgent = false;
        this.isAdmin = false;
        this.onSuccess = onSuccess;
        this.onError = ex -> ex.printStackTrace();
    }

    // For Branch Manager — CHAIN OF RESPONSIBILITY (Prompt 6)
    // Preferred over the string-only constructor: uses BranchManagerApprovalHandler
    // which validates state, records approvedAt, and notifies the requester.
    public ApproveBookingCommand(Booking booking, Runnable onSuccess) {
        this.bookingId = booking.getId();
        this.booking = booking;
        this.roomId = null;
        this.isUrgent = false;
        this.isAdmin = false;
        this.onSuccess = onSuccess;
        this.onError = ex -> ex.printStackTrace();
    }

    // For Admin
    public ApproveBookingCommand(Booking booking, String roomId, boolean isUrgent, Runnable onSuccess, Consumer<Exception> onError) {
        this.bookingId = booking.getId();
        this.booking = booking;
        this.roomId = roomId;
        this.isUrgent = isUrgent;
        this.isAdmin = true;
        this.onSuccess = onSuccess;
        this.onError = onError;
    }

    @Override
    public void execute() {
        if (isAdmin) {
            Thread t = new Thread(() -> {
                try {
                    // ── DECORATOR PATTERN (Prompt 5) ───────────────────────────────────
                    // Wrap the booking in the Decorator chain before the strategy executes.
                    // BaseBookingComponent = no-op wrapper (normal priority)
                    // UrgentRequestDecorator = sets isUrgent=true, status, priority on booking
                    IBookingComponent component = new BaseBookingComponent(booking);
                    if (isUrgent) {
                        component = new UrgentRequestDecorator(component); // applies flags
                    }
                    Booking decoratedBooking = component.getBooking(); // fully decorated

                    // ── STRATEGY PATTERN ──────────────────────────────────────────────
                    IApprovalStrategy strategy;
                    if ("multi".equals(decoratedBooking.getRoomType())) {
                        strategy = new MultiPurposeApprovalStrategy();
                    } else {
                        strategy = new LectureApprovalStrategy();
                    }
                    // Pass decoratedBooking — already has isUrgent/priority set by decorator
                    boolean success = strategy.approve(decoratedBooking, roomId, isUrgent);
                    if (success) {
                        GlobalDataService.getInstance().invalidateBookings();
                        Platform.runLater(onSuccess);
                    } else {
                        Platform.runLater(() -> onError.accept(new Exception("Approval strategy failed.")));
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    Platform.runLater(() -> onError.accept(e));
                }
            });
            t.setDaemon(true);
            t.start();
        } else {
            // CHAIN OF RESPONSIBILITY (Prompt 6):
            // If a full Booking object is available, use the chain-based approval
            // (validates state, records approvedAt, notifies requester).
            // Otherwise fall back to legacy direct status update.
            if (booking != null) {
                BranchManagerService.getInstance().approveBookingViaChain(booking)
                    .thenRun(() -> {
                        GlobalDataService.getInstance().invalidateBookings();
                        if (onSuccess != null) onSuccess.run();
                    })
                    .exceptionally(ex -> {
                        if (onError != null) {
                            onError.accept(ex instanceof Exception ? (Exception) ex : new Exception(ex));
                        }
                        return null;
                    });
            } else {
                // Legacy path — BranchManagerDashboard passes only bookingId
                BranchManagerService.getInstance().updateBookingStatus(bookingId, "approved")
                    .thenRun(() -> {
                        GlobalDataService.getInstance().invalidateBookings();
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
    }

    @Override
    public void undo() {
        BranchManagerService.getInstance().updateBookingStatus(bookingId, "pending")
            .thenRun(() -> GlobalDataService.getInstance().invalidateBookings());
    }
}
