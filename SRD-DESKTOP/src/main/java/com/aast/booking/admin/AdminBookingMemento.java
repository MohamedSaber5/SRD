package com.aast.booking.admin;

/**
 * DESIGN PATTERN: Memento
 * Stores a snapshot of the Admin Booking Form state.
 */
public class AdminBookingMemento {
    private final String roomId;
    private final String hallCategory;
    private final String date;
    private final String timeFrom;
    private final String timeTo;
    private final String purpose;
    private final String capacity;
    
    private final String respName;
    private final String respJob;
    private final String respMobile;
    
    private final boolean reqMic;
    private final int reqMicQty;
    private final boolean reqLaptop;
    private final boolean reqVideoConf;
    private final boolean reqOther;
    private final String reqOtherDetails;

    public AdminBookingMemento(String roomId, String hallCategory, String date, String timeFrom, String timeTo, String purpose, String capacity,
                               String respName, String respJob, String respMobile,
                               boolean reqMic, int reqMicQty, boolean reqLaptop, boolean reqVideoConf,
                               boolean reqOther, String reqOtherDetails) {
        this.roomId = roomId;
        this.hallCategory = hallCategory;
        this.date = date;
        this.timeFrom = timeFrom;
        this.timeTo = timeTo;
        this.purpose = purpose;
        this.capacity = capacity;
        this.respName = respName;
        this.respJob = respJob;
        this.respMobile = respMobile;
        this.reqMic = reqMic;
        this.reqMicQty = reqMicQty;
        this.reqLaptop = reqLaptop;
        this.reqVideoConf = reqVideoConf;
        this.reqOther = reqOther;
        this.reqOtherDetails = reqOtherDetails;
    }

    public String getRoomId() { return roomId; }
    public String getHallCategory() { return hallCategory; }
    public String getDate() { return date; }
    public String getTimeFrom() { return timeFrom; }
    public String getTimeTo() { return timeTo; }
    public String getPurpose() { return purpose; }
    public String getCapacity() { return capacity; }
    public String getRespName() { return respName; }
    public String getRespJob() { return respJob; }
    public String getRespMobile() { return respMobile; }
    public boolean isReqMic() { return reqMic; }
    public int getReqMicQty() { return reqMicQty; }
    public boolean isReqLaptop() { return reqLaptop; }
    public boolean isReqVideoConf() { return reqVideoConf; }
    public boolean isReqOther() { return reqOther; }
    public String getReqOtherDetails() { return reqOtherDetails; }
}
