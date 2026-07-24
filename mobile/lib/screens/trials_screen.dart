import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../providers/trials_provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'trial_result_screen.dart';

class TrialsScreen extends ConsumerStatefulWidget {
  const TrialsScreen({super.key});

  @override
  ConsumerState<TrialsScreen> createState() => _TrialsScreenState();
}

class _TrialsScreenState extends ConsumerState<TrialsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(trialsProvider.notifier).fetchTrialsData();
    });
  }

  String _getFullUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    final baseUrl = dotenv.env['API_URL'] ?? 'https://api.njara.web.id/api';
    final domain = baseUrl.replaceAll('/api', '');
    return '$domain$path';
  }

  @override
  Widget build(BuildContext context) {
    final trialsState = ref.watch(trialsProvider);

    return Scaffold(
      backgroundColor: context.bgPrimary, // slate-950
      appBar: AppBar(
        backgroundColor: context.bgPrimary,
        elevation: 0,
        title: Row(
          children: [
            Icon(LucideIcons.clipboardList, color: context.primary),
            const SizedBox(width: 8),
            Text(
              'Open Trials',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w700,
                color: context.textPrimary,
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: context.border,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${trialsState.myApplications.length} / 10 Applied',
                  style: GoogleFonts.inter(
                    color: context.textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: trialsState.isLoading
          ? Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(context.accent),
              ),
            )
          : RefreshIndicator(
              color: context.accent,
              onRefresh: () async {
                await ref.read(trialsProvider.notifier).fetchTrialsData();
              },
              child: trialsState.trials.isEmpty
                  ? ListView(
                      children: [
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.7,
                          child: Center(
                            child: Text(
                              'No open trials available right now.',
                              style: GoogleFonts.inter(color: context.textMuted),
                            ),
                          ),
                        )
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16.0),
                      itemCount: trialsState.trials.length,
                      itemBuilder: (context, index) {
                        final trial = trialsState.trials[index];
                        final trialId = trial['ID'];
                        
                        // Check if already applied
                        final myAppIndex = trialsState.myApplications.indexWhere((app) => app['TrialID'] == trialId);
                        final myApp = myAppIndex >= 0 ? trialsState.myApplications[myAppIndex] : null;
                        final isApplied = myApp != null;
                        // Parse dates
                        String formatDate(String? dateStr) {
                          if (dateStr == null || dateStr.isEmpty) return '';
                          try {
                            final d = DateTime.parse(dateStr);
                            return '${d.month}/${d.day}/${d.year}';
                          } catch (_) {
                            return dateStr;
                          }
                        }
                        
                        final startDate = formatDate(trial['StartDate']);
                        final endDate = formatDate(trial['EndDate']);
                        final dateDisplay = startDate.isNotEmpty && endDate.isNotEmpty 
                            ? '$startDate - $endDate' 
                            : (startDate.isNotEmpty ? startDate : 'TBD');
                        
                        final isApplying = trialsState.applyingTrialId == trialId;

                        return GestureDetector(
                          onTap: isApplied && myApp != null
                              ? () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => TrialResultScreen(application: myApp),
                                    ),
                                  );
                                }
                              : null,
                          child: Container(
                          width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: context.bgSecondary, // slate-900
                            border: Border.all(color: context.border), // slate-800
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                trial['Title'] ?? 'Trial',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 20,
                                  color: context.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                trial['Club']?['name'] ?? trial['Club']?['Name'] ?? 'Unknown Club',
                                style: GoogleFonts.inter(
                                  color: context.accent, // amber-500
                                  fontSize: 15,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                trial['Description'] ?? 'No description provided.',
                                style: GoogleFonts.inter(
                                  color: context.textSecondary, // slate-400
                                  fontSize: 15,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Icon(LucideIcons.calendar, size: 18, color: context.textMuted),
                                  const SizedBox(width: 6),
                                  Text(
                                    dateDisplay,
                                    style: GoogleFonts.inter(color: context.textMuted, fontSize: 14),
                                  ),
                                  const SizedBox(width: 20),
                                  Icon(LucideIcons.users, size: 18, color: context.textMuted),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Max ${trial['MaxParticipants'] ?? '?'} slot',
                                    style: GoogleFonts.inter(color: context.textMuted, fontSize: 14),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Divider(color: context.border, height: 1), // slate-800
                              const SizedBox(height: 16),
                              Align(
                                alignment: Alignment.centerRight,
                                child: isApplied
                                    ? Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                        decoration: BoxDecoration(
                                          color: context.border, // slate-800
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Column(
                                          mainAxisSize: MainAxisSize.min,
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(
                                                  myApp!['FinalResult'] == 'PASSED' || myApp['Status'] == 'SIGNED' 
                                                    ? LucideIcons.checkCircle2 
                                                    : (myApp['FinalResult'] == 'FAILED' || myApp['Status'] == 'REJECTED' 
                                                        ? LucideIcons.xCircle 
                                                        : (myApp['Status'] == 'SHORTLISTED' ? LucideIcons.checkCircle2 : LucideIcons.clock)), 
                                                  size: 16, 
                                                  color: myApp['FinalResult'] == 'PASSED' || myApp['Status'] == 'SIGNED' 
                                                    ? context.success 
                                                    : (myApp['FinalResult'] == 'FAILED' || myApp['Status'] == 'REJECTED' 
                                                        ? context.error 
                                                        : (myApp['Status'] == 'SHORTLISTED' ? context.success : context.accent))
                                                ),
                                                const SizedBox(width: 6),
                                                Text(
                                                  myApp['FinalResult'] == 'PASSED' || myApp['Status'] == 'SIGNED' ? 'Accepted' :
                                                  myApp['FinalResult'] == 'FAILED' || myApp['Status'] == 'REJECTED' ? 'Rejected' :
                                                  myApp['Status'] == 'SHORTLISTED' ? 'Shortlisted' : 'Pending',
                                                  style: GoogleFonts.inter(
                                                    color: context.textSecondary,
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 15,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            if (myApp['AssessmentScore'] != null) ...[
                                              const SizedBox(height: 6),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: context.bgPrimary.withOpacity(0.5),
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Text(
                                                  'Assessment Score: ${myApp['AssessmentScore']}',
                                                  style: GoogleFonts.inter(
                                                    color: context.accent,
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              ),
                                            ],
                                            if (myApp['Remarks'] != null && myApp['Remarks'].toString().isNotEmpty && myApp['AssessmentScore'] == null) ...[
                                              const SizedBox(height: 4),
                                              Text(
                                                'Note: ${myApp['Remarks']}',
                                                style: GoogleFonts.inter(
                                                  color: context.textMuted,
                                                  fontSize: 12,
                                                  fontStyle: FontStyle.italic,
                                                ),
                                              ),
                                            ]
                                          ],
                                        ),
                                      )
                                    : Container(
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            colors: [context.accent, Color(0xFFF97316)],
                                            begin: Alignment.centerLeft,
                                            end: Alignment.centerRight,
                                          ),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: ElevatedButton(
                                          onPressed: isApplying ? null : () {
                                            ref.read(trialsProvider.notifier).applyForTrial(
                                              trialId,
                                              onSuccess: (msg) {
                                                if (context.mounted) {
                                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
                                                }
                                              },
                                              onError: (err) {
                                                if (context.mounted) {
                                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                                    content: Text(err),
                                                    backgroundColor: context.error,
                                                  ));
                                                }
                                              },
                                            );
                                          },
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.transparent,
                                            shadowColor: Colors.transparent,
                                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                          ),
                                          child: isApplying 
                                            ? SizedBox(
                                                width: 18, 
                                                height: 18, 
                                                child: CircularProgressIndicator(color: context.bgPrimary, strokeWidth: 2)
                                              )
                                            : Text(
                                                'Apply',
                                                style: GoogleFonts.inter(
                                                  color: context.bgPrimary, // slate-950 for contrast
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 15,
                                                ),
                                              ),
                                        ),
                                      ),
                              ),
                            ],
                          ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
