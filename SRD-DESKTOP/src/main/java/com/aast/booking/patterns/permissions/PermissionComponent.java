package com.aast.booking.patterns.permissions;
 
import java.util.List;
 
/**
 * COMPOSITE PATTERN: Component base
 * Represents either a single permission or a group of permissions.
 */
public abstract class PermissionComponent {
    protected String name;
    protected String description;
 
    public PermissionComponent(String name, String description) {
        this.name = name;
        this.description = description;
    }
 
    public String getName() { return name; }
    public String getDescription() { return description; }
 
    // Composite methods (optional override)
    public void add(PermissionComponent component) {
        throw new UnsupportedOperationException("Cannot add to a leaf permission.");
    }
 
    public void remove(PermissionComponent component) {
        throw new UnsupportedOperationException("Cannot remove from a leaf permission.");
    }
 
    public List<PermissionComponent> getChildren() {
        throw new UnsupportedOperationException("Leaf permissions have no children.");
    }
 
    /**
     * Core logic: Checks if this component (or any of its children) matches the given permission key.
     */
    public abstract boolean hasPermission(String permissionKey);
}
