package com.aast.booking.models;
 
public class Delegation {
    private String id;
    private String targetUserId;
    private String userName;
    private String permissionName;
    private String type;
    private long timestamp;
 
    public Delegation() {}
 
    public Delegation(String targetUserId, String userName, String permissionName, String type, long timestamp) {
        this.targetUserId = targetUserId;
        this.userName = userName;
        this.permissionName = permissionName;
        this.type = type;
        this.timestamp = timestamp;
    }
 
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
 
    public String getTargetUserId() { return targetUserId; }
    public void setTargetUserId(String targetUserId) { this.targetUserId = targetUserId; }
 
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
 
    public String getPermissionName() { return permissionName; }
    public void setPermissionName(String permissionName) { this.permissionName = permissionName; }
 
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
 
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
