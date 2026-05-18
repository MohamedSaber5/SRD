import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../core/services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  User? _currentUser;
  Map<String, dynamic>? _userData;
  bool _isLoading = true;

  // Active Class Profile for Schedule (Default values matched to imported Excel samples)
  String _selectedCollege = 'حاسبات ومعلومات';
  String _selectedDepartment = 'هندسة البرمجيات';
  String _selectedGroup = 'F';

  // Live Weekly Lecture Schedule list
  List<Map<String, dynamic>> _scheduleBookings = [];

  // Stream Subscriptions
  StreamSubscription<User?>? _authSubscription;
  StreamSubscription<QuerySnapshot>? _scheduleSubscription;

  // Getters
  User? get currentUser => _currentUser;
  Map<String, dynamic>? get userData => _userData;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _currentUser != null;
  
  String get selectedCollege => _selectedCollege;
  String get selectedDepartment => _selectedDepartment;
  String get selectedGroup => _selectedGroup;
  List<Map<String, dynamic>> get scheduleBookings => _scheduleBookings;

  AuthProvider() {
    _initAuthListener();
  }

  void _initAuthListener() {
    _isLoading = true;
    notifyListeners();

    _authSubscription = _authService.userStateStream.listen((User? user) async {
      _currentUser = user;
      if (user != null) {
        // Fetch Firestore Profile
        _userData = await _authService.getUserData(user.uid);
        
        // Initialize Class selection from Firestore profile if they exist
        if (_userData != null) {
          _selectedCollege = _userData!['collegeName'] ?? _userData!['college'] ?? 'حاسبات ومعلومات';
          _selectedDepartment = _userData!['department'] ?? 'هندسة البرمجيات';
          _selectedGroup = _userData!['group'] ?? 'F';
        }
        
        // Start real-time Schedule sync
        _startScheduleSync();
      } else {
        _userData = null;
        _scheduleBookings = [];
        _cancelScheduleSync();
      }
      _isLoading = false;
      notifyListeners();
    });
  }

  void _startScheduleSync() {
    _cancelScheduleSync();

    // Query weekly lectures for the selected class profile
    _scheduleSubscription = _firestore
        .collection('bookings')
        .where('source', isEqualTo: 'weekly_lecture')
        .where('college', isEqualTo: _selectedCollege)
        .where('department', isEqualTo: _selectedDepartment)
        .where('group', isEqualTo: _selectedGroup)
        .snapshots()
        .listen((snapshot) {
      _scheduleBookings = snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id; // inject document ID
        return data;
      }).toList();
      notifyListeners();
    });
  }

  void _cancelScheduleSync() {
    _scheduleSubscription?.cancel();
  }

  // Update Class Selection & sync new schedule
  Future<void> updateClassSelection({
    required String college,
    required String department,
    required String group,
  }) async {
    _selectedCollege = college;
    _selectedDepartment = department;
    _selectedGroup = group;
    notifyListeners();

    // Start fresh sync
    _startScheduleSync();

    // Persist to user profile if user is logged in
    if (_currentUser != null) {
      try {
        await _firestore.collection('users').doc(_currentUser!.uid).update({
          'collegeName': college,
          'department': department,
          'group': group,
        });
      } catch (e) {
        print('Error updating user class profile in Firestore: $e');
        // Try creating/setting instead if updating fails (e.g. document does not exist)
        try {
          await _firestore.collection('users').doc(_currentUser!.uid).set({
            'displayName': _userData?['displayName'] ?? _currentUser!.displayName ?? 'طالب',
            'studentId': _userData?['studentId'] ?? _currentUser!.email?.split('@').first ?? '',
            'role': 'student',
            'email': _currentUser!.email,
            'collegeName': college,
            'department': department,
            'group': group,
          }, SetOptions(merge: true));
        } catch (err) {
          print('Setting merge document failed: $err');
        }
      }
    }
  }

  // Login action
  Future<void> login(String loginIdOrEmail, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _authService.login(loginIdOrEmail, password);
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Logout action
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    await _authService.logout();
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    _cancelScheduleSync();
    super.dispose();
  }
}
