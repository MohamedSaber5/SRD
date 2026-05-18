import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/custom_button.dart';
import '../core/theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _studentIdController = TextEditingController();
  final _passwordController = TextEditingController();
  
  bool _obscurePassword = true;

  @override
  void dispose() {
    _studentIdController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    try {
      await authProvider.login(
        _studentIdController.text.trim(),
        _passwordController.text,
      );
    } catch (e) {
      String errorMessage = 'حدث خطأ أثناء تسجيل الدخول. يرجى التحقق من بياناتك.';
      final errStr = e.toString();
      if (errStr.contains('user-not-found') || errStr.contains('invalid-credential') || errStr.contains('wrong-password')) {
        errorMessage = 'الرقم الدراسي أو كلمة المرور غير صحيحة.';
      } else if (errStr.contains('network-request-failed')) {
        errorMessage = 'يرجى التحقق من اتصالك بالشبكة.';
      }
      
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage, style: const TextStyle(fontFamily: 'Cairo')),
          backgroundColor: AppTheme.dangerColor,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = Provider.of<AuthProvider>(context).isLoading;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // AAST Official Logo
                  Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryColor.withOpacity(0.08),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(4),
                    child: ClipOval(
                      child: Image.asset(
                        'assets/images/logo_aast.jpg',
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return const Icon(
                            Icons.school_outlined,
                            size: 64,
                            color: AppTheme.primaryColor,
                          );
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Brand Titles
                  Text(
                    'الأكاديمية العربية للعلوم والتكنولوجيا',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'نظام جدول المحاضرات للطلاب',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: AppTheme.lightTextSecondary,
                          fontWeight: FontWeight.w500,
                          fontSize: 16,
                        ),
                  ),
                  const SizedBox(height: 40),
                  
                  // Login Card Form
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 20,
                          offset: const Offset(0, 4),
                        ),
                      ],
                      border: Border.all(color: const Color(0xFFF1F5F9), width: 1.5),
                    ),
                    padding: const EdgeInsets.all(28.0),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'تسجيل الدخول',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontSize: 20,
                                  color: AppTheme.primaryColor,
                                ),
                          ),
                          const SizedBox(height: 24),
                          
                          // Student ID input
                          TextFormField(
                            controller: _studentIdController,
                            keyboardType: TextInputType.text,
                            style: const TextStyle(fontSize: 15, color: AppTheme.lightTextPrimary),
                            decoration: InputDecoration(
                              labelText: 'الرقم الدراسي',
                              hintText: 'مثال: 21101234',
                              prefixIcon: const Icon(Icons.badge_outlined, color: AppTheme.secondaryColor),
                              filled: true,
                              fillColor: AppTheme.lightBlueBg,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                              floatingLabelStyle: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(color: AppTheme.primaryColor, width: 2),
                              ),
                              errorBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(color: AppTheme.dangerColor),
                              ),
                              focusedErrorBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(color: AppTheme.dangerColor, width: 2),
                              ),
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'يرجى إدخال الرقم الدراسي الخاص بك';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 18),
                          
                          // Password input
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            style: const TextStyle(fontSize: 15, color: AppTheme.lightTextPrimary),
                            decoration: InputDecoration(
                              labelText: 'كلمة المرور',
                              hintText: '••••••••',
                              prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.secondaryColor),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                  color: Colors.grey,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _obscurePassword = !_obscurePassword;
                                  });
                                },
                              ),
                              filled: true,
                              fillColor: AppTheme.lightBlueBg,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                              floatingLabelStyle: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(color: AppTheme.primaryColor, width: 2),
                              ),
                              errorBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(color: AppTheme.dangerColor),
                              ),
                              focusedErrorBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(color: AppTheme.dangerColor, width: 2),
                              ),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'يرجى إدخال كلمة المرور';
                              }
                              if (value.length < 6) {
                                return 'كلمة المرور يجب أن لا تقل عن 6 أحرف';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 30),
                          
                          // Submit Button
                          CustomButton(
                            text: 'دخول البوابة',
                            isLoading: isLoading,
                            onPressed: _submit,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Bottom Footer Notice
                  const Text(
                    'تم التطوير للأكاديمية العربية للعلوم والتكنولوجيا',
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: 11,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
