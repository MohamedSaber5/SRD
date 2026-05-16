package com.aast.booking.patterns.permissions;
 
import com.aast.booking.core.SessionManager;
import com.aast.booking.models.User;
import javafx.scene.control.Alert;
 
/**
 * PROXY PATTERN: Protection Proxy
 * Intercepts requests and checks permissions before allowing action.
 */
public class SecurityProxy {
    private PermissionHandler permissionChain;
 
    public SecurityProxy() {
        // Initialize the Chain of Responsibility
        RoleHandler roleHandler = new RoleHandler();
        DelegationHandler delegationHandler = new DelegationHandler();
        
        roleHandler.setNext(delegationHandler);
        this.permissionChain = roleHandler;
    }
 
    /**
     * Checks if the current user can perform an action.
     */
    public boolean canAccess(String permissionKey) {
        User currentUser = SessionManager.getInstance().getCurrentUser();
        if (currentUser == null) return false;
 
        boolean hasAccess = permissionChain.handle(currentUser, permissionKey);
        
        if (!hasAccess) {
            System.err.println("[Proxy] Access Denied for " + permissionKey);
            showAccessDeniedAlert(permissionKey);
        }
        
        return hasAccess;
    }
 
    private void showAccessDeniedAlert(String permission) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle("خطأ في الصلاحيات");
        alert.setHeaderText("وصول غير مصرح به");
        alert.setContentText("عذراً، ليس لديك الصلاحية الكافية للقيام بـ: " + permission);
        alert.showAndWait();
    }
}
