package com.aast.booking.patterns.permissions;
 
/**
 * COMMAND PATTERN: Command Interface
 * Encapsulates an action on permissions.
 */
public interface PermissionCommand {
    void execute();
    void undo();
}
