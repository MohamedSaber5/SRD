package com.aast.booking.admin.search;

/**
 * SOLID: Single Responsibility — this class ONLY holds the search parameters.
 * Mirrors the web: { timeFrom, timeTo, selectedSlot } passed to strategy.
 */
public class SearchCriteria {

    // For 'multi' room type: freely chosen start/end hours
    private String timeFrom;
    private String timeTo;

    // For 'fixed' room type: one of the predefined lecture slots
    private LectureSlot selectedSlot;

    // Common filters
    private String roomType;   // "fixed" or "multi"
    private String date;       // ISO date string "YYYY-MM-DD"
    private int minCapacity;   // 0 = no filter

    // ── Constructors ──────────────────────────────────────────────────────

    /** For multi-purpose rooms: specify free start/end time */
    public SearchCriteria(String roomType, String date, int minCapacity, String timeFrom, String timeTo) {
        this.roomType    = roomType;
        this.date        = date;
        this.minCapacity = minCapacity;
        this.timeFrom    = timeFrom;
        this.timeTo      = timeTo;
    }

    /** For fixed/lecture rooms: specify a predefined slot */
    public SearchCriteria(String roomType, String date, int minCapacity, LectureSlot selectedSlot) {
        this.roomType      = roomType;
        this.date          = date;
        this.minCapacity   = minCapacity;
        this.selectedSlot  = selectedSlot;
    }

    // ── Getters ───────────────────────────────────────────────────────────

    public String getTimeFrom()       { return timeFrom; }
    public String getTimeTo()         { return timeTo; }
    public LectureSlot getSelectedSlot() { return selectedSlot; }
    public String getRoomType()       { return roomType; }
    public String getDate()           { return date; }
    public int getMinCapacity()       { return minCapacity; }
}
