import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

void showCustomError(BuildContext context, String message) {
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: const Color(0xFF1E293B),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          const Icon(LucideIcons.alertCircle, color: Color(0xFFE11D48)),
          const SizedBox(width: 12),
          Text('Error', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
        ],
      ),
      content: Text(
        message,
        style: GoogleFonts.inter(color: const Color(0xFFE2E8F0)),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(),
          child: Text('OK', style: GoogleFonts.inter(color: const Color(0xFF8B5CF6), fontWeight: FontWeight.bold)),
        ),
      ],
    ),
  );
}

void showCustomSuccess(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
    content: Text(message),
    backgroundColor: const Color(0xFF10B981), // emerald-500
  ));
}
