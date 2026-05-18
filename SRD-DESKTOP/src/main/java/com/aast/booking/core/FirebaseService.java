package com.aast.booking.core;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * DESIGN PATTERN: Singleton
 *
 * Problem Solved: Prevents multiple Firebase connections from being created,
 *                 which would waste resources and cause authentication errors.
 *
 * Manages the single Firebase connection for the entire application.
 * Uses Firebase Admin SDK to connect to the same Firestore database as the web app.
 *
 * Firebase Project: srd-system
 */
public class FirebaseService {

    private static FirebaseService instance;
    private Firestore firestore;
    private boolean initialized = false;

    // Same Firebase project as web app
    private static final String PROJECT_ID = "aast-booking-system";
    // Firebase REST Auth endpoint (used for signInWithEmailAndPassword)
    public static final String FIREBASE_AUTH_URL =
        "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyAolYvwI1kPyNuaguc4xxYCuStRfw8aLuA";
    public static final String FIREBASE_SIGNUP_URL =
        "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyAolYvwI1kPyNuaguc4xxYCuStRfw8aLuA";

    private FirebaseService() {}

    /**
     * Returns the single instance of FirebaseService.
     * Thread-safe with double-checked locking.
     */
    public static FirebaseService getInstance() {
        if (instance == null) {
            synchronized (FirebaseService.class) {
                if (instance == null) {
                    instance = new FirebaseService();
                }
            }
        }   
        return instance;
    }

    /**
     * Initializes Firebase Admin SDK with service account credentials.
     * Must be called once at application startup.
     *
     * To generate service-account.json:
     *   Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
     */
    public void initialize() {
        if (initialized) return;

        try {
            InputStream serviceAccount = getClass()
                .getResourceAsStream("/service-account.json");

            if (serviceAccount == null) {
                System.out.println("[FirebaseService] WARNING: service-account.json not found.");
                System.out.println("[FirebaseService] Firestore admin access disabled.");
                System.out.println("[FirebaseService] Login/Register via REST API will still work.");
                initialized = true;
                return;
            }

            // Initialize Firebase App for Auth
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .setProjectId(PROJECT_ID)
                .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }

            // Initialize Firestore directly with specific databaseId "default"
            // Re-read the input stream for credentials as it was consumed
            InputStream serviceAccountForFirestore = getClass()
                .getResourceAsStream("/service-account.json");
                
            com.google.cloud.firestore.FirestoreOptions firestoreOptions = com.google.cloud.firestore.FirestoreOptions.newBuilder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccountForFirestore))
                .setProjectId(PROJECT_ID)
                .build();
            firestore = firestoreOptions.getService();
            initialized = true;
            System.out.println("[FirebaseService] Firebase and Firestore initialized successfully.");

        } catch (IOException e) {
            System.err.println("[FirebaseService] Initialization failed: " + e.getMessage());
            initialized = true; // Mark as attempted so we don't retry
        }
    }

    public Firestore getFirestore() {
        return firestore;
    }

    public boolean isInitialized() {
        return initialized;
    }

    public boolean hasFirestoreAccess() {
        return firestore != null;
    }
}
