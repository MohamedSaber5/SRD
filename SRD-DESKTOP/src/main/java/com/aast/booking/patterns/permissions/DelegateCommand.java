package com.aast.booking.patterns.permissions;
 
import com.aast.booking.core.FirebaseService;
import com.google.cloud.firestore.Firestore;
import java.util.HashMap;
import java.util.Map;
 
/**
 * COMMAND PATTERN: Concrete Command
 * Encapsulates the delegation of a permission to a user.
 */
public class DelegateCommand implements PermissionCommand {
    private String targetUserId;
    private String userName;
    private PermissionComponent permission;
    private DelegationStrategy strategy;
 
    public DelegateCommand(String targetUserId, String userName, PermissionComponent permission, DelegationStrategy strategy) {
        this.targetUserId = targetUserId;
        this.userName = userName;
        this.permission = permission;
        this.strategy = strategy;
    }
 
    @Override
    public void execute() {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) return;
 
        // 1. Save delegation record
        Map<String, Object> data = new HashMap<>();
        data.put("targetUserId", targetUserId);
        data.put("userName", userName);
        data.put("permissionName", permission.getName());
        data.put("type", strategy.getType());
        data.put("timestamp", System.currentTimeMillis());
 
        db.collection("delegations").add(data);
 
        // 2. Update User document (to reflect in system)
        Map<String, Object> userUpdate = new HashMap<>();
        if (permission.getName().equals("TEMP_ADMIN")) {
            userUpdate.put("role", "temp_admin");
            if (strategy instanceof TemporaryValidationStrategy) {
                TemporaryValidationStrategy ts = (TemporaryValidationStrategy) strategy;
                userUpdate.put("tempAccessStart", ts.getStart().toString());
                userUpdate.put("tempAccessEnd", ts.getEnd().toString());
            }
        } else if (permission.getName().equals("SECRETARY")) {
            userUpdate.put("role", "secretary");
            String dept = permission.getDescription().replace("صلاحيات سكرتير جهة: ", "");
            userUpdate.put("collegeName", dept);
        }
        
        if (!userUpdate.isEmpty()) {
            db.collection("users").document(targetUserId).update(userUpdate);
        }
 
        System.out.println("[Command] Permission " + permission.getName() + " delegated and user updated: " + targetUserId);
    }
 
    @Override
    public void undo() {
        // Logic to remove the delegation from Firestore
        System.out.println("[Command] Undo delegation for " + targetUserId);
    }
}
