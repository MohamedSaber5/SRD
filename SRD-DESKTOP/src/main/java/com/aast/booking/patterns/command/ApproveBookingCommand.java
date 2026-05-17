package com.aast.booking.patterns.command;

import com.aast.booking.services.BranchManagerService;

import com.aast.booking.services.GlobalDataService;
import com.aast.booking.models.Booking;
import com.aast.booking.admin.strategies.IApprovalStrategy;
import com.aast.booking.admin.strategies.LectureApprovalStrategy;
import com.aast.booking.admin.strategies.MultiPurposeApprovalStrategy;
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

    // For Branch Manager
    public ApproveBookingCommand(String bookingId, Runnable onSuccess) {
        this.bookingId = bookingId;
        this.booking = null;
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
                    IApprovalStrategy strategy;
                    if ("multi".equals(booking.getRoomType())) {
                        strategy = new MultiPurposeApprovalStrategy();
                    } else {
                        strategy = new LectureApprovalStrategy();
                    }
                    boolean success = strategy.approve(booking, roomId, isUrgent);
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

    @Override
    public void undo() {
        BranchManagerService.getInstance().updateBookingStatus(bookingId, "pending")
            .thenRun(() -> GlobalDataService.getInstance().invalidateBookings());
    }
}
