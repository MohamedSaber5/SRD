package com.aast.booking.employee;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class BookingValidator {

    public static String validateStep1(String selectedHallCategory, LocalDate date, String timeFrom, String timeTo, String purpose, String capacity, int requiredLeadTimeHours) {
        if (selectedHallCategory == null || selectedHallCategory.isEmpty()) {
            return "يرجى اختيار نوع القاعة أولاً";
        }
        if (date == null) {
            return "يرجى اختيار تاريخ الحجز";
        }
        if (purpose == null || purpose.trim().isEmpty()) {
            return "يرجى كتابة الغرض من الاستخدام";
        }
        if (capacity == null || capacity.trim().isEmpty()) {
            return "يرجى إدخال السعة المطلوبة";
        }
        if (!capacity.matches("[0-9]+")) {
            return "السعة المطلوبة يجب أن تحتوي على أرقام فقط";
        }
        if (timeFrom == null || timeFrom.isEmpty() || timeTo == null || timeTo.isEmpty()) {
            return "يرجى تحديد وقت البداية والنهاية للحجز";
        }
        // Validate that end time is after start time (only relevant for multi-purpose where both are free fields)
        if (timeFrom != null && !timeFrom.isEmpty() && timeTo != null && !timeTo.isEmpty()) {
            try {
                String[] fromParts = timeFrom.split(":");
                String[] toParts   = timeTo.split(":");
                int fromMinutes = Integer.parseInt(fromParts[0]) * 60 + Integer.parseInt(fromParts[1]);
                int toMinutes   = Integer.parseInt(toParts[0])   * 60 + Integer.parseInt(toParts[1]);
                if (toMinutes <= fromMinutes) {
                    return "وقت النهاية يجب أن يكون بعد وقت البداية";
                }
            } catch (NumberFormatException ignored) {}
        }
        if (timeFrom != null && !timeFrom.isEmpty()) {
            String[] parts = timeFrom.split(":");
            LocalDateTime selectedDT = date.atTime(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
            LocalDateTime now = LocalDateTime.now();
            long diffHours = java.time.Duration.between(now, selectedDT).toHours();
            if (diffHours < requiredLeadTimeHours) {
                return "الوقت المختار لا يستوفي الحد الأدنى المطلوب للحجز (" + requiredLeadTimeHours + " ساعة)";
            }
        }
        return null; // Valid
    }

    public static String validateStep2(String respName, String respJob, String respMobile) {
        if (respName == null || respName.trim().isEmpty() ||
            respJob == null || respJob.trim().isEmpty() ||
            respMobile == null || respMobile.trim().isEmpty()) {
            return "يرجى تعبئة جميع بيانات المسؤول";
        }
        if (!respMobile.matches("[0-9]+")) {
            return "رقم المحمول يجب أن يحتوي على أرقام فقط";
        }
        if (respName.matches(".*[0-9].*")) {
            return "الاسم لا يجب أن يحتوي على أرقام";
        }
        if (respJob.matches(".*[0-9].*")) {
            return "المسمى الوظيفي لا يجب أن يحتوي على أرقام";
        }
        return null; // Valid
    }

    public static String validateStep3(boolean reqOther, String reqOtherDetails) {
        if (reqOther && (reqOtherDetails == null || reqOtherDetails.trim().isEmpty())) {
            return "يرجى كتابة تفاصيل المتطلبات الأخرى";
        }
        return null; // Valid
    }
}
