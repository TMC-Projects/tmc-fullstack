import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../providers/profile_provider.dart';
import '../../theme/app_colors.dart';
import 'profile_utils.dart';

class StatSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic>? initialData;
  const StatSheet({super.key, this.initialData});
  @override
  ConsumerState<StatSheet> createState() => _StatSheetState();
}

class _StatSheetState extends ConsumerState<StatSheet> {
  late TextEditingController _nameController;
  late TextEditingController _valueController;
  bool _isSubmitting = false;
  
  List<dynamic> _games = [];
  int? _selectedGameId;
  bool _isLoadingGames = true;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialData?['StatName'] ?? '');
    _valueController = TextEditingController(text: widget.initialData?['StatValue'] ?? '');
    _selectedGameId = widget.initialData?['GameID'];
    _fetchGames();
  }
  
  Future<void> _fetchGames() async {
    try {
      await dotenv.load();
      final apiUrl = dotenv.env['API_URL'] ?? 'http://127.0.0.1:8080/api';
      final response = await http.get(Uri.parse('$apiUrl/games'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          setState(() {
            _games = data['data'];
            _isLoadingGames = false;
            if (_selectedGameId == null && _games.isNotEmpty) {
              _selectedGameId = _games.first['id'];
            }
          });
        }
      } else {
        setState(() => _isLoadingGames = false);
      }
    } catch (e) {
      setState(() => _isLoadingGames = false);
    }
  }

  void _submit() {
    if (_selectedGameId == null) {
      showCustomError(context, 'Please select a game first');
      return;
    }
    setState(() => _isSubmitting = true);
    ref.read(profileProvider.notifier).saveItem(
      'stats',
      {
        'game_id': _selectedGameId,
        'stat_name': _nameController.text,
        'stat_value': _valueController.text,
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

  Widget _buildField(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: controller,
        style: GoogleFonts.inter(color: context.textPrimary),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: GoogleFonts.inter(color: context.textMuted),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.border)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.primary)),
          filled: true,
          fillColor: context.bgPrimary,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      decoration: BoxDecoration(color: context.bgSecondary, borderRadius: const BorderRadius.vertical(top: Radius.circular(24))),
      padding: EdgeInsets.fromLTRB(20, 24, 20, bottomInset + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(widget.initialData == null ? 'Add Stat' : 'Edit Stat', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: context.textPrimary)),
              IconButton(icon: Icon(LucideIcons.x, color: context.textMuted), onPressed: () => Navigator.of(context).pop())
            ],
          ),
          const SizedBox(height: 16),
          
          if (_isLoadingGames)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Center(child: CircularProgressIndicator(color: context.primary)),
            )
          else if (_games.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: DropdownButtonFormField<int>(
                value: _selectedGameId,
                dropdownColor: context.bgSecondary,
                style: GoogleFonts.inter(color: context.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Game',
                  labelStyle: GoogleFonts.inter(color: context.textMuted),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.border)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.primary)),
                  filled: true,
                  fillColor: context.bgPrimary,
                ),
                items: _games.map<DropdownMenuItem<int>>((game) {
                  return DropdownMenuItem<int>(
                    value: game['id'],
                    child: Text(game['name']),
                  );
                }).toList(),
                onChanged: (val) {
                  setState(() {
                    _selectedGameId = val;
                  });
                },
              ),
            ),
          
          _buildField('Stat Name (e.g. Height, Role, Rank)', _nameController),
          _buildField('Value (e.g. 180 cm, Jungler, Mythic)', _valueController),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: context.primary,
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
