package com.aast.booking.patterns.command;

import com.aast.booking.models.Room;
import com.aast.booking.services.GlobalDataService;
import com.aast.booking.services.RoomService;

import java.util.function.Consumer;

public class UpdateRoomCommand implements ICommand {

    private final Room room;
    private final Runnable onSuccess;
    private final Consumer<Exception> onError;

    public UpdateRoomCommand(Room room, Runnable onSuccess, Consumer<Exception> onError) {
        this.room = room;
        this.onSuccess = onSuccess;
        this.onError = onError;
    }

    @Override
    public void execute() {
        RoomService.updateRoom(room, v -> {
            GlobalDataService.getInstance().invalidateRooms();
            if (onSuccess != null) onSuccess.run();
        }, e -> {
            if (onError != null) onError.accept(e);
        });
    }

    @Override
    public void undo() {
    }
}
