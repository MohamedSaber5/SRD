package com.aast.booking.patterns.permissions;
 
import com.aast.booking.models.User;
 
/**
 * CHAIN OF RESPONSIBILITY: Handler Base
 * Defines the structure for permission check handlers.
 */
public abstract class PermissionHandler {
    protected PermissionHandler next;
 
    public void setNext(PermissionHandler next) {
        this.next = next;
    }
 
    public abstract boolean handle(User user, String permissionKey);
 
    protected boolean checkNext(User user, String permissionKey) {
        if (next == null) return false;
        return next.handle(user, permissionKey);
    }
}
