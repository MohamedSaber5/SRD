package com.aast.booking.models;

import com.google.cloud.firestore.DocumentSnapshot;
import java.util.Date;

/**
 * Represents a notification from Firestore "notifications" collection.
 * Mirrors the notification data structure in NotificationsPage.jsx.
 */
public class BookingNotification {
    private String id;
    private String userId;
    private String message;
    private String type;      // "modification" | "info"
    private boolean read;
    private Date createdAt;

    public BookingNotification() {}

    public static BookingNotification fromDocument(DocumentSnapshot doc) {
        BookingNotification n = new BookingNotification();
        n.id = doc.getId();
        n.userId = doc.getString("userId");
        n.message = doc.getString("message");
        n.type = doc.getString("type");
        n.read = Boolean.TRUE.equals(doc.getBoolean("read"));
        if (doc.getTimestamp("createdAt") != null) {
            n.createdAt = doc.getTimestamp("createdAt").toDate();
        }
        return n;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public boolean isModification() { return "modification".equals(type); }

    public java.util.Map<String, Object> toMap() {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("userId", userId);
        map.put("message", message);
        map.put("type", type);
        map.put("read", read);
        if (createdAt != null) {
            map.put("createdAt", createdAt);
        }
        return map;
    }
}
