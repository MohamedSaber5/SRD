package com.aast.booking.patterns.builder;

import com.aast.booking.models.Booking;

public interface IBookingBuilder {
    IBookingBuilder roomId(String roomId);
    IBookingBuilder roomType(String roomType);
    IBookingBuilder hallCategory(String hallCategory);
    IBookingBuilder date(String date);
    IBookingBuilder timeFrom(String timeFrom);
    IBookingBuilder timeTo(String timeTo);
    IBookingBuilder purpose(String purpose);
    IBookingBuilder requiredCapacity(int capacity);
    IBookingBuilder holidayEvent(boolean isHolidayEvent);
    IBookingBuilder officialOccasion(boolean isOfficialOccasion);
    IBookingBuilder responsibleName(String name);
    IBookingBuilder responsibleJob(String job);
    IBookingBuilder responsibleMobile(String mobile);
    IBookingBuilder reqMic(boolean reqMic, int qty);
    IBookingBuilder reqLaptop(boolean reqLaptop);
    IBookingBuilder reqVideoConf(boolean reqVideoConf);
    IBookingBuilder reqOther(boolean reqOther, String details);
    IBookingBuilder userId(String userId);
    IBookingBuilder userName(String userName);
    IBookingBuilder userRole(String role);
    IBookingBuilder college(String college);
    IBookingBuilder applyLectureDefaults(String defaultResponsibleName);
    IBookingBuilder fromPrototype(Booking prototype);
    Booking build();
}
