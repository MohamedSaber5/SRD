package com.aast.booking;

import com.aast.booking.core.FirebaseService;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.WriteBatch;
import java.util.List;

public class DeleteAllBookingsUtility {
    public static void main(String[] args) {
        try {
            System.out.println("Initializing Firebase...");
            FirebaseService.getInstance().initialize();
            
            if (!FirebaseService.getInstance().hasFirestoreAccess()) {
                System.err.println("Error: Firestore access is not available!");
                System.exit(1);
            }
            
            Firestore db = FirebaseService.getInstance().getFirestore();
            System.out.println("Fetching all documents in 'bookings' collection...");
            
            List<QueryDocumentSnapshot> docs = db.collection("bookings")
                    .get()
                    .get()
                    .getDocuments();
            
            System.out.println("Found " + docs.size() + " booking documents to delete.");
            
            if (docs.isEmpty()) {
                System.out.println("No bookings to delete.");
                System.exit(0);
            }
            
            WriteBatch batch = db.batch();
            int count = 0;
            for (QueryDocumentSnapshot doc : docs) {
                batch.delete(doc.getReference());
                count++;
                
                // Write batches can have up to 500 operations
                if (count == 500) {
                    System.out.println("Commiting batch of 500 deletions...");
                    batch.commit().get();
                    batch = db.batch();
                    count = 0;
                }
            }
            
            if (count > 0) {
                System.out.println("Commiting final batch of " + count + " deletions...");
                batch.commit().get();
            }
            
            System.out.println("All bookings deleted successfully from Firestore!");
            System.exit(0);
            
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
}
