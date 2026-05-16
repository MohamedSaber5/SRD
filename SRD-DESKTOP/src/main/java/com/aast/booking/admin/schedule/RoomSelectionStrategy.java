package com.aast.booking.admin.schedule;

import com.aast.booking.models.Room;
import java.util.List;

/**
 * DESIGN PATTERN: Strategy (Interface)
 * SOLID:
 *   - ISP: thin interface — only one method, no fat interface.
 *   - OCP: new selection algorithms (e.g. RandomRoom, LargestRoom) add a class, not a change.
 *   - DIP: LectureSchedulingEngine depends on this abstraction, not on a concrete class.
 *
 * Contract: given a list of candidate rooms (already filtered for type and availability),
 * return the best one, or null if none qualifies.
 */
public interface RoomSelectionStrategy {

    /**
     * Selects the best room from candidates based on a specific criterion.
     *
     * @param candidates      Rooms already filtered: correct type + capacity >= required + free at slot
     * @param requiredCapacity The capacity requested (used by best-fit to minimize gap)
     * @return the chosen Room, or null if candidates is empty
     */
    Room select(List<Room> candidates, int requiredCapacity);
}
