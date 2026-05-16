package com.aast.booking.patterns.permissions;
 
import com.aast.booking.models.User;
 
/**
 * CHAIN OF RESPONSIBILITY: Concrete Handler
 * Checks if the user's base role grants the permission.
 */
public class RoleHandler extends PermissionHandler {
    @Override
    public boolean handle(User user, String permissionKey) {
        if (user.isAdmin()) {
            // Admins have all permissions
            return true;
        }
        // If not admin, pass to next handler (e.g., check delegated permissions)
        return checkNext(user, permissionKey);
    }
}
