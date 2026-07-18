import 'dart:convert';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';

String get _apiUrl => dotenv.env['API_URL'] ?? 'https://api.njara.web.id/api';

String _getFullUrl(String? path) {
  if (path == null || path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  final domain = _apiUrl.replaceAll('/api', '');
  return '$domain$path';
}

class PlayerDetailScreen extends ConsumerStatefulWidget {
  final int userId;
  final String? preloadName;
  final String? preloadAvatar;
  final String? preloadUsername; // used when navigating from a @mention

  const PlayerDetailScreen({
    super.key,
    required this.userId,
    this.preloadName,
    this.preloadAvatar,
    this.preloadUsername,
  });

  @override
  ConsumerState<PlayerDetailScreen> createState() => _PlayerDetailScreenState();
}

class _PlayerDetailScreenState extends ConsumerState<PlayerDetailScreen>
    with SingleTickerProviderStateMixin {
  // API data
  Map<String, dynamic>? _user; // the "user" key from /api/b2c/players/:id
  int _followersCount = 0;
  int _followingCount = 0;

  bool _isLoading = true;
  bool _isFollowing = false;
  bool _followLoading = false;
  String? _error;

  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _fetchData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (token == null) throw Exception('Not authenticated');
      final headers = {'Authorization': 'Bearer $token'};

      // Use username as lookup key if userId is 0 (from @mention tap)
      final lookupId = widget.userId != 0
          ? '${widget.userId}'
          : (widget.preloadUsername ?? '');
      if (lookupId.isEmpty) throw Exception('Invalid player reference');

      final results = await Future.wait([
        http.get(Uri.parse('$_apiUrl/b2c/players/$lookupId'), headers: headers),
      ]);

      // Resolve actual userId for follow-status (we get it from the profile)
      int resolvedUserId = widget.userId;

      // Parse player detail
      if (results[0].statusCode == 200) {
        final body = jsonDecode(results[0].body);
        final d = body['data'] as Map<String, dynamic>? ?? {};
        final userMap = d['user'] as Map<String, dynamic>? ?? {};
        setState(() {
          _user = userMap;
          _followersCount = (d['followers_count'] ?? 0) as int;
          _followingCount = (d['following_count'] ?? 0) as int;
        });
        resolvedUserId = (userMap['id'] ?? widget.userId) as int;
      } else {
        final body = jsonDecode(results[0].body);
        throw Exception(body['message'] ?? 'Failed to load player profile');
      }

      // Now fetch follow-status with the resolved userId
      final followRes = await http.get(
        Uri.parse('$_apiUrl/b2c/users/$resolvedUserId/follow-status'),
        headers: headers,
      );
      if (followRes.statusCode == 200) {
        final body = jsonDecode(followRes.body);
        setState(() {
          _isFollowing = (body['data']?['is_following'] ?? false) == true;
        });
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleFollow() async {
    setState(() => _followLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      final headers = {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      };

      http.Response res;
      if (_isFollowing) {
        res = await http.delete(
          Uri.parse('$_apiUrl/b2c/users/${widget.userId}/unfollow'),
          headers: headers,
        );
      } else {
        res = await http.post(
          Uri.parse('$_apiUrl/b2c/users/${widget.userId}/follow'),
          headers: headers,
        );
      }

      if (res.statusCode == 200 || res.statusCode == 201) {
        setState(() {
          if (_isFollowing) {
            _followersCount = (_followersCount - 1).clamp(0, 9999999);
          } else {
            _followersCount++;
          }
          _isFollowing = !_isFollowing;
        });
      } else {
        final data = jsonDecode(res.body);
        throw Exception(data['message'] ?? 'Failed');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: context.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _followLoading = false);
    }
  }

  // Helper to safely read from user map (API returns snake_case json tags)
  String _str(String key, [String fallback = '']) =>
      (_user?[key] ?? fallback).toString();

  List<dynamic> _list(String key) => (_user?[key] as List<dynamic>?) ?? [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bgPrimary,
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: context.primary))
          : _error != null
              ? _buildError()
              : _buildContent(),
    );
  }

  Widget _buildError() {
    return SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.alertCircle, color: context.error, size: 48),
              const SizedBox(height: 16),
              Text(
                _error!,
                style: GoogleFonts.inter(color: context.textSecondary, fontSize: 14),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _fetchData,
                icon: const Icon(LucideIcons.refreshCw, size: 16),
                label: Text('Retry', style: GoogleFonts.inter()),
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    // All keys use snake_case from json tags in userResponse
    final name = _str('full_name', widget.preloadName ?? 'Unknown');
    final username = _str('username');
    final category = _str('category');
    final bio = _str('bio');
    final avatarUrl = _str('profile_picture_url', widget.preloadAvatar ?? '');
    final clubName = _str('club_name');

    final stats = _list('stats');
    final socialMedias = _list('social_medias');
    final highlights = _list('highlights');
    final achievements = _list('achievements');

    return CustomScrollView(
      slivers: [
        // ──── Collapsing Header ────
        SliverAppBar(
          expandedHeight: 300,
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
                    context.primary.withValues(alpha: 0.18),
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
                    // Avatar
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: context.primary, width: 3),
                        boxShadow: [
                          BoxShadow(
                            color: context.primary.withValues(alpha: 0.35),
                            blurRadius: 24,
                            spreadRadius: 2,
                          )
                        ],
                      ),
                      child: CircleAvatar(
                        radius: 52,
                        backgroundColor: context.border,
                        backgroundImage: avatarUrl.isNotEmpty
                            ? CachedNetworkImageProvider(_getFullUrl(avatarUrl))
                            : null,
                        child: avatarUrl.isEmpty
                            ? Text(
                                name.isNotEmpty ? name[0].toUpperCase() : 'U',
                                style: GoogleFonts.inter(
                                  fontSize: 38,
                                  fontWeight: FontWeight.bold,
                                  color: context.textPrimary,
                                ),
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(height: 14),
                    // Name
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          name,
                          style: GoogleFonts.inter(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: context.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    // Username + club
                    const SizedBox(height: 2),
                    Text(
                      '@$username${clubName.isNotEmpty ? ' · $clubName' : ''}',
                      style: GoogleFonts.inter(color: context.textMuted, fontSize: 13),
                    ),
                    // Category badge
                    if (category.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: context.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: context.primary.withValues(alpha: 0.4)),
                        ),
                        child: Text(
                          category.replaceAll('_', ' ').toUpperCase(),
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: context.primary,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    // Followers / Following stats
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _buildCountChip('$_followersCount', 'Followers'),
                        Container(width: 1, height: 28, color: context.border, margin: const EdgeInsets.symmetric(horizontal: 20)),
                        _buildCountChip('$_followingCount', 'Following'),
                      ],
                    ),
                    const SizedBox(height: 4),
                  ],
                ),
              ),
            ),
          ),
          // Follow button in app bar actions
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: _followLoading
                  ? SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(color: context.primary, strokeWidth: 2),
                    )
                  : OutlinedButton.icon(
                      onPressed: _toggleFollow,
                      icon: Icon(
                        _isFollowing ? LucideIcons.userCheck : LucideIcons.userPlus,
                        size: 15,
                      ),
                      label: Text(
                        _isFollowing ? 'Following' : 'Follow',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: _isFollowing ? context.textSecondary : context.primary,
                        side: BorderSide(
                          color: _isFollowing ? context.border : context.primary,
                        ),
                        backgroundColor: _isFollowing
                            ? Colors.transparent
                            : context.primary.withValues(alpha: 0.12),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
            ),
          ],
        ),

        // ──── Bio ────
        if (bio.isNotEmpty)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: context.bgSecondary,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: context.border),
                ),
                child: Text(
                  bio,
                  style: GoogleFonts.inter(color: context.textSecondary, fontSize: 14, height: 1.6),
                ),
              ),
            ),
          ),

        // ──── Sticky TabBar ────
        SliverPersistentHeader(
          pinned: true,
          delegate: _StickyTabBarDelegate(
            TabBar(
              controller: _tabController,
              labelColor: context.primary,
              unselectedLabelColor: context.textMuted,
              indicatorColor: context.primary,
              indicatorSize: TabBarIndicatorSize.label,
              labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13),
              unselectedLabelStyle: GoogleFonts.inter(fontSize: 13),
              tabs: const [
                Tab(text: 'Stats'),
                Tab(text: 'Highlights'),
                Tab(text: 'Achievements'),
                Tab(text: 'Social'),
              ],
            ),
            context.bgPrimary,
            context.border,
          ),
        ),

        // ──── Tab Content ────
        SliverFillRemaining(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildStats(stats),
              _buildHighlights(highlights),
              _buildAchievements(achievements),
              _buildSocialMedia(socialMedias),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCountChip(String count, String label) {
    return Column(
      children: [
        Text(count, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: context.textPrimary)),
        Text(label, style: GoogleFonts.inter(fontSize: 12, color: context.textMuted)),
      ],
    );
  }

  // ──────────────────────────────────────────────
  // Stats tab
  // Domain: UserStat has no json tags → PascalCase keys
  // But userResponse embeds []domain.UserStat → same PascalCase
  // ──────────────────────────────────────────────
  Widget _buildStats(List<dynamic> stats) {
    if (stats.isEmpty) return _buildEmptyState('No stats available.');
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: stats.length,
      separatorBuilder: (_, __) => Divider(color: context.border, height: 1),
      itemBuilder: (context, i) {
        final s = stats[i] as Map<String, dynamic>;
        // Domain struct UserStat has no json tags => Go JSON uses field names (PascalCase)
        final statName = s['StatName']?.toString() ?? '';
        final statValue = s['StatValue']?.toString() ?? '';
        final game = s['Game'] as Map<String, dynamic>?;
        final gameName = game?['Name']?.toString() ?? '';

        return ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
          leading: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: context.primary.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(LucideIcons.activity, color: context.primary, size: 18),
          ),
          title: Text(statName, style: GoogleFonts.inter(color: context.textPrimary, fontWeight: FontWeight.w600)),
          subtitle: gameName.isNotEmpty
              ? Text(gameName, style: GoogleFonts.inter(color: context.textMuted, fontSize: 12))
              : null,
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: context.accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(statValue, style: GoogleFonts.inter(color: context.accent, fontWeight: FontWeight.bold)),
          ),
        );
      },
    );
  }

  // ──────────────────────────────────────────────
  // Highlights tab — UserHighlight: Title, VideoURL (PascalCase)
  // ──────────────────────────────────────────────
  Widget _buildHighlights(List<dynamic> highlights) {
    if (highlights.isEmpty) return _buildEmptyState('No highlights available.');
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: highlights.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        final h = highlights[i] as Map<String, dynamic>;
        final title = h['Title']?.toString() ?? 'Highlight';
        final videoUrl = h['VideoURL']?.toString() ?? '';

        return GestureDetector(
          onTap: () async {
            if (videoUrl.isNotEmpty) {
              final uri = Uri.tryParse(videoUrl);
              if (uri != null && await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            }
          },
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: context.bgSecondary,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.border),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF43F5E).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(LucideIcons.video, color: Color(0xFFF43F5E), size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: GoogleFonts.inter(color: context.textPrimary, fontWeight: FontWeight.w600)),
                      if (videoUrl.isNotEmpty)
                        Text(
                          videoUrl,
                          style: GoogleFonts.inter(color: context.textMuted, fontSize: 12),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
                Icon(LucideIcons.externalLink, color: context.textMuted, size: 16),
              ],
            ),
          ),
        );
      },
    );
  }

  // ──────────────────────────────────────────────
  // Achievements tab — UserAchievement: Title, Description, Year (PascalCase)
  // ──────────────────────────────────────────────
  Widget _buildAchievements(List<dynamic> achievements) {
    if (achievements.isEmpty) return _buildEmptyState('No achievements available.');
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: achievements.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        final a = achievements[i] as Map<String, dynamic>;
        final title = a['Title']?.toString() ?? '';
        final description = a['Description']?.toString() ?? '';
        final year = a['Year'];

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: context.bgSecondary,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: context.border),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(LucideIcons.trophy, color: Colors.amber, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: GoogleFonts.inter(color: context.textPrimary, fontWeight: FontWeight.w600)),
                    if (description.isNotEmpty)
                      Text(description, style: GoogleFonts.inter(color: context.textSecondary, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                    if (year != null && year != 0)
                      Text('$year', style: GoogleFonts.inter(color: context.textMuted, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ──────────────────────────────────────────────
  // Social Media tab — UserSocialMedia: Platform, URL, Username (PascalCase)
  // ──────────────────────────────────────────────
  Widget _buildSocialMedia(List<dynamic> socialMedias) {
    if (socialMedias.isEmpty) return _buildEmptyState('No social media linked.');
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: socialMedias.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        final s = socialMedias[i] as Map<String, dynamic>;
        final platform = s['Platform']?.toString() ?? '';
        final url = s['URL']?.toString() ?? '';
        final handle = s['Username']?.toString() ?? '';

        return GestureDetector(
          onTap: () async {
            if (url.isNotEmpty) {
              final uri = Uri.tryParse(url);
              if (uri != null && await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            }
          },
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: context.bgSecondary,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.border),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: context.accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(LucideIcons.link2, color: context.accent, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(platform, style: GoogleFonts.inter(color: context.textPrimary, fontWeight: FontWeight.w600)),
                      if (handle.isNotEmpty)
                        Text('@$handle', style: GoogleFonts.inter(color: context.textMuted, fontSize: 13)),
                      if (url.isNotEmpty)
                        Text(url, style: GoogleFonts.inter(color: context.textMuted, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                Icon(LucideIcons.externalLink, color: context.textMuted, size: 16),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(String msg) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.inbox, color: context.textMuted, size: 40),
          const SizedBox(height: 12),
          Text(msg, style: GoogleFonts.inter(color: context.textMuted, fontSize: 14)),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Sticky TabBar delegate
// ──────────────────────────────────────────────
class _StickyTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  final Color backgroundColor;
  final Color borderColor;

  _StickyTabBarDelegate(this.tabBar, this.backgroundColor, this.borderColor);

  @override
  double get minExtent => tabBar.preferredSize.height + 1;
  @override
  double get maxExtent => tabBar.preferredSize.height + 1;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: backgroundColor,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          tabBar,
          Divider(color: borderColor, height: 1, thickness: 1),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(_StickyTabBarDelegate oldDelegate) => false;
}
