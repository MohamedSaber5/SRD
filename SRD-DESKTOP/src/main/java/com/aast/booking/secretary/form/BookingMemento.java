package com.aast.booking.secretary.form;

/**
 * DESIGN PATTERN: Memento
 * Stores a snapshot of the form state.
 */
public class BookingMemento {
    private final String roomId;
    private final String date;
    private final String timeFrom;
    private final String timeTo;
    private final String purpose;
    private final String capacity;
    private final boolean isHoliday;
    private final boolean isOfficial;

    // Step 2 & 3 fields
    private final String requesterName;
    private final String requesterTitle;
    private final String requesterPhone;
    private final boolean isLaptop;
    private final boolean isVideoConf;
    private final boolean isMic;

    public BookingMemento(String roomId, String date, String timeFrom, String timeTo, String purpose, String capacity, 
                          boolean isHoliday, boolean isOfficial, String requesterName, String requesterTitle, 
                          String requesterPhone, boolean isLaptop, boolean isVideoConf, boolean isMic) {
        this.roomId = roomId;
        this.date = date;
        this.timeFrom = timeFrom;
        this.timeTo = timeTo;
        this.purpose = purpose;
        this.capacity = capacity;
        this.isHoliday = isHoliday;
        this.isOfficial = isOfficial;
        this.requesterName = requesterName;
        this.requesterTitle = requesterTitle;
        this.requesterPhone = requesterPhone;
        this.isLaptop = isLaptop;
        this.isVideoConf = isVideoConf;
        this.isMic = isMic;
    }

    public String getRoomId() { return roomId; }
    public String getDate() { return date; }
    public String getTimeFrom() { return timeFrom; }
    public String getTimeTo() { return timeTo; }
    public String getPurpose() { return purpose; }
    public String getCapacity() { return capacity; }
    public boolean isHoliday() { return isHoliday; }
    public boolean isOfficial() { return isOfficial; }
    
    public String getRequesterName() { return requesterName; }
    public String getRequesterTitle() { return requesterTitle; }
    public String getRequesterPhone() { return requesterPhone; }
    public boolean isLaptop() { return isLaptop; }
    public boolean isVideoConf() { return isVideoConf; }
    public boolean isMic() { return isMic; }
}
