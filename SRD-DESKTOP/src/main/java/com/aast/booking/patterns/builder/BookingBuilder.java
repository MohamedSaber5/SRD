package com.aast.booking.patterns.builder;

import com.aast.booking.models.Booking;

/**
 * DESIGN PATTERN: Builder
 *
 * Problem Solved: The Booking object has 20+ fields spread across 3 form steps.
 *                 Using a regular constructor would result in an unreadable method call
 *                 with 20 parameters. Builder allows us to set fields gradually,
 *                 step by step, exactly matching the 3-step booking form in the web app.
 *
 * Usage:
 *   Booking booking = new BookingBuilder()
 *       // Step 1 - Basic Info
 *       .roomId("A-101").roomType("fixed").hallCategory("lecture")
 *       .date("2026-06-01").timeFrom("08:30").timeTo("10:10")
 *       .purpose("محاضرة تعويضية").requiredCapacity(50)
 *       // Step 2 - Responsible Person
 *       .responsibleName("أحمد محمد").responsibleJob("دكتور").responsibleMobile("01234567890")
 *       // Step 3 - Requirements
 *       .reqMic(true, 2).reqLaptop(false).reqVideoConf(false)
 *       // Metadata (from session)
 *       .userId("uid123").userName("أحمد").userRole("employee")
 *       .build();
 */
public class BookingBuilder implements IBookingBuilder {

    private final Booking booking;

    public BookingBuilder() {
        this.booking = new Booking();
        // Defaults matching the web formData initial state
        this.booking.setReqMicQty(1);
        this.booking.setStatus("pending");
    }

    // ── Step 1: Basic Info ─────────────────────────────────────────────────

    @Override
    public IBookingBuilder roomId(String roomId) {
        booking.setRoomId(roomId);
        return this;
    }

    @Override
    public IBookingBuilder roomType(String roomType) {
        booking.setRoomType(roomType);
        return this;
    }

    @Override
    public IBookingBuilder hallCategory(String hallCategory) {
        booking.setHallCategory(hallCategory);
        return this;
    }

    @Override
    public IBookingBuilder date(String date) {
        booking.setDate(date);
        return this;
    }

    @Override
    public IBookingBuilder timeFrom(String timeFrom) {
        booking.setTimeFrom(timeFrom);
        return this;
    }

    @Override
    public IBookingBuilder timeTo(String timeTo) {
        booking.setTimeTo(timeTo);
        return this;
    }

    @Override
    public IBookingBuilder purpose(String purpose) {
        booking.setPurpose(purpose);
        return this;
    }

    @Override
    public IBookingBuilder requiredCapacity(int capacity) {
        booking.setRequiredCapacity(capacity);
        return this;
    }

    @Override
    public IBookingBuilder holidayEvent(boolean isHolidayEvent) {
        booking.setHolidayEvent(isHolidayEvent);
        return this;
    }

    @Override
    public IBookingBuilder officialOccasion(boolean isOfficialOccasion) {
        booking.setOfficialOccasion(isOfficialOccasion);
        return this;
    }

    // ── Step 2: Responsible Person ─────────────────────────────────────────

    @Override
    public IBookingBuilder responsibleName(String name) {
        booking.setResponsibleName(name);
        return this;
    }

    @Override
    public IBookingBuilder responsibleJob(String job) {
        booking.setResponsibleJob(job);
        return this;
    }

    @Override
    public IBookingBuilder responsibleMobile(String mobile) {
        booking.setResponsibleMobile(mobile);
        return this;
    }

    // ── Step 3: Requirements ───────────────────────────────────────────────

    @Override
    public IBookingBuilder reqMic(boolean reqMic, int qty) {
        booking.setReqMic(reqMic);
        booking.setReqMicQty(qty);
        return this;
    }

    @Override
    public IBookingBuilder reqLaptop(boolean reqLaptop) {
        booking.setReqLaptop(reqLaptop);
        return this;
    }

    @Override
    public IBookingBuilder reqVideoConf(boolean reqVideoConf) {
        booking.setReqVideoConf(reqVideoConf);
        return this;
    }

    @Override
    public IBookingBuilder reqOther(boolean reqOther, String details) {
        booking.setReqOther(reqOther);
        booking.setReqOtherDetails(details != null ? details : "");
        return this;
    }

    // ── Metadata (from SessionManager) ────────────────────────────────────

    @Override
    public IBookingBuilder userId(String userId) {
        booking.setUserId(userId);
        return this;
    }

    @Override
    public IBookingBuilder userName(String userName) {
        booking.setUserName(userName);
        return this;
    }

    @Override
    public IBookingBuilder userRole(String role) {
        booking.setUserRole(role);
        // Mirror web logic: status = admin -> awaiting_manager_final, else pending
        if ("admin".equals(role) || "temp_admin".equals(role)) {
            booking.setStatus("awaiting_manager_final");
        } else {
            booking.setStatus("pending");
        }
        return this;
    }

    @Override
    public IBookingBuilder college(String college) {
        booking.setCollege(college);
        return this;
    }

    // ── Pre-defined Defaults (Builder Pattern enhancement) ────────────────
    
    /**
     * Applies default values for Lecture rooms.
     * Overrides responsible person and sets requirements to false/0.
     */
    @Override
    public IBookingBuilder applyLectureDefaults(String defaultResponsibleName) {
        if (booking.getResponsibleName() == null || booking.getResponsibleName().trim().isEmpty()) {
            booking.setResponsibleName(defaultResponsibleName != null ? defaultResponsibleName : "");
        }
        if (booking.getResponsibleJob() == null || booking.getResponsibleJob().trim().isEmpty()) {
            booking.setResponsibleJob("-");
        }
        if (booking.getResponsibleMobile() == null || booking.getResponsibleMobile().trim().isEmpty()) {
            booking.setResponsibleMobile("-");
        }
        // No technical requirements for lecture halls by default
        booking.setReqMic(false);
        booking.setReqMicQty(0);
        booking.setReqLaptop(false);
        booking.setReqVideoConf(false);
        booking.setReqOther(false);
        booking.setReqOtherDetails("");
        return this;
    }

    // ── Pre-fill from existing booking (used with Prototype) ──────────────
    /**
     * Pre-populates builder from a Prototype-cloned booking.
     * Called when user submits with suggested alternative.
     */
    @Override
    public IBookingBuilder fromPrototype(Booking prototype) {
        booking.setRoomId(prototype.getRoomId());
        booking.setRoomType(prototype.getRoomType());
        booking.setHallCategory(prototype.getHallCategory());
        booking.setDate(prototype.getDate());
        booking.setTimeFrom(prototype.getTimeFrom());
        booking.setTimeTo(prototype.getTimeTo());
        booking.setPurpose(prototype.getPurpose());
        booking.setRequiredCapacity(prototype.getRequiredCapacity());
        booking.setHolidayEvent(prototype.isHolidayEvent());
        booking.setOfficialOccasion(prototype.isOfficialOccasion());
        booking.setResponsibleName(prototype.getResponsibleName());
        booking.setResponsibleJob(prototype.getResponsibleJob());
        booking.setResponsibleMobile(prototype.getResponsibleMobile());
        booking.setReqMic(prototype.isReqMic());
        booking.setReqMicQty(prototype.getReqMicQty());
        booking.setReqLaptop(prototype.isReqLaptop());
        booking.setReqVideoConf(prototype.isReqVideoConf());
        booking.setReqOther(prototype.isReqOther());
        booking.setReqOtherDetails(prototype.getReqOtherDetails());
        return this;
    }

    // ── Build ──────────────────────────────────────────────────────────────

    /**
     * Validates and returns the complete Booking object.
     *
     * @throws IllegalStateException if required fields for step 1 are missing
     */
    public Booking build() {
        // roomId is NOT required — the Admin assigns the room after reviewing the request.
        // Mirrors the web app behavior where employee submits without a specific room.
        if (booking.getDate() == null || booking.getDate().isEmpty())
            throw new IllegalStateException("date is required");
        if (booking.getTimeFrom() == null || booking.getTimeFrom().isEmpty())
            throw new IllegalStateException("timeFrom is required");
        if (booking.getTimeTo() == null || booking.getTimeTo().isEmpty())
            throw new IllegalStateException("timeTo is required");
        if (booking.getPurpose() == null || booking.getPurpose().isEmpty())
            throw new IllegalStateException("purpose is required");
        if (booking.getUserId() == null || booking.getUserId().isEmpty())
            throw new IllegalStateException("userId is required");
        if (booking.getHallCategory() == null || booking.getHallCategory().isEmpty())
            throw new IllegalStateException("hallCategory is required");

        return booking;
    }
}
