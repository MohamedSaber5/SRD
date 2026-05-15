package com.aast.booking.secretary.form;

import com.aast.booking.models.BookingRequest;

public class StandardBookingBuilder implements BookingBuilder {
    private String id;
    private String userId;
    private String employeeName;
    private String roomId;
    private String date;
    private String timeFrom;
    private String timeTo;
    private String purpose;
    private String status = "Pending"; // default
    private String createdAt;

    public StandardBookingBuilder(String id) {
        this.id = id;
    }

    @Override
    public BookingBuilder setUserId(String userId) {
        this.userId = userId;
        return this;
    }

    @Override
    public BookingBuilder setEmployeeName(String name) {
        this.employeeName = name;
        return this;
    }

    @Override
    public BookingBuilder setRoomId(String roomId) {
        this.roomId = roomId;
        return this;
    }

    @Override
    public BookingBuilder setDate(String date) {
        this.date = date;
        return this;
    }

    @Override
    public BookingBuilder setTimeFrom(String timeFrom) {
        this.timeFrom = timeFrom;
        return this;
    }

    @Override
    public BookingBuilder setTimeTo(String timeTo) {
        this.timeTo = timeTo;
        return this;
    }

    @Override
    public BookingBuilder setPurpose(String purpose) {
        this.purpose = purpose;
        return this;
    }

    @Override
    public BookingBuilder setStatus(String status) {
        this.status = status;
        return this;
    }

    @Override
    public BookingBuilder setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    @Override
    public BookingRequest build() {
        BookingRequest request = new BookingRequest(id, userId, employeeName, roomId, date, status);
        request.setTimeFrom(timeFrom);
        request.setTimeTo(timeTo);
        request.setPurpose(purpose);
        request.setCreatedAt(createdAt);
        return request;
    }
}
