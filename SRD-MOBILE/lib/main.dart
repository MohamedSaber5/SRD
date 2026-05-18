import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'core/services/firebase_service.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/student_dashboard.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase using direct explicit options safely
  try {
    await FirebaseService.initialize();
  } catch (e) {
    print('Firebase initialization error: $e');
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return MaterialApp(
            title: 'SRD Mobile',
            debugShowCheckedModeBanner: false,
            
            // RTL Localizations Support
            locale: const Locale('ar', 'EG'),
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('ar', 'EG'),
              Locale('en', 'US'),
            ],

             // Visual Styling Themes
            theme: AppTheme.lightTheme,
            themeMode: ThemeMode.light, // Force Light Mode for official AAST white/blue style

            // Smart Dynamic Routing (Initiate with premium splash screen check)
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}
