import 'dart:convert';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:cached_network_image/cached_network_image.dart';

String get _apiUrl => dotenv.env['API_URL'] ?? 'https://api.njara.web.id/api';
String get _apiKey => dotenv.env['PUBLIC_GLOBAL_API_KEY'] ?? '';

String _getFullUrl(String? path) {
  if (path == null || path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  final domain = _apiUrl.replaceAll('/api', '');
  return '$domain$path';
}

class ClubDetailScreen extends ConsumerStatefulWidget {
  final int clubId;
  final String? preloadName;
  final String? preloadLogo;

  const ClubDetailScreen({
    super.key,
    required this.clubId,
    this.preloadName,
    this.preloadLogo,
  });

  @override
  ConsumerState<ClubDetailScreen> createState() => _ClubDetailScreenState();
}

class _ClubDetailScreenState extends ConsumerState<ClubDetailScreen> {
  Map<String, dynamic>? _club;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final res = await http.get(
        Uri.parse('$_apiUrl/global/clubs/${widget.clubId}'),
        headers: {'X-API-Key': _apiKey},
      );

      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        setState(() {
          _club = body['data'] as Map<String, dynamic>? ?? {};
        });
      } else {
        final body = jsonDecode(res.body);
        throw Exception(body['message'] ?? 'Failed to load club details');
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _str(String key, [String fallback = '']) {
    if (_club == null) return fallback;
    final val = _club![key];
    if (val == null) return fallback;
    return val.toString();
  }

  List<dynamic> _list(String key) {
    if (_club == null) return [];
    final val = _club![key];
    if (val is List) return val;
    return [];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bgPrimary,
      body: _isLoading && _club == null
          ? Center(child: CircularProgressIndicator(color: context.primary))
          : _error != null && _club == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!, style: GoogleFonts.inter(color: context.error)),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _fetchData,
                        child: const Text('Retry'),
                      )
                    ],
                  ),
                )
              : _buildContent(),
    );
  }

  Widget _buildContent() {
    final name = _str('name', widget.preloadName ?? 'Unknown Club');
    final address = _str('address');
    final country = _str('country');
    final estYear = _str('established_year');
    final logoUrl = _str('logo_url', widget.preloadLogo ?? '');
    final achievements = _list('achievements');
    
    String location = [address, country].where((e) => e.isNotEmpty).join(', ');

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 280,
          pinned: true,
          backgroundColor: context.bgSecondary,
          foregroundColor: context.textPrimary,
          iconTheme: IconThemeData(color: context.textPrimary),
          flexibleSpace: FlexibleSpaceBar(
            collapseMode: CollapseMode.pin,
            background: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    context.primary.withValues(alpha: 0.15),
                    context.bgSecondary,
                  ],
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 32),
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: context.border,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: context.primary.withValues(alpha: 0.5), width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: context.primary.withValues(alpha: 0.2),
                            blurRadius: 20,
                            spreadRadius: 2,
                          )
                        ],
                        image: logoUrl.isNotEmpty
                            ? DecorationImage(
                                image: CachedNetworkImageProvider(_getFullUrl(logoUrl)),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: logoUrl.isEmpty
                          ? Icon(LucideIcons.shield, size: 40, color: context.textSecondary)
                          : null,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      name,
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: context.textPrimary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    if (location.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.mapPin, size: 14, color: context.textMuted),
                          const SizedBox(width: 4),
                          Text(
                            location,
                            style: GoogleFonts.inter(color: context.textMuted, fontSize: 14),
                          ),
                        ],
                      ),
                    ],
                    if (estYear.isNotEmpty && estYear != '0') ...[
                      const SizedBox(height: 6),
                      Text(
                        'Est. $estYear',
                        style: GoogleFonts.inter(color: context.textMuted, fontSize: 13),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.trophy, color: context.accent, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Achievements',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: context.textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (achievements.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: context.bgSecondary,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.border),
                    ),
                    child: Column(
                      children: [
                        Icon(LucideIcons.award, size: 48, color: context.textMuted.withValues(alpha: 0.5)),
                        const SizedBox(height: 12),
                        Text(
                          'No achievements recorded yet.',
                          style: GoogleFonts.inter(color: context.textMuted),
                        ),
                      ],
                    ),
                  )
                else
                  ...achievements.map((a) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: context.bgSecondary,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: context.border),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: context.accent.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(LucideIcons.medal, color: context.accent, size: 20),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  a['title'] ?? '',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                    color: context.textPrimary,
                                    fontSize: 16,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  a['tournament_name'] ?? '',
                                  style: GoogleFonts.inter(
                                    color: context.textSecondary,
                                    fontSize: 14,
                                  ),
                                ),
                                if (a['game_title'] != null && a['game_title'].toString().isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(
                                      'Game: ${a['game_title']}',
                                      style: GoogleFonts.inter(
                                        color: context.primary,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          if (a['placement'] != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: context.border,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                a['placement'],
                                style: GoogleFonts.inter(
                                  color: context.textPrimary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                        ],
                      ),
                    );
                  }),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
