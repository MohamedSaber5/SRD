import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  
  factory FirebaseService() {
    return _instance;
  }

  FirebaseService._internal();

  FirebaseFirestore get firestore => FirebaseFirestore.instance;

  static Future<void> initialize() async {
    // Injecting explicit configuration directly in code allows immediate connection 
    // without requiring deep integration of google-services.json in the beginning.
    await Firebase.initializeApp(
      options: const FirebaseOptions(
        apiKey: "AIzaSyAolYvwI1kPyNuaguc4xxYCuStRfw8aLuA",
        authDomain: "aast-booking-system.firebaseapp.com",
        projectId: "aast-booking-system",
        storageBucket: "aast-booking-system.firebasestorage.app",
        messagingSenderId: "724657515386",
        appId: "1:724657515386:android:ed6ebc9f36df4b661884c3", // Customized for android
      ),
    );
  }
}
