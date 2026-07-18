import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../providers/profile_provider.dart';
import 'profile_utils.dart';

class HighlightSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic>? initialData;
  const HighlightSheet({super.key, this.initialData});
  @override
  ConsumerState<HighlightSheet> createState() => _HighlightSheetState();
}

class _HighlightSheetState extends ConsumerState<HighlightSheet> {
  late TextEditingController _titleController;
  late TextEditingController _urlController;
  late TextEditingController _descController;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.initialData?['Title'] ?? '');
    _urlController = TextEditingController(text: widget.initialData?['VideoURL'] ?? '');
    _descController = TextEditingController(text: widget.initialData?['Description'] ?? '');
  }

  void _submit() {
    setState(() => _isSubmitting = true);
    ref.read(profileProvider.notifier).saveItem(
      'highlights',
      {
        'title': _titleController.text,
        'video_url': _urlController.text,
        'description': _descController.text,
      },
      widget.initialData?['ID'],
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

  Widget _buildField(String label, TextEditingController controller, {int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        style: GoogleFonts.inter(color: Colors.white),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF1E293B))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF8B5CF6))),
          filled: true,
          fillColor: const Color(0xFF020617),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      decoration: const BoxDecoration(color: Color(0xFF0F172A), borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      padding: EdgeInsets.fromLTRB(20, 24, 20, bottomInset + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(widget.initialData == null ? 'Add Highlight' : 'Edit Highlight', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
              IconButton(icon: const Icon(LucideIcons.x, color: Color(0xFF94A3B8)), onPressed: () => Navigator.of(context).pop())
            ],
          ),
          const SizedBox(height: 16),
          _buildField('Title (e.g. Best Goals 2023)', _titleController),
          _buildField('Video URL (YouTube/Vimeo)', _urlController),
          _buildField('Description (Optional)', _descController, maxLines: 2),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF8B5CF6),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isSubmitting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Text('Save', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
