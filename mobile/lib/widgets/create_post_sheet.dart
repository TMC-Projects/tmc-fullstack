import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../providers/feed_provider.dart';

class CreatePostSheet extends ConsumerStatefulWidget {
  const CreatePostSheet({super.key});

  @override
  ConsumerState<CreatePostSheet> createState() => _CreatePostSheetState();
}

class _CreatePostSheetState extends ConsumerState<CreatePostSheet> {
  final _textController = TextEditingController();
  bool _isSubmitting = false;
  File? _image;
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImage() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (picked != null) {
      setState(() => _image = File(picked.path));
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (_textController.text.trim().isEmpty && _image == null) return;
    
    setState(() => _isSubmitting = true);
    
    String finalContent = _textController.text.trim();
    if (finalContent.isNotEmpty) {
      finalContent = '<p>$finalContent</p>';
    }
    
    if (_image != null) {
      final url = await ref.read(feedProvider.notifier).uploadPostImage(_image!.path);
      if (url != null) {
        finalContent += '<img src="$url" />';
      } else {
        if (mounted) {
           setState(() => _isSubmitting = false);
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to upload image')));
        }
        return;
      }
    }
    
    ref.read(feedProvider.notifier).createPost(
      finalContent,
      onSuccess: (msg) {
        if (mounted) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(msg),
            backgroundColor: const Color(0xFF10B981), // emerald-500
          ));
        }
      },
      onError: (err) {
        if (mounted) {
          setState(() => _isSubmitting = false);
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
                err,
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
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // We adjust padding based on keyboard using viewInsets
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A), // slate-900
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 24,
        bottom: bottomInset + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Create Post',
                style: GoogleFonts.inter(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              IconButton(
                icon: const Icon(LucideIcons.x, color: Color(0xFF94A3B8)),
                onPressed: () => Navigator.of(context).pop(),
              )
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _textController,
            maxLines: 5,
            minLines: 3,
            style: GoogleFonts.inter(color: Colors.white, fontSize: 16),
            decoration: InputDecoration(
              hintText: "What's on your mind? Share your achievements or thoughts...",
              hintStyle: GoogleFonts.inter(color: const Color(0xFF64748B)),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: Color(0xFF1E293B)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: Color(0xFF1E293B)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: Color(0xFFF59E0B)),
              ),
              filled: true,
              fillColor: const Color(0xFF020617),
            ),
          ),
          if (_image != null)
            Stack(
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 12),
                  height: 150,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    image: DecorationImage(image: FileImage(_image!), fit: BoxFit.cover),
                  ),
                ),
                Positioned(
                  top: 20,
                  right: 8,
                  child: GestureDetector(
                    onTap: () => setState(() => _image = null),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                      child: const Icon(LucideIcons.x, color: Colors.white, size: 20),
                    ),
                  ),
                ),
              ],
            ),
          const SizedBox(height: 8),
          Row(
            children: [
              IconButton(
                icon: const Icon(LucideIcons.image, color: Color(0xFFF59E0B)),
                onPressed: _pickImage,
              ),
              Text('Add Image', style: GoogleFonts.inter(color: const Color(0xFF94A3B8))),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFF59E0B), Color(0xFFF97316)],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Color(0xFF020617), strokeWidth: 2),
                      )
                    : Text(
                        'Post',
                        style: GoogleFonts.inter(
                          color: const Color(0xFF020617),
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
