import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../providers/profile_provider.dart';
import 'profile_utils.dart';

class EditProfileSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic> initialData;

  const EditProfileSheet({super.key, required this.initialData});

  @override
  ConsumerState<EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends ConsumerState<EditProfileSheet> {
  late TextEditingController _nameController;
  late TextEditingController _bioController;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialData['full_name'] ?? '');
    _bioController = TextEditingController(text: widget.initialData['bio'] ?? '');
  }

  void _submit() {
    setState(() => _isSubmitting = true);
    final data = {
      'full_name': _nameController.text.trim(),
      'bio': _bioController.text.trim(),
      'language': widget.initialData['language'] ?? 'en',
    };

    ref.read(profileProvider.notifier).updateBasicProfile(
      data,
      onSuccess: (msg) {
        if (mounted) {
          Navigator.of(context).pop();
          showCustomSuccess(context, msg);
        }
      },
      onError: (err) {
        if (mounted) {
          setState(() => _isSubmitting = false);
          showCustomError(context, err);
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      decoration: BoxDecoration(color: context.bgSecondary, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      padding: EdgeInsets.fromLTRB(20, 24, 20, bottomInset + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Edit Profile', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: context.textPrimary)),
              IconButton(icon: Icon(LucideIcons.x, color: context.textSecondary), onPressed: () => Navigator.of(context).pop())
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _nameController,
            style: GoogleFonts.inter(color: context.textPrimary),
            decoration: InputDecoration(
              labelText: 'Full Name',
              labelStyle: GoogleFonts.inter(color: context.textSecondary),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.border)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.primary)),
              filled: true,
              fillColor: context.bgPrimary,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _bioController,
            maxLines: 3,
            style: GoogleFonts.inter(color: context.textPrimary),
            decoration: InputDecoration(
              labelText: 'Bio',
              labelStyle: GoogleFonts.inter(color: context.textSecondary),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.border)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.primary)),
              filled: true,
              fillColor: context.bgPrimary,
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: context.primary,
                foregroundColor: context.textPrimary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isSubmitting ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: context.textPrimary)) : Text('Save Changes', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
