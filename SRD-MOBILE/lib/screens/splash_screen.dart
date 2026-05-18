import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../core/theme/app_theme.dart';
import 'login_screen.dart';
import 'student_dashboard.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _progressAnimation;
  bool _navigationTriggered = false;

  @override
  void initState() {
    super.initState();
    
    // Create custom smooth animation over 3.2 seconds
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3200),
    );

    _progressAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOutCubic),
    );

    // Recheck state on animation tick to trigger transitions seamlessly
    _animationController.addListener(() {
      if (_animationController.isCompleted) {
        _checkAndNavigate();
      }
    });

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _checkAndNavigate() {
    if (_navigationTriggered) return;
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    // If Auth is still busy resolving, wait and try again shortly
    if (authProvider.isLoading) {
      Future.delayed(const Duration(milliseconds: 200), _checkAndNavigate);
      return;
    }

    _navigationTriggered = true;

    // Direct transition inside MaterialApp using elegant custom PageRouteBuilder Fade transition
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => 
            authProvider.isAuthenticated ? const StudentDashboard() : const LoginScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: animation,
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 600),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // 1. Deep Premium Dark Gradient Background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF0F172A), // Slate 900
                  Color(0xFF070A13), // Ultra-deep Slate 950/Navy hybrid
                ],
              ),
            ),
          ),
          
          // Subtle circular background glow highlights
          Positioned(
            top: -100,
            left: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryColor.withOpacity(0.08),
                    blurRadius: 100,
                    spreadRadius: 30,
                  ),
                ],
              ),
            ),
          ),
          
          Positioned(
            bottom: -50,
            right: -50,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.secondaryColor.withOpacity(0.06),
                    blurRadius: 80,
                    spreadRadius: 20,
                  ),
                ],
              ),
            ),
          ),

          // 2. Main Centered Branding logo and details
          AnimatedBuilder(
            animation: _progressAnimation,
            builder: (context, child) {
              final opacity = _progressAnimation.value.clamp(0.0, 1.0);
              return Opacity(
                opacity: opacity,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Academy Big Logo styled beautifully
                      Container(
                        width: 170,
                        height: 170,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.5),
                              blurRadius: 24,
                              offset: const Offset(0, 12),
                            ),
                            BoxShadow(
                              color: AppTheme.primaryColor.withOpacity(0.25),
                              blurRadius: 35,
                              spreadRadius: 4,
                            ),
                          ],
                          border: Border.all(
                            color: Colors.white.withOpacity(0.12),
                            width: 2.5,
                          ),
                        ),
                        child: ClipOval(
                          child: Image.asset(
                            'assets/images/logo_aast.jpg',
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      // Arabic Brand Name
                      Text(
                        'الأكاديمية العربية للعلوم والتكنولوجيا\nوالنقل البحري',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.cairo(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          height: 1.4,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 10),
                      
                      // English subtitle
                      Text(
                        'AASTMT STUDENT PORTAL',
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.lightBlueAccent,
                          letterSpacing: 2.0,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

          // 3. Premium Animated Loading Track Section (from 0 to 100%) at the bottom
          Positioned(
            bottom: 70,
            left: 0,
            right: 0,
            child: AnimatedBuilder(
              animation: _progressAnimation,
              builder: (context, child) {
                final value = _progressAnimation.value;
                final percentage = (value * 100).toInt();

                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Dynamic Percentage Label Counter
                    Text(
                      '$percentage%',
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: Colors.white.withOpacity(0.95),
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Modern Premium Black Loading Bar
                    Container(
                      width: double.infinity,
                      height: 8,
                      margin: const EdgeInsets.symmetric(horizontal: 48),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.03),
                          width: 1,
                        ),
                      ),
                      child: Stack(
                        children: [
                          FractionallySizedBox(
                            alignment: Alignment.centerLeft,
                            widthFactor: value,
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.black, // Sleek black solid loading bar
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.6),
                                    blurRadius: 6,
                                    spreadRadius: 1,
                                  ),
                                  BoxShadow(
                                    color: Colors.white.withOpacity(0.15),
                                    blurRadius: 4,
                                    offset: const Offset(0, -1),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    
                    // Arabic tiny footer hint
                    Text(
                      'جاري تحميل البيانات والجدول اليومي...',
                      style: GoogleFonts.cairo(
                        fontSize: 10.5,
                        color: Colors.white.withOpacity(0.4),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
