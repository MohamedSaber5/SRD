package com.aast.booking.services;

import com.aast.booking.models.Room;
import com.aast.booking.models.User;
import com.aast.booking.models.Booking;
import java.util.List;
import java.util.ArrayList;

/**
 * SINGLETON: Centralized store for cached data to prevent redundant Firestore reads.
 */
public class GlobalDataService {
    private static volatile GlobalDataService instance;

    private List<Room> cachedRooms = null;
    private List<User> cachedUsers = null;
    private List<Booking> cachedBookings = null;
    private long lastRoomFetch = 0;
    private long lastUserFetch = 0;
    private long lastBookingFetch = 0;

    private static final long CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

    private GlobalDataService() {}

    public static GlobalDataService getInstance() {
        if (instance == null) {
            synchronized (GlobalDataService.class) {
                if (instance == null) {
                    instance = new GlobalDataService();
                }
            }
        }
        return instance;
    }

    public List<Room> getCachedRooms() { return cachedRooms; }
    public void setCachedRooms(List<Room> rooms) {
        this.cachedRooms = rooms;
        this.lastRoomFetch = System.currentTimeMillis();
    }

    public List<User> getCachedUsers() { return cachedUsers; }
    public void setCachedUsers(List<User> users) {
        this.cachedUsers = users;
        this.lastUserFetch = System.currentTimeMillis();
    }

    public List<Booking> getCachedBookings() { return cachedBookings; }
    public void setCachedBookings(List<Booking> bookings) {
        this.cachedBookings = bookings;
        this.lastBookingFetch = System.currentTimeMillis();
    }

    public boolean isRoomCacheStale() {
        return cachedRooms == null || (System.currentTimeMillis() - lastRoomFetch > CACHE_DURATION_MS);
    }

    public boolean isUserCacheStale() {
        return cachedUsers == null || (System.currentTimeMillis() - lastUserFetch > CACHE_DURATION_MS);
    }

    public boolean isBookingCacheStale() {
        return cachedBookings == null || (System.currentTimeMillis() - lastBookingFetch > CACHE_DURATION_MS);
    }
    
    public void clearCache() {
        cachedRooms = null;
        cachedUsers = null;
        cachedBookings = null;
    }

    public void invalidateRooms() {
        cachedRooms = null;
    }

    public void invalidateBookings() {
        cachedBookings = null;
    }
}
