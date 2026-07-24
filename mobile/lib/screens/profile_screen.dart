import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';
import 'settings_screen.dart';
import '../providers/profile_provider.dart';
import '../providers/subscription_provider.dart';
import '../widgets/profile/edit_profile_sheet.dart';
import '../widgets/profile/change_password_sheet.dart';
import '../widgets/profile/social_media_sheet.dart';
import '../widgets/profile/stat_sheet.dart';
import '../widgets/profile/highlight_sheet.dart';
import '../widgets/profile/achievement_sheet.dart';
import '../widgets/profile/feedback_sheet.dart';
import '../widgets/profile/profile_utils.dart';
import 'package:intl/intl.dart';

String get _apiUrl => dotenv.env['API_URL'] ?? 'https://api.njara.web.id/api';

String _getFullUrl(String? path) {
  if (path == null || path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  final baseUrl = _apiUrl.replaceAll('/api', '');
  return '$baseUrl$path';
}

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(profileProvider.notifier).fetchProfile();
    });
  }

  void _showSheet(Widget sheet) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => sheet,
    );
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (image != null) {
      if (mounted) {
        showCustomSuccess(context, 'Uploading image...');
        ref.read(profileProvider.notifier).uploadAvatar(
          image.path,
          onSuccess: (msg) => showCustomSuccess(context, msg),
          onError: (err) => showCustomError(context, err),
        );
      }
    }
  }

  void _handleLogout() async {
    await ref.read(authProvider.notifier).logout();
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  Widget _buildSectionHeader(String title, VoidCallback onAdd) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: GoogleFonts.inter(color: context.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
          IconButton(
            icon: Icon(LucideIcons.plus, color: context.primary),
            onPressed: onAdd,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.bgSecondary,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.border),
        ),
        child: Text(message, style: GoogleFonts.inter(color: context.textMuted), textAlign: TextAlign.center),
      ),
    );
  }

  Widget _buildActionIcon(IconData icon, VoidCallback onTap, {Color? color}) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Icon(icon, size: 18, color: color ?? context.textSecondary),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(profileProvider);
    final subState = ref.watch(subscriptionProvider);
    final isPremium = subState.activeSub != null;

    if (state.isLoading && state.profileData == null) {
      return Center(child: CircularProgressIndicator(color: context.primary));
    }
    if (state.error != null && state.profileData == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(state.error!, style: GoogleFonts.inter(color: context.error)),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: () => ref.read(profileProvider.notifier).fetchProfile(), child: const Text('Retry')),
          ],
        ),
      );
    }
    if (state.profileData == null) return const SizedBox();

    final user = state.profileData!;
    final socialMedias = user['social_medias'] as List<dynamic>? ?? [];
    final stats = user['stats'] as List<dynamic>? ?? [];
    final highlights = user['highlights'] as List<dynamic>? ?? [];
    final achievements = user['achievements'] as List<dynamic>? ?? [];

    return RefreshIndicator(
      onRefresh: () => ref.read(profileProvider.notifier).fetchProfile(),
      color: context.primary,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 80),
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(20, 40, 20, 24),
            decoration: BoxDecoration(
              color: context.bgSecondary,
              border: Border(bottom: BorderSide(color: context.border)),
            ),
            child: Stack(
              children: [
                Column(
                  children: [

                    Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        CircleAvatar(
                          radius: 50,
                          backgroundColor: context.border,
                          backgroundImage: user['profile_picture_url'] != null && user['profile_picture_url'].isNotEmpty
                              ? CachedNetworkImageProvider(_getFullUrl(user['profile_picture_url']))
                              : null,
                          child: (user['profile_picture_url'] == null || user['profile_picture_url'].isEmpty)
                              ? Text(user['full_name']?.substring(0, 1).toUpperCase() ?? 'U', style: GoogleFonts.inter(fontSize: 32, color: context.textPrimary))
                              : null,
                        ),
                        InkWell(
                          onTap: _pickImage,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: context.primary, shape: BoxShape.circle),
                            child: Icon(LucideIcons.camera, size: 16, color: context.textPrimary),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(user['full_name'] ?? '', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: context.textPrimary)),
                        if (isPremium) ...[
                          const SizedBox(width: 8),
                          const Icon(LucideIcons.crown, color: Colors.amber, size: 24),
                        ],
                      ],
                    ),
                    Text('@${user['username'] ?? ''} • ${user['category'] ?? ''}', style: GoogleFonts.inter(fontSize: 14, color: context.textMuted)),
                    if (user['club_name'] != null && user['club_name'].toString().isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.building2, size: 13, color: context.primary),
                          const SizedBox(width: 5),
                          Text(
                            user['club_name'],
                            style: GoogleFonts.inter(fontSize: 13, color: context.primary, fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ],
                    if (user['bio'] != null && user['bio'].toString().isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text(user['bio'], style: GoogleFonts.inter(color: Color(0xFFCBD5E1)), textAlign: TextAlign.center),
                      ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Column(children: [
                          Text('${state.followersCount}', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: context.textPrimary)),
                          Text('Followers', style: GoogleFonts.inter(fontSize: 12, color: context.textMuted)),
                        ]),
                        const SizedBox(width: 32),
                        Column(children: [
                          Text('${state.followingCount}', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: context.textPrimary)),
                          Text('Following', style: GoogleFonts.inter(fontSize: 12, color: context.textMuted)),
                        ]),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _showSheet(EditProfileSheet(initialData: user)),
                            icon: const Icon(LucideIcons.edit2, size: 16),
                            label: Text('Edit Profile', style: GoogleFonts.inter()),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: context.border,
                              foregroundColor: context.textPrimary,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _showSheet(const ChangePasswordSheet()),
                            icon: const Icon(LucideIcons.key, size: 16),
                            label: Text('Password', style: GoogleFonts.inter()),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: context.border,
                              foregroundColor: context.textPrimary,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Social Media
          _buildSectionHeader('Social Media', () => _showSheet(const SocialMediaSheet())),
          if (socialMedias.isEmpty) _buildEmptyState('No social media links added.'),
          ...socialMedias.map((s) => ListTile(
            leading: Icon(LucideIcons.link2, color: context.primary),
            title: Text('${s['Platform']}', style: GoogleFonts.inter(color: context.textPrimary)),
            subtitle: Text('${s['URL']}', style: GoogleFonts.inter(color: context.textSecondary)),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildActionIcon(LucideIcons.edit2, () => _showSheet(SocialMediaSheet(initialData: s))),
                _buildActionIcon(LucideIcons.trash2, () => ref.read(profileProvider.notifier).deleteItem('social-media', s['ID'], onSuccess: (m) => showCustomSuccess(context, m), onError: (e) => showCustomError(context, e)), color: context.error),
              ],
            ),
          )),

          // Stats
          _buildSectionHeader('Player Stats', () => _showSheet(const StatSheet())),
          if (stats.isEmpty) _buildEmptyState('No stats added.'),
          ...stats.map((s) {
            String gameName = '';
            if (s['Game'] != null && s['Game']['Name'] != null) {
              gameName = s['Game']['Name'] + ' • ';
            } else if (s['game'] != null && s['game']['name'] != null) {
              gameName = s['game']['name'] + ' • ';
            }
            return ListTile(
              leading: Icon(LucideIcons.activity, color: context.primary),
              title: Text('${s['StatName']}', style: GoogleFonts.inter(color: context.textPrimary)),
              subtitle: Text('$gameName${s['StatValue']}', style: GoogleFonts.inter(color: context.textSecondary)),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
              children: [
                _buildActionIcon(LucideIcons.edit2, () => _showSheet(StatSheet(initialData: s))),
                _buildActionIcon(LucideIcons.trash2, () => ref.read(profileProvider.notifier).deleteItem('stats', s['ID'], onSuccess: (m) => showCustomSuccess(context, m), onError: (e) => showCustomError(context, e)), color: context.error),
              ],
            ),
          );
          }).toList(),
          // Highlights
          _buildSectionHeader('Highlights', () => _showSheet(const HighlightSheet())),
          if (highlights.isEmpty) _buildEmptyState('No highlights added.'),
          ...highlights.map((h) => ListTile(
            leading: Icon(LucideIcons.video, color: context.primary),
            title: Text('${h['Title']}', style: GoogleFonts.inter(color: context.textPrimary)),
            subtitle: Text('${h['VideoURL']}', style: GoogleFonts.inter(color: context.textSecondary)),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildActionIcon(LucideIcons.edit2, () => _showSheet(HighlightSheet(initialData: h))),
                _buildActionIcon(LucideIcons.trash2, () => ref.read(profileProvider.notifier).deleteItem('highlights', h['ID'], onSuccess: (m) => showCustomSuccess(context, m), onError: (e) => showCustomError(context, e)), color: context.error),
              ],
            ),
          )),

          // Achievements
          _buildSectionHeader('Achievements', () => _showSheet(const AchievementSheet())),
          if (achievements.isEmpty) _buildEmptyState('No achievements added.'),
          ...achievements.map((a) {
            final dateStr = a['AchievementDate'] != null ? DateFormat('yyyy-MMM-dd').format(DateTime.parse(a['AchievementDate'])) : '';
            return ListTile(
              leading: Icon(LucideIcons.award, color: context.primary),
              title: Text('${a['Title']}', style: GoogleFonts.inter(color: context.textPrimary)),
              subtitle: Text(dateStr, style: GoogleFonts.inter(color: context.textSecondary)),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildActionIcon(LucideIcons.edit2, () => _showSheet(AchievementSheet(initialData: a))),
                  _buildActionIcon(LucideIcons.trash2, () => ref.read(profileProvider.notifier).deleteItem('achievements', a['ID'], onSuccess: (m) => showCustomSuccess(context, m), onError: (e) => showCustomError(context, e)), color: context.error),
                ],
              ),
            );
          }),

          const SizedBox(height: 24),
          // Feedback Menu
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: context.accent.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(LucideIcons.messageSquare, color: context.accent),
            ),
            title: Text('Feedback', style: GoogleFonts.inter(color: context.textPrimary, fontWeight: FontWeight.w600)),
            subtitle: Text('Help us improve NJARA Player', style: GoogleFonts.inter(color: context.textSecondary, fontSize: 13)),
            trailing: Icon(LucideIcons.chevronRight, color: context.textMuted, size: 20),
            onTap: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: context.bgSecondary,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                builder: (context) => const FeedbackSheet(),
              );
            },
          ),
          // Settings Menu
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: context.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(LucideIcons.settings, color: context.primary),
            ),
            title: Text('Settings', style: GoogleFonts.inter(color: context.textPrimary, fontWeight: FontWeight.w600)),
            subtitle: Text('App preferences and account settings', style: GoogleFonts.inter(color: context.textSecondary, fontSize: 13)),
            trailing: Icon(LucideIcons.chevronRight, color: context.textMuted, size: 20),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
            },
          ),
          // Logout Menu
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFF43F5E).withValues(alpha: 0.1), // rose-500
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(LucideIcons.logOut, color: Color(0xFFF43F5E)),
            ),
            title: Text('Logout', style: GoogleFonts.inter(color: const Color(0xFFF43F5E), fontWeight: FontWeight.w600)),
            subtitle: Text('Sign out of your account', style: GoogleFonts.inter(color: context.textSecondary, fontSize: 13)),
            onTap: _handleLogout,
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
