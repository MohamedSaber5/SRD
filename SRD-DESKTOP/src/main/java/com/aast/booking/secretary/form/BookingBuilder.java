package com.aast.booking.secretary.form;

import com.aast.booking.models.BookingRequest;

/**
 * DESIGN PATTERN: Builder
 */
public interface BookingBuilder {
    BookingBuilder setUserId(String userId);
    BookingBuilder setEmployeeName(String name);
    BookingBuilder setRoomId(String roomId);
    BookingBuilder setDate(String date);
    BookingBuilder setTimeFrom(String timeFrom);
    BookingBuilder setTimeTo(String timeTo);
    BookingBuilder setPurpose(String purpose);
    BookingBuilder setStatus(String status);
    BookingBuilder setCreatedAt(String createdAt);
    BookingRequest build();
}
