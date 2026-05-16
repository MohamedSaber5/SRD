package com.aast.booking.services;

import com.aast.booking.models.Room;
import com.aast.booking.models.User;
import java.util.List;
import java.util.ArrayList;

/**
 * SINGLETON: Centralized store for cached data to prevent redundant Firestore reads.
 */
public class GlobalDataService {
    private static GlobalDataService instance;

    private List<Room> cachedRooms = null;
    private List<User> cachedUsers = null;
    private long lastRoomFetch = 0;
    private long lastUserFetch = 0;

    private static final long CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

    private GlobalDataService() {}

    public static synchronized GlobalDataService getInstance() {
        if (instance == null) instance = new GlobalDataService();
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

    public boolean isRoomCacheStale() {
        return cachedRooms == null || (System.currentTimeMillis() - lastRoomFetch > CACHE_DURATION_MS);
    }

    public boolean isUserCacheStale() {
        return cachedUsers == null || (System.currentTimeMillis() - lastUserFetch > CACHE_DURATION_MS);
    }
    
    public void clearCache() {
        cachedRooms = null;
        cachedUsers = null;
    }
}
