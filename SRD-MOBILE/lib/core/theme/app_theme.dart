import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors (Official Arab Academy White & Blue Theme)
  static const Color primaryColor = Color(0xFF004687); // Deep Royal Blue
  static const Color secondaryColor = Color(0xFF008BA3); // AAST Teal / Ocean Blue
  static const Color lightBlueAccent = Color(0xFFE0F2FE); // Very light sky blue for cards & grid highlights
  static const Color lightBlueBg = Color(0xFFF0F9FF); // Extremely light blue background tint
  static const Color dangerColor = Color(0xFFEF4444); // Red for error states
  
  // Light Theme Colors
  static const Color lightBg = Color(0xFFF8FAFC);
  static const Color lightSurface = Colors.white;
  static const Color lightTextPrimary = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF475569);

  // Dark Theme Colors (maintained for system compatibility with light blue details)
  static const Color darkBg = Color(0xFF0F172A);
  static const Color darkSurface = Color(0xFF1E293B);
  static const Color darkTextPrimary = Color(0xFFF8FAFC);
  static const Color darkTextSecondary = Color(0xFF94A3B8);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: lightBg,
      cardTheme: CardThemeData(
        color: lightSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
        ),
      ),
      textTheme: GoogleFonts.cairoTextTheme().copyWith(
        titleLarge: GoogleFonts.cairo(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: lightTextPrimary,
        ),
        titleMedium: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: lightTextPrimary,
        ),
        bodyLarge: GoogleFonts.cairo(
          fontSize: 16,
          color: lightTextPrimary,
        ),
        bodyMedium: GoogleFonts.cairo(
          fontSize: 14,
          color: lightTextSecondary,
        ),
      ),
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        secondary: secondaryColor,
        tertiary: lightBlueAccent,
        error: dangerColor,
        background: lightBg,
        surface: lightSurface,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: darkBg,
      cardTheme: CardThemeData(
        color: darkSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFF334155), width: 1),
        ),
      ),
      textTheme: GoogleFonts.cairoTextTheme(ThemeData.dark().textTheme).copyWith(
        titleLarge: GoogleFonts.cairo(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: darkTextPrimary,
        ),
        titleMedium: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: darkTextPrimary,
        ),
        bodyLarge: GoogleFonts.cairo(
          fontSize: 16,
          color: darkTextPrimary,
        ),
        bodyMedium: GoogleFonts.cairo(
          fontSize: 14,
          color: darkTextSecondary,
        ),
      ),
      colorScheme: const ColorScheme.dark(
        primary: primaryColor,
        secondary: secondaryColor,
        tertiary: lightBlueAccent,
        error: dangerColor,
        background: darkBg,
        surface: darkSurface,
      ),
    );
  }
}
