import 'package:flutter/material.dart';

extension AppTheme on BuildContext {
  bool get isDark => Theme.of(this).brightness == Brightness.dark;

  Color get bgPrimary => isDark ? const Color(0xFF020617) : const Color(0xFFF8FAFC);
  Color get bgSecondary => isDark ? const Color(0xFF0F172A) : Colors.white;
  Color get bgTertiary => isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9);
  
  Color get border => isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0);
  Color get borderHighlight => isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1);

  Color get textPrimary => isDark ? Colors.white : const Color(0xFF0F172A);
  Color get textSecondary => isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
  Color get textMuted => isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8);

  Color get primary => const Color(0xFF8B5CF6);
  Color get primaryLight => isDark ? const Color(0xFF8B5CF6).withOpacity(0.2) : const Color(0xFF8B5CF6).withOpacity(0.1);
  
  Color get accent => const Color(0xFFF59E0B);
  Color get accentLight => isDark ? const Color(0xFFF59E0B).withOpacity(0.2) : const Color(0xFFF59E0B).withOpacity(0.1);
  
  Color get success => const Color(0xFF10B981);
  Color get successLight => isDark ? const Color(0xFF10B981).withOpacity(0.2) : const Color(0xFF10B981).withOpacity(0.1);
  
  Color get error => const Color(0xFFE11D48);
  Color get errorLight => isDark ? const Color(0xFFE11D48).withOpacity(0.2) : const Color(0xFFE11D48).withOpacity(0.1);
}
