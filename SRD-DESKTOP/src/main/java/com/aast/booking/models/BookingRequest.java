package com.aast.booking.models;

/**
 * DESIGN PATTERN: Prototype
 * Implements Cloneable so a booking can be easily duplicated for future reservations.
 * Matches React/Firebase schema.
 */
public class BookingRequest implements Cloneable {
    private String id;
    private String userId;
    private String employeeName;
    private String roomId;
    private String date;
    private String timeFrom;
    private String timeTo;
    private String purpose;
    private String status;
    private double totalCost;
    private String createdAt;
    private String description;
    
    // Rejected & Suggestion fields
    private String rejectReason;
    private String suggestedRoomId;
    private String suggestedDate;
    private String suggestedTimeFrom;
    private String suggestedTimeTo;

    // Additional details for Steps 2 & 3
    private String requesterName;
    private String requesterTitle;
    private String requesterPhone;
    private java.util.List<String> requirements = new java.util.ArrayList<>();

    public BookingRequest() {}

    public BookingRequest(String id, String userId, String employeeName, String roomId, String date, String status) {
        this.id = id;
        this.userId = userId;
        this.employeeName = employeeName;
        this.roomId = roomId;
        this.date = date;
        this.status = status;
        this.totalCost = 0.0;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTimeFrom() { return timeFrom; }
    public void setTimeFrom(String timeFrom) { this.timeFrom = timeFrom; }

    public String getTimeTo() { return timeTo; }
    public void setTimeTo(String timeTo) { this.timeTo = timeTo; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getTotalCost() { return totalCost; }
    public void setTotalCost(double totalCost) { this.totalCost = totalCost; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getRejectReason() { return rejectReason; }
    public void setRejectReason(String rejectReason) { this.rejectReason = rejectReason; }

    public String getSuggestedRoomId() { return suggestedRoomId; }
    public void setSuggestedRoomId(String suggestedRoomId) { this.suggestedRoomId = suggestedRoomId; }

    public String getSuggestedDate() { return suggestedDate; }
    public void setSuggestedDate(String suggestedDate) { this.suggestedDate = suggestedDate; }

    public String getSuggestedTimeFrom() { return suggestedTimeFrom; }
    public void setSuggestedTimeFrom(String suggestedTimeFrom) { this.suggestedTimeFrom = suggestedTimeFrom; }

    public String getSuggestedTimeTo() { return suggestedTimeTo; }
    public void setSuggestedTimeTo(String suggestedTimeTo) { this.suggestedTimeTo = suggestedTimeTo; }

    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }

    public String getRequesterTitle() { return requesterTitle; }
    public void setRequesterTitle(String requesterTitle) { this.requesterTitle = requesterTitle; }

    public String getRequesterPhone() { return requesterPhone; }
    public void setRequesterPhone(String requesterPhone) { this.requesterPhone = requesterPhone; }

    public java.util.List<String> getRequirements() { return requirements; }
    public void setRequirements(java.util.List<String> requirements) { this.requirements = requirements; }

    @Override
    public BookingRequest clone() {
        try {
            return (BookingRequest) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }
}
