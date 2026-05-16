package com.aast.booking.admin.search;

import java.util.Arrays;
import java.util.List;

/**
 * DESIGN PATTERN: Strategy Pattern (Concrete Strategy)
 * SOLID: Single Responsibility — knows only how to handle FIXED/LECTURE room searches.
 *
 * Mirrors web's FixedRoomSearchStrategy:
 *   validateInput: requires a selected slot
 *   filterBookings: exact timeFrom+timeTo match (lecture slots are fixed intervals)
 */
public class FixedRoomSearchStrategy implements RoomSearchStrategy {

    @Override
    public String validateInput(SearchCriteria criteria) {
        if (criteria.getSelectedSlot() == null) {
            return "يرجى اختيار فترة المحاضرة.";
        }
        return null; // valid
    }

    @Override
    public List<String> getOccupiedRoomIds(List<com.aast.booking.models.Booking> activeBookings, SearchCriteria criteria) {
        LectureSlot slot = criteria.getSelectedSlot();
        // A room is occupied if a booking's timeFrom AND timeTo exactly match the slot
        // (mirrors web: b.timeFrom === selectedSlot.from && b.timeTo === selectedSlot.to)
        return activeBookings.stream()
                .filter(b -> slot.getFrom().equals(b.getTimeFrom()) && slot.getTo().equals(b.getTimeTo()))
                .map(com.aast.booking.models.Booking::getRoomId)
                .distinct()
                .collect(java.util.stream.Collectors.toList());
    }
}
