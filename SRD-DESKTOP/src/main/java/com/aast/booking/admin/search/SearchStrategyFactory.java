package com.aast.booking.admin.search;

/**
 * DESIGN PATTERN: Factory Method
 * SOLID: Open/Closed Principle — adding a new room type only requires a new
 *        strategy class and one new case here; nothing else changes.
 *
 * Mirrors web's SearchStrategyFactory exactly:
 *   createStrategy('multi')  → MultiRoomSearchStrategy
 *   createStrategy('fixed')  → FixedRoomSearchStrategy
 */
public class SearchStrategyFactory {

    private SearchStrategyFactory() { /* utility — not instantiable */ }

    /**
     * @param roomType "fixed" or "multi"
     * @return the appropriate RoomSearchStrategy
     * @throws IllegalArgumentException for unknown room types
     */
    public static RoomSearchStrategy createStrategy(String roomType) {
        if ("multi".equals(roomType)) {
            return new MultiRoomSearchStrategy();
        }
        if ("fixed".equals(roomType)) {
            return new FixedRoomSearchStrategy();
        }
        throw new IllegalArgumentException("Unknown room type for search strategy: " + roomType);
    }
}
