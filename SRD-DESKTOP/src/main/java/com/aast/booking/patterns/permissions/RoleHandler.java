package com.aast.booking.patterns.permissions;
 
import com.aast.booking.models.User;
 
/**
 * CHAIN OF RESPONSIBILITY: Concrete Handler
 * Checks if the user's base role grants the permission.
 */
public class RoleHandler extends PermissionHandler {
    @Override
    public boolean handle(User user, String permissionKey) {
        // Global Admin has full access to everything
        if ("admin".equals(user.getRole())) {
            return true;
        }
 
        // Temp Admin has access to everything EXCEPT Delegation/Permissions
        if ("temp_admin".equals(user.getRole())) {
            // Check expiration
            String endStr = user.getTempAccessEnd();
            if (endStr != null) {
                try {
                    java.time.LocalDateTime end = java.time.LocalDateTime.parse(endStr);
                    if (java.time.LocalDateTime.now().isAfter(end)) {
                        return false; // Expired!
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
 
            if ("DELEGATE_PERMISSION".equals(permissionKey)) {
                return false;
            }
            return true;
        }
 
        // If not admin, pass to next handler (e.g., check delegated permissions)
        return checkNext(user, permissionKey);
    }
}
