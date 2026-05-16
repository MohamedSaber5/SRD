package com.aast.booking.admin.search;

import com.aast.booking.models.Booking;
import java.util.List;

/**
 * DESIGN PATTERN: Strategy (Interface)
 * SOLID: Open/Closed Principle — new room types can add a new strategy without
 *        modifying the AdvancedSearchController.
 *
 * Mirrors the web AdvancedRoomSearch.jsx SearchStrategy base class exactly.
 * Each strategy knows how to:
 *   1. Validate the user's time/slot input before searching.
 *   2. Filter a list of active bookings to find which rooms are occupied.
 */
public interface RoomSearchStrategy {

    /**
     * Validates the search parameters.
     * @return an Arabic error message if invalid, or null if valid.
     */
    String validateInput(SearchCriteria criteria);

    /**
     * Filters the active bookings list and returns only the IDs of rooms
     * that are OCCUPIED during the requested time window.
     *
     * @param activeBookings List of bookings active on the selected date.
     * @param criteria       The search parameters from the UI.
     * @return Set of roomIds that are occupied (to be excluded from results).
     */
    List<String> getOccupiedRoomIds(List<Booking> activeBookings, SearchCriteria criteria);
}
