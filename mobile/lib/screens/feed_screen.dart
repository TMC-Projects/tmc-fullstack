import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../providers/feed_provider.dart';
import '../widgets/post_card.dart';
import '../widgets/create_post_sheet.dart';

class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key});

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(feedProvider.notifier).fetchFeed();
    });
  }

  void _showCreatePost() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return const CreatePostSheet();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final feedState = ref.watch(feedProvider);

    return Scaffold(
      backgroundColor: context.bgPrimary, // slate-950
      appBar: AppBar(
        backgroundColor: context.bgPrimary,
        elevation: 0,
        title: Row(
          children: [
            Icon(LucideIcons.rss, color: context.primary),
            const SizedBox(width: 8),
            Text(
              'Feed',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w700,
                color: context.textPrimary,
              ),
            ),
          ],
        ),
      ),
      body: feedState.isLoading && feedState.posts.isEmpty
          ? Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(context.primary), // violet-500
              ),
            )
          : RefreshIndicator(
              color: context.primary,
              onRefresh: () async {
                await ref.read(feedProvider.notifier).fetchFeed();
              },
              child: CustomScrollView(
                slivers: [
                  // Create Post Trigger Header
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: GestureDetector(
                        onTap: _showCreatePost,
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: context.bgSecondary, // slate-900
                            border: Border.all(color: context.border), // slate-800
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 18,
                                backgroundColor: context.border, // slate-800
                                child: Icon(LucideIcons.user, color: context.textMuted, size: 20),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  "What's on your mind? Share your thoughts...",
                                  style: GoogleFonts.inter(
                                    color: context.textMuted,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Error state
                  if (feedState.error != null && feedState.posts.isEmpty)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Center(
                          child: Text(
                            feedState.error!,
                            style: GoogleFonts.inter(color: context.error), // rose-400
                          ),
                        ),
                      ),
                    ),

                  // Empty state
                  if (!feedState.isLoading && feedState.posts.isEmpty && feedState.error == null)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Center(
                          child: Text(
                            'No posts yet. Be the first to share something!',
                            style: GoogleFonts.inter(color: context.textMuted),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                    ),

                  // Feed List
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final post = feedState.posts[index];
                          return PostCard(key: ValueKey(post['ID']), post: post);
                        },
                        childCount: feedState.posts.length,
                      ),
                    ),
                  ),
                  
                  // Bottom Padding
                  const SliverToBoxAdapter(child: SizedBox(height: 24)),
                ],
              ),
            ),
    );
  }
}
