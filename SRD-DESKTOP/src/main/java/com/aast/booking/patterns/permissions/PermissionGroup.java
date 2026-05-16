package com.aast.booking.patterns.permissions;
 
import java.util.ArrayList;
import java.util.List;
 
/**
 * COMPOSITE PATTERN: Composite
 * Represents a group of permissions.
 */
public class PermissionGroup extends PermissionComponent {
    private List<PermissionComponent> children = new ArrayList<>();
 
    public PermissionGroup(String name, String description) {
        super(name, description);
    }
 
    @Override
    public void add(PermissionComponent component) {
        children.add(component);
    }
 
    @Override
    public void remove(PermissionComponent component) {
        children.remove(component);
    }
 
    @Override
    public List<PermissionComponent> getChildren() {
        return children;
    }
 
    @Override
    public boolean hasPermission(String permissionKey) {
        // A group matches if any of its children (or the group itself) matches
        if (this.name.equalsIgnoreCase(permissionKey)) return true;
        
        for (PermissionComponent child : children) {
            if (child.hasPermission(permissionKey)) {
                return true;
            }
        }
        return false;
    }
}
