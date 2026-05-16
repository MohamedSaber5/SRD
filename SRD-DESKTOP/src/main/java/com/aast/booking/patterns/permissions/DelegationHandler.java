package com.aast.booking.patterns.permissions;
 
import com.aast.booking.models.User;
import java.util.HashSet;
import java.util.Set;
 
/**
 * CHAIN OF RESPONSIBILITY: Concrete Handler
 * Checks if the user has been specifically delegated a permission.
 */
public class DelegationHandler extends PermissionHandler {
    
    // In a real app, this would fetch from Firestore. 
    // Here we use a static cache for demonstration.
    private static Set<String> mockDelegations = new HashSet<>();
 
    public static void addMockDelegation(String userId, String permission) {
        mockDelegations.add(userId + ":" + permission);
    }
 
    @Override
    public boolean handle(User user, String permissionKey) {
        String key = user.getUid() + ":" + permissionKey;
        if (mockDelegations.contains(key)) {
            return true;
        }
        return checkNext(user, permissionKey);
    }
}
