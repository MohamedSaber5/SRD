import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Smart email formatting helper
  // If input is purely numeric (e.g., student ID 21101234), formats as ID@student.aast.edu
  // Otherwise, if it's already an email, returns it directly.
  String formatEmail(String input) {
    input = input.trim();
    if (RegExp(r'^\d+$').hasMatch(input)) {
      return '$input@student.aast.edu';
    }
    return input;
  }

  // Get current user stream
  Stream<User?> get userStateStream => _auth.authStateChanges();

  // Get user data from Firestore
  Future<Map<String, dynamic>?> getUserData(String uid) async {
    try {
      final docSnap = await _firestore.collection('users').doc(uid).get();
      if (docSnap.exists) {
        return docSnap.data();
      }
    } catch (e) {
      print('Error fetching user data: $e');
    }
    return null;
  }

  // Login
  Future<UserCredential> login(String loginIdOrEmail, String password) async {
    final email = formatEmail(loginIdOrEmail);
    return await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  // Register Student Account
  Future<User> registerStudent({
    required String name,
    required String studentId,
    required String collegeName,
    required String password,
  }) async {
    final email = formatEmail(studentId);
    final userCredential = await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
    
    final user = userCredential.user!;

    // Create user profile in firestore
    final userData = {
      'displayName': name,
      'studentId': studentId,
      'role': 'student',
      'collegeName': collegeName,
      'email': email,
      'createdAt': FieldValue.serverTimestamp(),
    };

    await _firestore.collection('users').doc(user.uid).set(userData);
    return user;
  }

  // Logout
  Future<void> logout() async {
    await _auth.signOut();
  }
}
