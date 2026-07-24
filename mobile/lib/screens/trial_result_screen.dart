import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_colors.dart';

class TrialResultScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> application;
  
  const TrialResultScreen({super.key, required this.application});

  @override
  ConsumerState<TrialResultScreen> createState() => _TrialResultScreenState();
}

class _TrialResultScreenState extends ConsumerState<TrialResultScreen> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _assessmentDetail;

  @override
  void initState() {
    super.initState();
    _fetchAssessmentDetail();
  }

  Future<void> _fetchAssessmentDetail() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (token == null) throw Exception('Not authenticated');

      final baseUrl = dotenv.env['API_URL'] ?? 'https://api.njara.web.id/api';
      final appId = widget.application['ID'];
      final response = await http.get(
        Uri.parse('$baseUrl/my-applications/$appId/assessment'),
        headers: {
          'Authorization': 'Bearer $token',
          'X-API-Key': dotenv.env['API_KEY'] ?? '',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _assessmentDetail = data['data'];
          _isLoading = false;
        });
      } else {
        throw Exception('Failed to load assessment detail');
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'TBD';
    try {
      final d = DateTime.parse(dateStr);
      return '${d.month}/${d.day}/${d.year}';
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    final trial = widget.application['Trial'] ?? {};
    final club = trial['Club'] ?? {};

    return Scaffold(
      backgroundColor: context.bgPrimary,
      appBar: AppBar(
        backgroundColor: context.bgPrimary,
        elevation: 0,
        title: Text(
          'Trial Result',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
            color: context.textPrimary,
          ),
        ),
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: context.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading 
        ? Center(child: CircularProgressIndicator(color: context.accent))
        : _error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.alertCircle, color: context.error, size: 48),
                  const SizedBox(height: 16),
                  Text(_error!, style: GoogleFonts.inter(color: context.textSecondary)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _fetchAssessmentDetail,
                    style: ElevatedButton.styleFrom(backgroundColor: context.accent),
                    child: const Text('Try Again'),
                  )
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: context.bgSecondary,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          trial['Title'] ?? 'Unknown Trial',
                          style: GoogleFonts.inter(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: context.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(LucideIcons.shield, size: 16, color: context.accent),
                            const SizedBox(width: 8),
                            Text(
                              club['Name'] ?? club['name'] ?? 'Unknown Club',
                              style: GoogleFonts.inter(
                                color: context.accent,
                                fontWeight: FontWeight.w600,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Icon(LucideIcons.calendar, size: 16, color: context.textMuted),
                            const SizedBox(width: 8),
                            Text(
                              '${_formatDate(trial['StartDate'])} - ${_formatDate(trial['EndDate'])}',
                              style: GoogleFonts.inter(color: context.textMuted),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Status Section
                  _buildStatusSection(context),

                  const SizedBox(height: 24),

                  // Assessment Detail
                  if (_assessmentDetail != null && _assessmentDetail!['Assessment'] != null)
                    _buildAssessmentSection(context),
                ],
              ),
            ),
    );
  }

  Widget _buildStatusSection(BuildContext context) {
    final app = _assessmentDetail?['Application'] ?? widget.application;
    
    final finalResult = app['FinalResult'];
    final status = app['Status'];
    
    String title = 'Pending';
    IconData icon = LucideIcons.clock;
    Color color = context.accent;
    String description = 'Your application is waiting to be assessed by the club. Please wait for the final result.';

    if (finalResult == 'PASSED' || status == 'SIGNED') {
      title = 'Accepted';
      icon = LucideIcons.checkCircle2;
      color = context.success;
      description = 'Congratulations! You have been accepted and passed the trial selection for this club.';
    } else if (finalResult == 'FAILED' || status == 'REJECTED') {
      title = 'Rejected';
      icon = LucideIcons.xCircle;
      color = context.error;
      description = "Unfortunately, you do not meet the club's qualifications for this trial.";
    } else if (status == 'SHORTLISTED') {
      title = 'Shortlisted';
      icon = LucideIcons.checkCircle2;
      color = context.success;
      description = 'You are shortlisted and eligible to be assessed by the club.';
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 48, color: color),
          const SizedBox(height: 16),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              color: context.textSecondary,
              fontSize: 14,
            ),
          ),
          if (app['Remarks'] != null && app['Remarks'].toString().isNotEmpty) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.bgPrimary.withOpacity(0.5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(LucideIcons.messageSquare, size: 16, color: context.textMuted),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Club Note: ${app['Remarks']}',
                      style: GoogleFonts.inter(
                        color: context.textSecondary,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ]
        ],
      ),
    );
  }

  Widget _buildAssessmentSection(BuildContext context) {
    final assessment = _assessmentDetail!['Assessment'];
    final scores = _assessmentDetail!['Scores'] as List<dynamic>? ?? [];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.bgSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Assessment Score',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: context.textPrimary,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: context.accent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Total: ${assessment['TotalScore'] ?? 0}',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    color: context.accent,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          if (scores.isEmpty)
            Center(
              child: Text(
                'No detailed scores yet.',
                style: GoogleFonts.inter(color: context.textMuted),
              ),
            )
          else
            ...scores.map((score) {
              final criteria = score['Criteria'] ?? {};
              return Padding(
                padding: const EdgeInsets.only(bottom: 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          criteria['Name'] ?? 'Unknown Criteria',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.w600,
                            color: context.textSecondary,
                          ),
                        ),
                        Text(
                          '${score['Score'] ?? 0} / 100',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.bold,
                            color: context.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: (score['Score'] ?? 0) / 100.0,
                        backgroundColor: context.border,
                        color: context.accent,
                        minHeight: 8,
                      ),
                    ),
                    if (score['Note'] != null && score['Note'].toString().isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        score['Note'],
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: context.textMuted,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ]
                  ],
                ),
              );
            }).toList(),
            
          if (assessment['Summary'] != null && assessment['Summary'].toString().isNotEmpty) ...[
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 16),
            Text(
              'Conclusion',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                color: context.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              assessment['Summary'],
              style: GoogleFonts.inter(color: context.textSecondary),
            ),
          ]
        ],
      ),
    );
  }
}
