package com.aast.booking.admin.schedule;

import com.aast.booking.models.Room;
import java.util.Comparator;
import java.util.List;

/**
 * DESIGN PATTERN: Strategy (Concrete Implementation)
 * SOLID: SRP — only knows how to pick the room with minimum waste (capacity - required).
 *
 * Logic (mirrors user requirement):
 *   "لو السعة المطلوبة عشرين وعندى روم 25 وروم 50 اختار 25"
 *
 * Steps:
 *   1. Sort candidates by (capacity - requiredCapacity) ascending.
 *   2. Return the first — the tightest fit above or equal to required.
 *
 * Precondition: all candidates already have capacity >= requiredCapacity
 *               (enforced by RoomAvailabilityChecker before calling this).
 */
public class BestFitRoomSelectionStrategy implements RoomSelectionStrategy {

    @Override
    public Room select(List<Room> candidates, int requiredCapacity) {
        if (candidates == null || candidates.isEmpty()) return null;
        return candidates.stream()
                .min(Comparator.comparingInt(r -> r.getCapacity() - requiredCapacity))
                .orElse(null);
    }
}
