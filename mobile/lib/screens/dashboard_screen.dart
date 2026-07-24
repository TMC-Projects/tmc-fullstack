import 'dart:convert';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../utils/blur_extension.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/dashboard_provider.dart';
import 'player_detail_screen.dart';
import 'club_detail_screen.dart';
import 'trials_screen.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

String _getFullUrl(String? path) {
  if (path == null || path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  final baseUrl = dotenv.env['API_URL'] ?? 'https://api.njara.web.id';
  // if baseUrl has /api, remove it to get the domain root
  final domain = baseUrl.replaceAll('/api', '');
  return '$domain$path';
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  final _searchController = TextEditingController();
  bool _isSearching = false;
  int _clubPage = 1;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(dashboardProvider.notifier).fetchDashboardData();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _searchPlayer() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    setState(() => _isSearching = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (token == null) throw Exception('Not authenticated');

      final apiUrl = dotenv.env['API_URL'] ?? 'https://api.njara.web.id/api';
      final res = await http.get(
        Uri.parse('$apiUrl/b2c/players/$query'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (!mounted) return;

      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        final data = body['data'] as Map<String, dynamic>? ?? {};
        final user = data['user'] as Map<String, dynamic>? ?? {};
        final userId = user['id'] as int? ?? 0;
        final fullName = user['full_name'] as String?;
        final avatar = user['profile_picture_url'] as String?;

        if (userId == 0) throw Exception('Player not found.');

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => PlayerDetailScreen(
              userId: userId,
              preloadName: fullName,
              preloadAvatar: avatar,
            ),
          ),
        );
      } else {
        final body = jsonDecode(res.body);
        final msg = body['message'] as String? ?? 'Player not found.';
        throw Exception(msg);
      }
    } catch (e) {
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          backgroundColor: Theme.of(context).colorScheme.surface,
          title: Text('Player Not Found', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
          content: Text(
            e.toString().replaceAll('Exception: ', ''),
            style: GoogleFonts.inter(color: Colors.grey),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('OK', style: GoogleFonts.inter(color: Theme.of(context).colorScheme.primary)),
            ),
          ],
        ),
      );
    } finally {
      if (mounted) setState(() => _isSearching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dashboardState = ref.watch(dashboardProvider);

    return Scaffold(
      backgroundColor: context.bgPrimary, // slate-950
      appBar: AppBar(
        backgroundColor: context.bgPrimary,
        elevation: 0,
        title: Row(
          children: [
            Icon(LucideIcons.gamepad2, color: context.primary),
            const SizedBox(width: 8),
            Text(
              'NJARA Player',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w700,
                color: context.textPrimary,
              ),
            ),
          ],
        ),
        actions: [],
      ),

      body: dashboardState.isLoading
          ? Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(context.accent),
              ),
            )
          : RefreshIndicator(
              color: context.accent,
              onRefresh: () async {
                await ref.read(dashboardProvider.notifier).fetchDashboardData();
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Error state
                    if (dashboardState.error != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 24),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0x1AF43F5E), // rose-500/10
                          border: Border.all(color: const Color(0x33F43F5E)),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          dashboardState.error!,
                          style: GoogleFonts.inter(color: context.error),
                        ),
                      ),

                    // Welcome Section
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0x1AF59E0B), Color(0x1AF97316)],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                        border: Border.all(color: const Color(0x33F59E0B)),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            top: -50,
                            right: -50,
                            child: Container(
                              width: 150,
                              height: 150,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Color(0x33F59E0B), // amber-500/20
                              ),
                            ).blurred(80),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(24.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Welcome back!',
                                  style: GoogleFonts.inter(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: context.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Ready to take your game to the next level? Explore clubs, find open trials, and manage your career all in one place.',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    color: context.textSecondary, // slate-400
                                  ),
                                ),
                                const SizedBox(height: 24),
                                
                                // Search Player
                                Container(
                                  padding: const EdgeInsets.only(left: 16, right: 6, top: 6, bottom: 6),
                                  decoration: BoxDecoration(
                                    color: const Color(0x800F172A), // slate-900/50
                                    border: Border.all(color: const Color(0x4DF59E0B)), // amber-500/30
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: TextField(
                                          controller: _searchController,
                                          style: GoogleFonts.inter(color: context.textPrimary),
                                          keyboardType: TextInputType.number,
                                          textInputAction: TextInputAction.search,
                                          onSubmitted: (_) => _searchPlayer(),
                                          decoration: InputDecoration(
                                            hintText: 'Search Player ID...',
                                            hintStyle: GoogleFonts.inter(color: context.textMuted),
                                            border: InputBorder.none,
                                          ),
                                        ),
                                      ),
                                      Container(
                                        decoration: BoxDecoration(
                                          color: context.accent,
                                          borderRadius: BorderRadius.circular(50),
                                        ),
                                        child: _isSearching
                                            ? Padding(
                                                padding: const EdgeInsets.all(12),
                                                child: SizedBox(
                                                  width: 20,
                                                  height: 20,
                                                  child: CircularProgressIndicator(
                                                    color: context.textPrimary,
                                                    strokeWidth: 2,
                                                  ),
                                                ),
                                              )
                                            : IconButton(
                                                icon: Icon(LucideIcons.search, color: context.textPrimary, size: 20),
                                                onPressed: _searchPlayer,
                                              ),
                                      )
                                    ],
                                  ),
                                )
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Open Trials Section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Open Trials',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: context.textPrimary,
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const TrialsScreen()),
                            );
                          },
                          child: Text(
                            'View All',
                            style: GoogleFonts.inter(
                              color: context.accent,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        )
                      ],
                    ),
                    const SizedBox(height: 12),
                    dashboardState.trials.isEmpty
                        ? Padding(
                            padding: const EdgeInsets.symmetric(vertical: 20),
                            child: Center(
                              child: Text(
                                'No open trials available right now.',
                                style: GoogleFonts.inter(color: context.textMuted),
                              ),
                            ),
                          )
                        : ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: dashboardState.trials.length,
                            itemBuilder: (context, index) {
                              final trial = dashboardState.trials[index];
                              
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
                              
                              final isApplying = dashboardState.applyingTrialId == trial['ID'];
                              
                              return Container(
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
                                      child: Container(
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
                                            ref.read(dashboardProvider.notifier).applyForTrial(
                                              trial['ID'],
                                              onSuccess: (msg) {
                                                if (context.mounted) {
                                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
                                                }
                                              },
                                              onError: (err) {
                                                if (context.mounted) {
                                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                                    content: Text(err),
                                                    backgroundColor: context.error, // rose-600
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
                              );
                            },
                          ),
                    const SizedBox(height: 32),

                    // Verified Clubs Section
                    Text(
                      'Verified Clubs',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: context.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    dashboardState.clubs.isEmpty
                        ? Padding(
                            padding: const EdgeInsets.symmetric(vertical: 20),
                            child: Center(
                              child: Text(
                                'No clubs found.',
                                style: GoogleFonts.inter(color: context.textMuted),
                              ),
                            ),
                          )
                        : Builder(
                            builder: (context) {
                              final int itemsPerPage = 5;
                              final int totalPages = (dashboardState.clubs.length / itemsPerPage).ceil();
                              final int startIndex = (_clubPage - 1) * itemsPerPage;
                              final int endIndex = (startIndex + itemsPerPage > dashboardState.clubs.length) 
                                  ? dashboardState.clubs.length 
                                  : startIndex + itemsPerPage;
                              
                              final displayedClubs = dashboardState.clubs.sublist(startIndex, endIndex);

                              return Column(
                                children: [
                                  ListView.builder(
                                    shrinkWrap: true,
                                    physics: const NeverScrollableScrollPhysics(),
                                    itemCount: displayedClubs.length,
                                    itemBuilder: (context, index) {
                                      final club = displayedClubs[index];
                                      return GestureDetector(
                                        onTap: () {
                                          final clubId = club['ID'] ?? club['id'];
                                          if (clubId != null) {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) => ClubDetailScreen(
                                                  clubId: clubId,
                                                  preloadName: club['Name'] ?? club['name'],
                                                  preloadLogo: club['logo_url'],
                                                ),
                                              ),
                                            );
                                          }
                                        },
                                        child: Container(
                                          margin: const EdgeInsets.only(bottom: 12),
                                          padding: const EdgeInsets.all(16),
                                          decoration: BoxDecoration(
                                            color: context.bgSecondary, // slate-900
                                            border: Border.all(color: context.border), // slate-800
                                            borderRadius: BorderRadius.circular(16),
                                          ),
                                          child: Row(
                                            children: [
                                              Container(
                                                width: 48,
                                                height: 48,
                                                decoration: BoxDecoration(
                                                  color: context.border,
                                                  borderRadius: BorderRadius.circular(12),
                                                  image: club['logo_url'] != null && club['logo_url'].toString().isNotEmpty
                                                      ? DecorationImage(
                                                          image: CachedNetworkImageProvider(_getFullUrl(club['logo_url'])),
                                                          fit: BoxFit.cover,
                                                        )
                                                      : null,
                                                ),
                                                child: (club['logo_url'] == null || club['logo_url'].toString().isEmpty)
                                                    ? Icon(LucideIcons.shield, color: context.textSecondary)
                                                    : null,
                                              ),
                                              const SizedBox(width: 16),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      club['Name'] ?? club['name'] ?? 'Unnamed Club',
                                                      style: GoogleFonts.inter(
                                                        fontWeight: FontWeight.w600,
                                                        color: context.textPrimary,
                                                        fontSize: 16,
                                                      ),
                                                    ),
                                                    if (club['City'] != null || club['city'] != null)
                                                      Text(
                                                        club['City'] ?? club['city'],
                                                        style: GoogleFonts.inter(
                                                          color: context.textSecondary,
                                                          fontSize: 13,
                                                        ),
                                                      ),
                                                  ],
                                                ),
                                              ),
                                              Icon(LucideIcons.chevronRight, color: context.textMuted),
                                            ],
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                  if (totalPages > 1) ...[
                                    const SizedBox(height: 16),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        IconButton(
                                          icon: Icon(LucideIcons.chevronLeft, color: _clubPage > 1 ? context.textPrimary : context.textMuted),
                                          onPressed: _clubPage > 1 
                                              ? () => setState(() => _clubPage--)
                                              : null,
                                        ),
                                        const SizedBox(width: 16),
                                        Text(
                                          'Page $_clubPage of $totalPages',
                                          style: GoogleFonts.inter(
                                            color: context.textSecondary,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        IconButton(
                                          icon: Icon(LucideIcons.chevronRight, color: _clubPage < totalPages ? context.textPrimary : context.textMuted),
                                          onPressed: _clubPage < totalPages 
                                              ? () => setState(() => _clubPage++)
                                              : null,
                                        ),
                                      ],
                                    ),
                                  ]
                                ],
                              );
                            }
                          ),
                  ],
                ),
              ),
            ),
    );
  }
}
