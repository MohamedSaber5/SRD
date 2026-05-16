package com.aast.booking.models;

/**
 * Represents an authenticated user in the system.
 * Mirrors the Firestore "users" collection document structure.
 */
public class User {

    private String uid;
    private String email;
    private String displayName;
    private String employeeId;
    private String role;           // admin | branch_manager | secretary | employee | temp_admin
    private String collegeName;    // Used for secretary/manager assignment
    private String tempAccessStart;
    private String tempAccessEnd;
    private java.util.List<String> allowedFeatures;

    public User() {}

    public User(String uid, String email, String displayName, String employeeId, String role) {
        this.uid = uid;
        this.email = email;
        this.displayName = displayName;
        this.employeeId = employeeId;
        this.role = role;
    }

    // ── Getters & Setters ──────────────────────────────────────────────────

    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getCollegeName() { return collegeName; }
    public void setCollegeName(String collegeName) { this.collegeName = collegeName; }

    public String getTempAccessStart() { return tempAccessStart; }
    public void setTempAccessStart(String tempAccessStart) { this.tempAccessStart = tempAccessStart; }

    public String getTempAccessEnd() { return tempAccessEnd; }
    public void setTempAccessEnd(String tempAccessEnd) { this.tempAccessEnd = tempAccessEnd; }
 
    public java.util.List<String> getAllowedFeatures() { return allowedFeatures; }
    public void setAllowedFeatures(java.util.List<String> allowedFeatures) { this.allowedFeatures = allowedFeatures; }

    /**
     * Checks if this user has admin-level privileges (admin or active temp_admin).
     */
    public boolean isAdmin() {
        return "admin".equals(role) || "temp_admin".equals(role);
    }

    public boolean isBranchManager() { return "branch_manager".equals(role); }
    public boolean isSecretary() { return "secretary".equals(role); }
    public boolean isEmployee() { return "employee".equals(role); }

    @Override
    public String toString() {
        return "User{uid='" + uid + "', name='" + displayName + "', role='" + role + "'}";
    }
}
