package com.aast.booking.core;

import com.aast.booking.models.User;
import javafx.stage.Stage;

/**
 * DESIGN PATTERN: Singleton
 *
 * Problem Solved: Provides a global, single access point to the currently
 *                 logged-in user data and the primary application window,
 *                 avoiding the need to pass these objects around everywhere.
 *
 * Holds the authenticated user's session data throughout the app lifecycle.
 */
public class SessionManager {

    private static SessionManager instance;

    private User currentUser;
    private Stage primaryStage;
    private String idToken;  // Firebase ID token from REST Auth login

    private SessionManager() {}

    public static SessionManager getInstance() {
        if (instance == null) {
            synchronized (SessionManager.class) {
                if (instance == null) {
                    instance = new SessionManager();
                }
            }
        }
        return instance;
    }

    // ── Getters & Setters ──────────────────────────────────────────────────

    public User getCurrentUser() { return currentUser; }
    public void setCurrentUser(User user) { this.currentUser = user; }

    public Stage getPrimaryStage() { return primaryStage; }
    public void setPrimaryStage(Stage stage) { this.primaryStage = stage; }

    public String getIdToken() { return idToken; }
    public void setIdToken(String token) { this.idToken = token; }

    public boolean isLoggedIn() { return currentUser != null; }

    /**
     * Clears the session on logout.
     */
    public void clearSession() {
        currentUser = null;
        idToken = null;
    }
}
