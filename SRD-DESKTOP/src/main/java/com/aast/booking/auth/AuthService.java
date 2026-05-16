package com.aast.booking.auth;

import com.aast.booking.models.User;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.gson.*;
import com.aast.booking.core.FirebaseService;
import com.aast.booking.core.SessionManager;
import okhttp3.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

/**
 * Handles all Firebase Authentication and Firestore user operations.
 *
 * DESIGN PATTERN used here: Facade
 * Problem Solved: Hides the complexity of making HTTP calls to Firebase REST API
 *                 and Firestore lookups behind simple methods like login() and register().
 *
 * Replicates the exact same logic as the web app's AuthContext.jsx:
 *   - Employee ID is converted to email: employeeId + "@aast.edu"
 *   - Role is fetched from Firestore "users" collection
 *   - Hardcoded role-promotion map for test accounts
 */
public class AuthService {

    private static final OkHttpClient httpClient = new OkHttpClient();
    private static final Gson gson = new Gson();
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    // Same role-promotion map as web AuthContext.jsx
    private static final Map<String, String[]> ROLES_MAP = new HashMap<>();
    static {
        ROLES_MAP.put("admin@aast.edu",     new String[]{"admin",          "المسؤول العام"});
        ROLES_MAP.put("manager@aast.edu",   new String[]{"branch_manager", "مدير الفرع"});
        ROLES_MAP.put("employee@aast.edu",  new String[]{"employee",       "موظف تجريبي"});
        ROLES_MAP.put("secretary@aast.edu", new String[]{"secretary",      "سكرتير الكلية"});
    }

    /**
     * Converts an employee ID to Firebase email format.
     * Mirrors: formatEmail = (uid) => `${uid.trim()}@aast.edu`
     */
    public static String formatEmail(String employeeId) {
        return employeeId.trim() + "@aast.edu";
    }

    /**
     * Authenticates a user using Firebase REST Auth (signInWithEmailAndPassword).
     * On success, fetches the user's role from Firestore and stores session.
     *
     * @param employeeId  The employee ID entered by the user (not email)
     * @param password    The password entered by the user
     * @return User object with role populated
     * @throws AuthException on invalid credentials or network error
     */
    public static User login(String employeeId, String password) throws AuthException {
        String email = formatEmail(employeeId);

        // ── Step 1: Authenticate via Firebase REST API ─────────────────────
        String requestBody = gson.toJson(Map.of(
            "email", email,
            "password", password,
            "returnSecureToken", true
        ));

        Request request = new Request.Builder()
            .url(FirebaseService.FIREBASE_AUTH_URL)
            .post(RequestBody.create(requestBody, JSON))
            .build();

        String uid;
        String idToken;

        try (Response response = httpClient.newCall(request).execute()) {
            String responseBody = response.body().string();
            JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);

            if (!response.isSuccessful()) {
                // Parse Firebase error code
                String errorCode = "";
                if (jsonResponse.has("error")) {
                    JsonObject error = jsonResponse.getAsJsonObject("error");
                    if (error.has("message")) {
                        errorCode = error.get("message").getAsString();
                    }
                }
                throw new AuthException(mapFirebaseError(errorCode), errorCode);
            }

            uid = jsonResponse.get("localId").getAsString();
            idToken = jsonResponse.get("idToken").getAsString();

        } catch (IOException e) {
            throw new AuthException("خطأ في الاتصال بالإنترنت. تحقق من اتصالك.", "NETWORK_ERROR");
        }

        // ── Step 2: Fetch role from Firestore ─────────────────────────────
        User user = new User();
        user.setUid(uid);
        user.setEmail(email);
        user.setEmployeeId(employeeId);

        // Apply hardcoded role promotion for test accounts (same as web app)
        if (ROLES_MAP.containsKey(email)) {
            String[] roleInfo = ROLES_MAP.get(email);
            user.setRole(roleInfo[0]);
            user.setDisplayName(roleInfo[1]);
        } else {
            user.setRole("employee"); // default
        }

        // Try fetching from Firestore if admin SDK is available
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db != null) {
            try {
                DocumentSnapshot doc = db.collection("users").document(uid).get().get();
                if (doc.exists()) {
                    String firestoreRole = doc.getString("role");
                    String firestoreName = doc.getString("displayName");
                    if (firestoreRole != null) user.setRole(firestoreRole);
                    if (firestoreName != null) user.setDisplayName(firestoreName);
                    user.setCollegeName(doc.getString("collegeName"));
                    
                    // Check if temp_admin has expired
                    if ("temp_admin".equals(user.getRole())) {
                        String endStr = doc.getString("tempAccessEnd");
                        if (endStr != null) {
                            try {
                                java.time.LocalDateTime end = java.time.LocalDateTime.parse(endStr);
                                if (java.time.LocalDateTime.now().isAfter(end)) {
                                    System.out.println("[Auth] Temp Admin access expired. Reverting to employee.");
                                    user.setRole("employee");
                                    // Update Firestore back to employee
                                    db.collection("users").document(uid).update("role", "employee");
                                } else {
                                    // Not expired, set the dates for local validation
                                    user.setTempAccessStart(doc.getString("tempAccessStart"));
                                    user.setTempAccessEnd(endStr);
                                    
                                    // Fetch allowed features
                                    java.util.List<String> features = (java.util.List<String>) doc.get("allowedFeatures");
                                    if (features != null) {
                                        user.setAllowedFeatures(features);
                                    }
                                }
                            } catch (Exception ex) {
                                ex.printStackTrace();
                            }
                        }
                    }
                }
            } catch (InterruptedException | ExecutionException e) {
                System.err.println("[AuthService] Firestore fetch failed, using default role: " + e.getMessage());
            }
        }

        // ── Step 3: Save session ────────────────────────────────────────────
        SessionManager.getInstance().setCurrentUser(user);
        SessionManager.getInstance().setIdToken(idToken);

        return user;
    }

    /**
     * Registers a new user via Firebase REST API (createUserWithEmailAndPassword)
     * then stores the user data in Firestore "users" collection.
     * Mirrors the register() function in AuthContext.jsx.
     *
     * @param name        Full display name
     * @param employeeId  Employee ID (will become part of the email)
     * @param role        User role (employee, secretary, etc.)
     * @param password    Password
     */
    public static User register(String name, String employeeId, String role, String password)
            throws AuthException {
        String email = formatEmail(employeeId);

        // ── Step 1: Create Firebase Auth user ─────────────────────────────
        String requestBody = gson.toJson(Map.of(
            "email", email,
            "password", password,
            "returnSecureToken", true
        ));

        Request request = new Request.Builder()
            .url(FirebaseService.FIREBASE_SIGNUP_URL)
            .post(RequestBody.create(requestBody, JSON))
            .build();

        String uid;
        String idToken;

        try (Response response = httpClient.newCall(request).execute()) {
            String responseBody = response.body().string();
            JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);

            if (!response.isSuccessful()) {
                String errorCode = "";
                if (jsonResponse.has("error")) {
                    errorCode = jsonResponse.getAsJsonObject("error")
                        .get("message").getAsString();
                }
                throw new AuthException(mapFirebaseError(errorCode), errorCode);
            }

            uid = jsonResponse.get("localId").getAsString();
            idToken = jsonResponse.get("idToken").getAsString();

        } catch (IOException e) {
            throw new AuthException("خطأ في الاتصال بالإنترنت. تحقق من اتصالك.", "NETWORK_ERROR");
        }

        // ── Step 2: Save user data to Firestore ────────────────────────────
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db != null) {
            Map<String, Object> userData = new HashMap<>();
            userData.put("displayName", name);
            userData.put("employeeId", employeeId);
            userData.put("role", role);
            userData.put("email", email);
            userData.put("createdAt", new java.util.Date());

            try {
                db.collection("users").document(uid).set(userData).get();
            } catch (InterruptedException | ExecutionException e) {
                System.err.println("[AuthService] Failed to save user to Firestore: " + e.getMessage());
            }
        }

        // ── Step 3: Save session ────────────────────────────────────────────
        User user = new User(uid, email, name, employeeId, role);
        SessionManager.getInstance().setCurrentUser(user);
        SessionManager.getInstance().setIdToken(idToken);

        return user;
    }

    /**
     * Clears the current session (logout).
     */
    public static void logout() {
        SessionManager.getInstance().clearSession();
    }

    /**
     * Maps Firebase REST API error codes to Arabic user-friendly messages.
     * Mirrors the error handling in LoginScreen.jsx.
     */
    private static String mapFirebaseError(String errorCode) {
        return switch (errorCode) {
            case "EMAIL_NOT_FOUND"       -> "هذا الرقم الوظيفي غير مسجل";
            case "INVALID_PASSWORD"      -> "كلمة المرور غير صحيحة";
            case "USER_DISABLED"         -> "هذا الحساب موقوف. تواصل مع الإدارة";
            case "EMAIL_EXISTS"          -> "هذا الرقم الوظيفي مسجل مسبقاً";
            case "WEAK_PASSWORD : Password should be at least 6 characters" ->
                                           "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
            case "INVALID_EMAIL"         -> "صيغة الرقم الوظيفي غير صحيحة";
            case "TOO_MANY_ATTEMPTS_TRY_LATER" ->
                                           "محاولات كثيرة. حاول مرة أخرى لاحقاً";
            default -> "رقم وظيفي أو كلمة مرور غير صحيحة";
        };
    }

    /**
     * Custom exception for authentication errors.
     */
    public static class AuthException extends Exception {
        private final String errorCode;

        public AuthException(String message, String errorCode) {
            super(message);
            this.errorCode = errorCode;
        }

        public String getErrorCode() { return errorCode; }
    }
}
