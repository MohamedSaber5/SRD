package com.aast.booking.patterns.permissions;
 
/**
 * COMPOSITE PATTERN: Leaf
 * Represents a single, atomic permission.
 */
public class LeafPermission extends PermissionComponent {
    
    public LeafPermission(String name, String description) {
        super(name, description);
    }
 
    @Override
    public boolean hasPermission(String permissionKey) {
        // A leaf matches if its name matches the key
        return this.name.equalsIgnoreCase(permissionKey);
    }
}
