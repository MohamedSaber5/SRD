package com.aast.booking.patterns.command;

import com.aast.booking.services.BranchManagerService;

public class RejectBookingCommand implements Command {
    private final String bookingId;
    private final Runnable onSuccess;

    public RejectBookingCommand(String bookingId, Runnable onSuccess) {
        this.bookingId = bookingId;
        this.onSuccess = onSuccess;
    }

    @Override
    public void execute() {
        BranchManagerService.getInstance().updateBookingStatus(bookingId, "rejected")
            .thenRun(onSuccess)
            .exceptionally(ex -> {
                ex.printStackTrace();
                return null;
            });
    }
}
