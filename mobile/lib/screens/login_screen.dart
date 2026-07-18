import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../utils/blur_extension.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../providers/auth_provider.dart';
import 'main_layout.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _showPassword = false;
  String? _successMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    FocusScope.of(context).unfocus();
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) return;

    try {
      await ref.read(authProvider.notifier).login(email, password);
      setState(() {
        _successMessage = 'Login successful! Redirecting...';
      });
      // Delay then navigate to MainLayout
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const MainLayout()),
          );
        }
      });
    } catch (_) {
      // Error is handled by provider and shown via ref.watch
      setState(() {
        _successMessage = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: context.bgPrimary, // slate-950
      body: Stack(
        children: [
          // Background Glow Violet
          Positioned(
            top: -100,
            left: -50,
            child: Container(
              width: 300,
              height: 300,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0x1A7C3AED), // violet-600/10
              ),
            ).blurred(120),
          ),
          // Background Glow Cyan
          Positioned(
            bottom: -100,
            right: -50,
            child: Container(
              width: 300,
              height: 300,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0x1A0891B2), // cyan-600/10
              ),
            ).blurred(120),
          ),

          // Main Content
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo / Header
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0x1A8B5CF6), // violet-500/10
                      border: Border.all(color: const Color(0x338B5CF6)), // violet-500/20
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                      LucideIcons.gamepad2,
                      color: Color(0xFFA78BFA), // violet-400
                      size: 32,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      colors: [Color(0xFFA78BFA), Color(0xFFC7D2FE), Color(0xFF22D3EE)],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ).createShader(bounds),
                    child: Text(
                      'Welcome back',
                      style: GoogleFonts.inter(
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        color: context.textPrimary,
                        letterSpacing: -1.0,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Sign in to access your player portfolio',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: context.textSecondary, // slate-400
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Glassmorphism Card
                  ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: const Color(0x990F172A), // slate-900/60
                          border: Border.all(color: const Color(0xCC1E293B)), // slate-800/80
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Column(
                          children: [
                            // Error Message
                            if (authState.error != null)
                              Container(
                                margin: const EdgeInsets.only(bottom: 20),
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: const Color(0x1AF43F5E), // rose-500/10
                                  border: Border.all(color: const Color(0x33F43F5E)), // rose-500/20
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        authState.error!,
                                        style: GoogleFonts.inter(
                                          color: context.error, // rose-400
                                          fontSize: 14,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            
                            // Success Message
                            if (_successMessage != null)
                              Container(
                                margin: const EdgeInsets.only(bottom: 20),
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: const Color(0x1A10B981), // emerald-500/10
                                  border: Border.all(color: const Color(0x3310B981)), // emerald-500/20
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        _successMessage!,
                                        style: GoogleFonts.inter(
                                          color: context.success, // emerald-400
                                          fontSize: 14,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                            // Email Input
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Email Address',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: context.textPrimary, // slate-200
                                  ),
                                ),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: _emailController,
                                  style: GoogleFonts.inter(color: context.textPrimary),
                                  keyboardType: TextInputType.emailAddress,
                                  decoration: InputDecoration(
                                    hintText: 'player@example.com',
                                    hintStyle: GoogleFonts.inter(color: context.textMuted),
                                    prefixIcon: Icon(LucideIcons.mail, color: context.textMuted, size: 18),
                                    filled: true,
                                    fillColor: context.bgPrimary, // slate-950
                                    contentPadding: const EdgeInsets.symmetric(vertical: 16),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: BorderSide(color: context.border), // slate-800
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: BorderSide(color: context.primary), // violet-500
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // Password Input
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Password',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: context.textPrimary, // slate-200
                                  ),
                                ),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: _passwordController,
                                  obscureText: !_showPassword,
                                  style: GoogleFonts.inter(color: context.textPrimary),
                                  decoration: InputDecoration(
                                    hintText: '••••••••',
                                    hintStyle: GoogleFonts.inter(color: context.textMuted),
                                    prefixIcon: Icon(LucideIcons.lock, color: context.textMuted, size: 18),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _showPassword ? LucideIcons.eyeOff : LucideIcons.eye,
                                        color: context.textMuted,
                                        size: 18,
                                      ),
                                      onPressed: () {
                                        setState(() {
                                          _showPassword = !_showPassword;
                                        });
                                      },
                                    ),
                                    filled: true,
                                    fillColor: context.bgPrimary, // slate-950
                                    contentPadding: const EdgeInsets.symmetric(vertical: 16),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: BorderSide(color: context.border), // slate-800
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: BorderSide(color: context.primary), // violet-500
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 24),

                            // Sign In Button
                            SizedBox(
                              width: double.infinity,
                              height: 56,
                              child: ElevatedButton(
                                onPressed: authState.isLoading ? null : _handleLogin,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: context.primary, // violet-500
                                  foregroundColor: context.textPrimary,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  elevation: 0,
                                ),
                                child: authState.isLoading
                                    ? SizedBox(
                                        width: 24,
                                        height: 24,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor: AlwaysStoppedAnimation<Color>(context.textPrimary),
                                        ),
                                      )
                                    : Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            'Sign In',
                                            style: GoogleFonts.inter(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          const Icon(LucideIcons.arrowRight, size: 18),
                                        ],
                                      ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
