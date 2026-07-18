import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../providers/invitations_provider.dart';

String get _apiUrl => dotenv.env['API_URL'] ?? 'https://api.njara.web.id/api';

class InvitationsScreen extends ConsumerStatefulWidget {
  const InvitationsScreen({super.key});

  @override
  ConsumerState<InvitationsScreen> createState() => _InvitationsScreenState();
}

class _InvitationsScreenState extends ConsumerState<InvitationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(invitationsProvider.notifier).fetchInvitations();
    });
  }

  String _getFullUrl(String path) {
    if (path.startsWith('http')) return path;
    final baseUrl = _apiUrl.replaceAll('/api', '');
    return '$baseUrl$path';
  }

  void _showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: context.error,
    ));
  }

  void _showSuccess(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: context.success,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(invitationsProvider);

    return Scaffold(
      backgroundColor: context.bgPrimary, // slate-950
      appBar: AppBar(
        backgroundColor: context.bgPrimary,
        elevation: 0,
        title: Row(
          children: [
            Icon(LucideIcons.shield, color: context.primary),
            const SizedBox(width: 8),
            Text(
              'Team Invitations',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w700,
                color: context.textPrimary,
              ),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(invitationsProvider.notifier).fetchInvitations(),
        color: context.primary,
        child: _buildBody(context, ref, state),
      ),
    );
  }

  Widget _buildBody(BuildContext context, WidgetRef ref, InvitationsState state) {
    if (state.isLoading && state.invitations.isEmpty) {
      return Center(child: CircularProgressIndicator(color: context.accent));
    }

    if (state.error != null && state.invitations.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(state.error!, style: GoogleFonts.inter(color: context.error)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(invitationsProvider.notifier).fetchInvitations(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final pendingInvitations = state.invitations.where((i) => i['Status'] == 'pending' || i['status'] == 'pending').toList();

    if (pendingInvitations.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          Container(
            margin: const EdgeInsets.all(24),
            padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
            decoration: BoxDecoration(
              color: context.bgSecondary, // slate-900
              border: Border.all(color: context.border), // slate-800
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(LucideIcons.shield, size: 48, color: context.borderHighlight), // slate-700
                const SizedBox(height: 16),
                Text(
                  'No invitations yet',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: context.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Currently, there are no teams or clubs inviting you.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(color: context.textMuted),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: pendingInvitations.length,
      itemBuilder: (context, index) {
        final inv = pendingInvitations[index];
        final invId = inv['ID'] ?? inv['id'];
        final isProcessing = state.processingId != null && state.processingId == invId;
        
        final club = inv['Club'] ?? inv['club'] ?? {};
        final team = inv['Team'] ?? inv['team'];
        
        final displayName = (team != null && team['name'] != null) ? team['name'] : (club['Name'] ?? club['name'] ?? 'Unknown');
        final logoUrl = club['LogoUrl'] ?? club['logo_url'];
        final initial = displayName.toString().isNotEmpty ? displayName.toString().substring(0, 1).toUpperCase() : 'U';

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: context.bgSecondary,
            border: Border.all(color: context.border),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: context.border,
                      borderRadius: BorderRadius.circular(16),
                      image: logoUrl != null && logoUrl.toString().isNotEmpty
                          ? DecorationImage(
                              image: CachedNetworkImageProvider(_getFullUrl(logoUrl)),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: (logoUrl == null || logoUrl.toString().isEmpty)
                        ? Center(child: Text(initial, style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: context.textSecondary)))
                        : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          displayName,
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: context.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(LucideIcons.clock, size: 14, color: context.textMuted),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                'Invites you to join.',
                                style: GoogleFonts.inter(color: context.textSecondary, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: isProcessing ? null : () {
                        ref.read(invitationsProvider.notifier).respondToInvitation(
                          inv['ID'] ?? inv['id'],
                          false,
                          onSuccess: () => _showSuccess(context, 'Invitation rejected.'),
                          onError: (err) => _showError(context, err),
                        );
                      },
                      icon: const Icon(LucideIcons.x, size: 16),
                      label: Text('Reject', style: GoogleFonts.inter()),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: context.error, // rose-600
                        side: BorderSide(color: context.error),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: isProcessing ? null : () {
                        ref.read(invitationsProvider.notifier).respondToInvitation(
                          inv['ID'] ?? inv['id'],
                          true,
                          onSuccess: () => _showSuccess(context, 'Invitation accepted!'),
                          onError: (err) => _showError(context, err),
                        );
                      },
                      icon: isProcessing 
                          ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: context.textPrimary))
                          : const Icon(LucideIcons.check, size: 16),
                      label: Text(isProcessing ? '' : 'Accept', style: GoogleFonts.inter()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.success, // emerald-500
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
        );
      },
    );
  }
}
