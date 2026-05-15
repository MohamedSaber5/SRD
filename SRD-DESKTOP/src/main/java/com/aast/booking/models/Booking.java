package com.aast.booking.models;

import com.google.cloud.firestore.DocumentSnapshot;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * DESIGN PATTERN: Prototype
 *
 * Problem Solved: When an employee wants to re-submit a rejected booking using the
 *                 "suggested alternative" (تقديم الطلب بالبديل), we need to create
 *                 a copy of the original booking with modified fields. Instead of
 *                 manually copying all 20+ fields, we use clone() to deep-copy
 *                 the object and then only change the needed fields.
 *
 * Mirrors the "prefill" logic in UserDashboard.jsx where rejected booking data
 * is passed as state to the booking form with suggested alternative values.
 */
public class Booking implements Cloneable {

    private String id;
    private String roomId;
    private String roomType;        // 'fixed' or 'multi'
    private String hallCategory;    // 'lecture' or 'multi'
    private String date;
    private String timeFrom;
    private String timeTo;
    private String purpose;
    private int requiredCapacity;
    private boolean isHolidayEvent;
    private boolean isOfficialOccasion;

    // Step 2: Responsible person
    private String responsibleName;
    private String responsibleJob;
    private String responsibleMobile;

    // Step 3: Requirements
    private boolean reqMic;
    private int reqMicQty;
    private boolean reqLaptop;
    private boolean reqVideoConf;
    private boolean reqOther;
    private String reqOtherDetails;

    // Metadata (set by system)
    private String userId;
    private String userName;
    private String userRole;
    private String college;
    private String status;          // pending | approved | rejected | awaiting_manager_final

    // Rejection fields (set by admin/secretary)
    private String rejectReason;
    private String suggestedRoomId;
    private String suggestedDate;
    private String suggestedTimeFrom;
    private String suggestedTimeTo;

    private Date createdAt;

    public Booking() {}

    // ── Prototype Pattern: Deep Clone ──────────────────────────────────────
    /**
     * Creates a deep copy of this booking.
     * Used when employee clicks "تقديم الطلب بالبديل" on a rejected booking.
     *
     * The clone will have:
     *  - All original fields copied
     *  - id = null (it's a NEW booking)
     *  - status = "pending" (reset)
     *  - rejectReason, suggested* fields cleared
     *  - createdAt = null (will be set by server)
     *
     * Then caller modifies roomId/date/time with the suggested values.
     */
    @Override
    public Booking clone() {
        try {
            Booking cloned = (Booking) super.clone();
            // Reset booking-specific fields for re-submission
            cloned.id = null;
            cloned.status = "pending";
            cloned.rejectReason = null;
            cloned.suggestedRoomId = null;
            cloned.suggestedDate = null;
            cloned.suggestedTimeFrom = null;
            cloned.suggestedTimeTo = null;
            cloned.createdAt = null;
            return cloned;
        } catch (CloneNotSupportedException e) {
            throw new RuntimeException("Booking clone failed", e);
        }
    }

    // ── Factory method: Build from Firestore document ──────────────────────
    public static Booking fromDocument(DocumentSnapshot doc) {
        Booking b = new Booking();
        b.id = doc.getId();
        b.roomId = doc.getString("roomId");
        b.roomType = doc.getString("roomType");
        b.hallCategory = doc.getString("hallCategory");
        b.date = doc.getString("date");
        b.timeFrom = doc.getString("timeFrom");
        b.timeTo = doc.getString("timeTo");
        b.purpose = doc.getString("purpose");
        // Use safeInt() because web app may store these as String from TextField
        b.requiredCapacity = safeInt(doc.get("requiredCapacity"), 0);
        b.isHolidayEvent = Boolean.TRUE.equals(doc.getBoolean("isHolidayEvent"));
        b.isOfficialOccasion = Boolean.TRUE.equals(doc.getBoolean("isOfficialOccasion"));
        b.responsibleName = doc.getString("responsibleName");
        b.responsibleJob = doc.getString("responsibleJob");
        b.responsibleMobile = doc.getString("responsibleMobile");
        b.reqMic = Boolean.TRUE.equals(doc.getBoolean("reqMic"));
        b.reqMicQty = safeInt(doc.get("reqMicQty"), 1);
        b.reqLaptop = Boolean.TRUE.equals(doc.getBoolean("reqLaptop"));
        b.reqVideoConf = Boolean.TRUE.equals(doc.getBoolean("reqVideoConf"));
        b.reqOther = Boolean.TRUE.equals(doc.getBoolean("reqOther"));
        b.reqOtherDetails = doc.getString("reqOtherDetails");
        b.userId = doc.getString("userId");
        b.userName = doc.getString("userName");
        b.userRole = doc.getString("userRole");
        b.college = doc.getString("college");
        b.status = doc.getString("status");
        b.rejectReason = doc.getString("rejectReason");
        b.suggestedRoomId = doc.getString("suggestedRoomId");
        b.suggestedDate = doc.getString("suggestedDate");
        b.suggestedTimeFrom = doc.getString("suggestedTimeFrom");
        b.suggestedTimeTo = doc.getString("suggestedTimeTo");
        if (doc.getTimestamp("createdAt") != null) {
            b.createdAt = doc.getTimestamp("createdAt").toDate();
        }
        return b;
    }

    /**
     * Safely reads a Firestore field that may be stored as String or Number.
     * Web app TextFields submit values as strings, so Firestore may store them as String.
     */
    private static int safeInt(Object value, int defaultValue) {
        if (value == null) return defaultValue;
        if (value instanceof Number) return ((Number) value).intValue();
        try { return Integer.parseInt(value.toString().trim()); }
        catch (NumberFormatException e) { return defaultValue; }
    }

    // ── Serialize to Firestore map ─────────────────────────────────────────
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("roomId", roomId);
        map.put("roomType", roomType);
        map.put("hallCategory", hallCategory);
        map.put("date", date);
        map.put("timeFrom", timeFrom);
        map.put("timeTo", timeTo);
        map.put("purpose", purpose);
        map.put("requiredCapacity", requiredCapacity);
        map.put("isHolidayEvent", isHolidayEvent);
        map.put("isOfficialOccasion", isOfficialOccasion);
        map.put("responsibleName", responsibleName);
        map.put("responsibleJob", responsibleJob);
        map.put("responsibleMobile", responsibleMobile);
        map.put("reqMic", reqMic);
        map.put("reqMicQty", reqMicQty);
        map.put("reqLaptop", reqLaptop);
        map.put("reqVideoConf", reqVideoConf);
        map.put("reqOther", reqOther);
        map.put("reqOtherDetails", reqOtherDetails != null ? reqOtherDetails : "");
        map.put("userId", userId);
        map.put("userName", userName);
        map.put("userRole", userRole);
        map.put("college", college != null ? college : "");
        map.put("status", status != null ? status : "pending");
        return map;
    }

    // ── Convenience helpers ────────────────────────────────────────────────
    public boolean hasSuggestedAlternative() {
        return suggestedRoomId != null || suggestedDate != null || suggestedTimeFrom != null;
    }

    public boolean isRejected()  { return "rejected".equals(status); }
    public boolean isApproved()  { return "approved".equals(status); }
    public boolean isPending()   { return "pending".equals(status) || "awaiting_manager_final".equals(status); }

    // ── Getters & Setters ──────────────────────────────────────────────────
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getRoomType() { return roomType; }
    public void setRoomType(String roomType) { this.roomType = roomType; }

    public String getHallCategory() { return hallCategory; }
    public void setHallCategory(String hallCategory) { this.hallCategory = hallCategory; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTimeFrom() { return timeFrom; }
    public void setTimeFrom(String timeFrom) { this.timeFrom = timeFrom; }

    public String getTimeTo() { return timeTo; }
    public void setTimeTo(String timeTo) { this.timeTo = timeTo; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public int getRequiredCapacity() { return requiredCapacity; }
    public void setRequiredCapacity(int requiredCapacity) { this.requiredCapacity = requiredCapacity; }

    public boolean isHolidayEvent() { return isHolidayEvent; }
    public void setHolidayEvent(boolean holidayEvent) { isHolidayEvent = holidayEvent; }

    public boolean isOfficialOccasion() { return isOfficialOccasion; }
    public void setOfficialOccasion(boolean officialOccasion) { isOfficialOccasion = officialOccasion; }

    public String getResponsibleName() { return responsibleName; }
    public void setResponsibleName(String responsibleName) { this.responsibleName = responsibleName; }

    public String getResponsibleJob() { return responsibleJob; }
    public void setResponsibleJob(String responsibleJob) { this.responsibleJob = responsibleJob; }

    public String getResponsibleMobile() { return responsibleMobile; }
    public void setResponsibleMobile(String responsibleMobile) { this.responsibleMobile = responsibleMobile; }

    public boolean isReqMic() { return reqMic; }
    public void setReqMic(boolean reqMic) { this.reqMic = reqMic; }

    public int getReqMicQty() { return reqMicQty; }
    public void setReqMicQty(int reqMicQty) { this.reqMicQty = reqMicQty; }

    public boolean isReqLaptop() { return reqLaptop; }
    public void setReqLaptop(boolean reqLaptop) { this.reqLaptop = reqLaptop; }

    public boolean isReqVideoConf() { return reqVideoConf; }
    public void setReqVideoConf(boolean reqVideoConf) { this.reqVideoConf = reqVideoConf; }

    public boolean isReqOther() { return reqOther; }
    public void setReqOther(boolean reqOther) { this.reqOther = reqOther; }

    public String getReqOtherDetails() { return reqOtherDetails; }
    public void setReqOtherDetails(String reqOtherDetails) { this.reqOtherDetails = reqOtherDetails; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

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

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
