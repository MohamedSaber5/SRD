package com.aast.booking.admin.search;

import com.aast.booking.models.Booking;

import java.util.List;
import java.util.stream.Collectors;

/**
 * DESIGN PATTERN: Strategy Pattern (Concrete Strategy)
 * SOLID: Single Responsibility — handles MULTI-PURPOSE room searches only.
 *
 * Mirrors web's MultiRoomSearchStrategy:
 *   validateInput: requires timeFrom AND timeTo, and timeTo must be after timeFrom
 *   filterBookings: interval overlap — any booking whose [timeFrom, timeTo] overlaps
 *                   the requested [timeFrom, timeTo] means the room is occupied.
 *
 * Overlap formula (mirrors web):
 *   overlap = requestStart < bookingEnd  &&  requestEnd > bookingStart
 */
public class MultiRoomSearchStrategy implements RoomSearchStrategy {

    @Override
    public String validateInput(SearchCriteria criteria) {
        String from = criteria.getTimeFrom();
        String to   = criteria.getTimeTo();

        if (from == null || from.isEmpty() || to == null || to.isEmpty()) {
            return "يرجى تحديد وقت البداية والنهاية.";
        }
        // timeTo must be strictly after timeFrom (string comparison works for "HH:mm" 24h)
        if (to.compareTo(from) <= 0) {
            return "وقت النهاية يجب أن يكون بعد وقت البداية.";
        }
        return null; // valid
    }

    @Override
    public List<String> getOccupiedRoomIds(List<Booking> activeBookings, SearchCriteria criteria) {
        String reqFrom = criteria.getTimeFrom();
        String reqTo   = criteria.getTimeTo();

        return activeBookings.stream()
                .filter(b -> {
                    String bFrom = b.getTimeFrom();
                    String bTo   = b.getTimeTo() != null ? b.getTimeTo() : "23:00"; // default like web
                    // Interval overlap: reqFrom < bTo  &&  reqTo > bFrom
                    return reqFrom.compareTo(bTo) < 0 && reqTo.compareTo(bFrom) > 0;
                })
                .map(Booking::getRoomId)
                .distinct()
                .collect(Collectors.toList());
    }
}
