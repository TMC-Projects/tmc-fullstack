import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../utils/blur_extension.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _bioController = TextEditingController();

  bool _showPassword = false;
  bool _showConfirmPassword = false;
  String? _successMessage;

  @override
  void dispose() {
    _usernameController.dispose();
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  void _handleRegister() async {
    FocusScope.of(context).unfocus();

    if (!(_formKey.currentState?.validate() ?? false)) return;

    if (_passwordController.text != _confirmPasswordController.text) {
      ref.read(authProvider.notifier);
      // Show mismatch error manually
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Passwords do not match.',
              style: GoogleFonts.inter(color: Colors.white)),
          backgroundColor: context.error,
        ),
      );
      return;
    }

    try {
      await ref.read(authProvider.notifier).register(
            username: _usernameController.text.trim(),
            email: _emailController.text.trim(),
            password: _passwordController.text,
            fullName: _fullNameController.text.trim(),
            language: 'en',
            category: 'player',
            bio: _bioController.text.trim(),
          );

      setState(() {
        _successMessage = 'Account created! Please sign in.';
      });

      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const LoginScreen()),
          );
        }
      });
    } catch (_) {
      setState(() {
        _successMessage = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: context.bgPrimary,
      body: Stack(
        children: [
          // Background Glow Violet
          Positioned(
            top: -100,
            left: -50,
            child: Container(
              width: 320,
              height: 320,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0x1A7C3AED),
              ),
            ).blurred(120),
          ),
          // Background Glow Cyan
          Positioned(
            bottom: -100,
            right: -50,
            child: Container(
              width: 320,
              height: 320,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0x1A0891B2),
              ),
            ).blurred(120),
          ),

          // Main Content
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    // Header
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0x1A8B5CF6),
                        border:
                            Border.all(color: const Color(0x338B5CF6)),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(
                        LucideIcons.userPlus,
                        color: Color(0xFFA78BFA),
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [
                          Color(0xFFA78BFA),
                          Color(0xFFC7D2FE),
                          Color(0xFF22D3EE)
                        ],
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                      ).createShader(bounds),
                      child: Text(
                        'Create Account',
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
                      'Join NJARA and build your player portfolio',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: context.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Glassmorphism Card
                    ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: BackdropFilter(
                        filter:
                            ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                        child: Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: const Color(0x990F172A),
                            border: Border.all(
                                color: const Color(0xCC1E293B)),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              // Error Banner
                              if (authState.error != null)
                                _InfoBanner(
                                  message: authState.error!,
                                  isError: true,
                                ),

                              // Success Banner
                              if (_successMessage != null)
                                _InfoBanner(
                                  message: _successMessage!,
                                  isError: false,
                                ),

                              // Username
                              _FieldLabel('Username'),
                              const SizedBox(height: 8),
                              _FormField(
                                controller: _usernameController,
                                hintText: 'yourhandle',
                                icon: LucideIcons.atSign,
                                validator: (v) => (v == null || v.isEmpty)
                                    ? 'Username is required'
                                    : null,
                              ),
                              const SizedBox(height: 20),

                              // Full Name
                              _FieldLabel('Full Name'),
                              const SizedBox(height: 8),
                              _FormField(
                                controller: _fullNameController,
                                hintText: 'Your full name',
                                icon: LucideIcons.user,
                                validator: (v) => (v == null || v.isEmpty)
                                    ? 'Full name is required'
                                    : null,
                              ),
                              const SizedBox(height: 20),

                              // Email
                              _FieldLabel('Email Address'),
                              const SizedBox(height: 8),
                              _FormField(
                                controller: _emailController,
                                hintText: 'player@example.com',
                                icon: LucideIcons.mail,
                                keyboardType: TextInputType.emailAddress,
                                validator: (v) {
                                  if (v == null || v.isEmpty) {
                                    return 'Email is required';
                                  }
                                  if (!v.contains('@')) {
                                    return 'Enter a valid email';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 20),

                              // Password
                              _FieldLabel('Password'),
                              const SizedBox(height: 8),
                              _PasswordFormField(
                                controller: _passwordController,
                                hintText: '••••••••',
                                showPassword: _showPassword,
                                onToggle: () => setState(
                                    () => _showPassword = !_showPassword),
                                validator: (v) {
                                  if (v == null || v.isEmpty) {
                                    return 'Password is required';
                                  }
                                  if (v.length < 6) {
                                    return 'Minimum 6 characters';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 20),

                              // Confirm Password
                              _FieldLabel('Confirm Password'),
                              const SizedBox(height: 8),
                              _PasswordFormField(
                                controller: _confirmPasswordController,
                                hintText: '••••••••',
                                showPassword: _showConfirmPassword,
                                onToggle: () => setState(() =>
                                    _showConfirmPassword =
                                        !_showConfirmPassword),
                                validator: (v) {
                                  if (v == null || v.isEmpty) {
                                    return 'Please confirm your password';
                                  }
                                  if (v != _passwordController.text) {
                                    return 'Passwords do not match';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 20),

                              // Bio (optional)
                              _FieldLabel('Bio (optional)'),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: _bioController,
                                maxLines: 3,
                                style: GoogleFonts.inter(
                                    color: context.textPrimary),
                                decoration: InputDecoration(
                                  hintText:
                                      'Tell us about yourself...',
                                  hintStyle: GoogleFonts.inter(
                                      color: context.textMuted),
                                  filled: true,
                                  fillColor: context.bgPrimary,
                                  contentPadding:
                                      const EdgeInsets.all(16),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius:
                                        BorderRadius.circular(16),
                                    borderSide: BorderSide(
                                        color: context.border),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius:
                                        BorderRadius.circular(16),
                                    borderSide: BorderSide(
                                        color: context.primary),
                                  ),
                                  errorBorder: OutlineInputBorder(
                                    borderRadius:
                                        BorderRadius.circular(16),
                                    borderSide: BorderSide(
                                        color: context.error),
                                  ),
                                  focusedErrorBorder:
                                      OutlineInputBorder(
                                    borderRadius:
                                        BorderRadius.circular(16),
                                    borderSide: BorderSide(
                                        color: context.error),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 28),

                              // Register Button
                              SizedBox(
                                width: double.infinity,
                                height: 56,
                                child: ElevatedButton(
                                  onPressed: authState.isLoading
                                      ? null
                                      : _handleRegister,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: context.primary,
                                    foregroundColor:
                                        context.textPrimary,
                                    shape: RoundedRectangleBorder(
                                      borderRadius:
                                          BorderRadius.circular(16),
                                    ),
                                    elevation: 0,
                                  ),
                                  child: authState.isLoading
                                      ? SizedBox(
                                          width: 24,
                                          height: 24,
                                          child:
                                              CircularProgressIndicator(
                                            strokeWidth: 2,
                                            valueColor:
                                                AlwaysStoppedAnimation<
                                                    Color>(
                                              context.textPrimary,
                                            ),
                                          ),
                                        )
                                      : Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              'Create Account',
                                              style: GoogleFonts.inter(
                                                fontSize: 16,
                                                fontWeight:
                                                    FontWeight.w600,
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            const Icon(
                                                LucideIcons.arrowRight,
                                                size: 18),
                                          ],
                                        ),
                                ),
                              ),
                              const SizedBox(height: 20),

                              // Link to Login
                              Center(
                                child: GestureDetector(
                                  onTap: () {
                                    Navigator.pushReplacement(
                                      context,
                                      MaterialPageRoute(
                                          builder: (_) =>
                                              const LoginScreen()),
                                    );
                                  },
                                  child: RichText(
                                    text: TextSpan(
                                      text: 'Already have an account? ',
                                      style: GoogleFonts.inter(
                                        color: context.textSecondary,
                                        fontSize: 14,
                                      ),
                                      children: [
                                        TextSpan(
                                          text: 'Sign In',
                                          style: GoogleFonts.inter(
                                            color: context.primary,
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14,
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
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Helper Widgets ──────────────────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: context.textPrimary,
      ),
    );
  }
}

class _FormField extends StatelessWidget {
  final TextEditingController controller;
  final String hintText;
  final IconData icon;
  final TextInputType keyboardType;
  final String? Function(String?)? validator;

  const _FormField({
    required this.controller,
    required this.hintText,
    required this.icon,
    this.keyboardType = TextInputType.text,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      style: GoogleFonts.inter(color: context.textPrimary),
      keyboardType: keyboardType,
      validator: validator,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: GoogleFonts.inter(color: context.textMuted),
        prefixIcon: Icon(icon, color: context.textMuted, size: 18),
        filled: true,
        fillColor: context.bgPrimary,
        contentPadding: const EdgeInsets.symmetric(vertical: 16),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: context.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: context.primary),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: context.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: context.error),
        ),
      ),
    );
  }
}

class _PasswordFormField extends StatelessWidget {
  final TextEditingController controller;
  final String hintText;
  final bool showPassword;
  final VoidCallback onToggle;
  final String? Function(String?)? validator;

  const _PasswordFormField({
    required this.controller,
    required this.hintText,
    required this.showPassword,
    required this.onToggle,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      obscureText: !showPassword,
      style: GoogleFonts.inter(color: context.textPrimary),
      validator: validator,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: GoogleFonts.inter(color: context.textMuted),
        prefixIcon: Icon(LucideIcons.lock, color: context.textMuted, size: 18),
        suffixIcon: IconButton(
          icon: Icon(
            showPassword ? LucideIcons.eyeOff : LucideIcons.eye,
            color: context.textMuted,
            size: 18,
          ),
          onPressed: onToggle,
        ),
        filled: true,
        fillColor: context.bgPrimary,
        contentPadding: const EdgeInsets.symmetric(vertical: 16),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: context.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: context.primary),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: context.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: context.error),
        ),
      ),
    );
  }
}

class _InfoBanner extends StatelessWidget {
  final String message;
  final bool isError;

  const _InfoBanner({required this.message, required this.isError});

  @override
  Widget build(BuildContext context) {
    final color = isError ? context.error : context.success;
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        border: Border.all(color: color.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(
            isError ? LucideIcons.circleX : LucideIcons.circleCheck,
            color: color,
            size: 16,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.inter(color: color, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
