package com.aast.booking.patterns.builder;

import com.aast.booking.models.Booking;

public class BookingDirector {

    // Used by Secretary — all fields available
    public Booking buildSecretaryMultiPurposeBooking(IBookingBuilder b,
            String date, String timeFrom, String timeTo, String purpose,
            int capacity, String responsibleName, String responsibleJob,
            String responsibleMobile, boolean reqMic, int micQty,
            boolean reqLaptop, boolean reqVideoConf, String userId, String userName) {
        return b.roomType("multi")
                .hallCategory("multi")
                .date(date).timeFrom(timeFrom).timeTo(timeTo)
                .purpose(purpose).requiredCapacity(capacity)
                .responsibleName(responsibleName)
                .responsibleJob(responsibleJob)
                .responsibleMobile(responsibleMobile)
                .reqMic(reqMic, micQty).reqLaptop(reqLaptop).reqVideoConf(reqVideoConf)
                .userId(userId).userName(userName).userRole("secretary")
                .build();
    }

    // Used by Employee — simpler, no room assigned
    public Booking buildEmployeeMultiPurposeRequest(IBookingBuilder b,
            String date, String timeFrom, String timeTo, String purpose,
            int capacity, String responsibleName, String responsibleJob,
            String responsibleMobile, boolean reqMic, int micQty,
            boolean reqLaptop, boolean reqVideoConf, boolean reqOther, String otherDetails,
            String userId, String userName) {
        return b.roomType("multi")
                .hallCategory("multi")
                .date(date).timeFrom(timeFrom).timeTo(timeTo)
                .purpose(purpose).requiredCapacity(capacity)
                .responsibleName(responsibleName)
                .responsibleJob(responsibleJob)
                .responsibleMobile(responsibleMobile)
                .reqMic(reqMic, micQty).reqLaptop(reqLaptop).reqVideoConf(reqVideoConf)
                .reqOther(reqOther, otherDetails)
                .userId(userId).userName(userName).userRole("employee")
                .build();
    }

    // Used by Admin — similar to employee but sets userRole to "admin"
    public Booking buildAdminMultiPurposeRequest(IBookingBuilder b,
            String roomId, String date, String timeFrom, String timeTo, String purpose,
            int capacity, String responsibleName, String responsibleJob,
            String responsibleMobile, boolean reqMic, int micQty,
            boolean reqLaptop, boolean reqVideoConf, boolean reqOther, String otherDetails,
            String userId, String userName) {
        return b.roomId(roomId)
                .roomType("multi")
                .hallCategory("multi")
                .date(date).timeFrom(timeFrom).timeTo(timeTo)
                .purpose(purpose).requiredCapacity(capacity)
                .responsibleName(responsibleName)
                .responsibleJob(responsibleJob)
                .responsibleMobile(responsibleMobile)
                .reqMic(reqMic, micQty).reqLaptop(reqLaptop).reqVideoConf(reqVideoConf)
                .reqOther(reqOther, otherDetails)
                .userId(userId).userName(userName).userRole("admin")
                .build();
    }
}
