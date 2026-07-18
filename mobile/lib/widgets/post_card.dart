import 'dart:convert';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/feed_provider.dart';
import '../providers/auth_provider.dart';
import '../screens/player_detail_screen.dart';

String get _apiUrl => dotenv.env['API_URL'] ?? 'https://api.njara.web.id/api';

String _getFullUrl(String? path) {
  if (path == null || path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  final domain = _apiUrl.replaceAll('/api', '');
  return '$domain$path';
}

String timeAgo(String? dateStr) {
  if (dateStr == null) return '';
  try {
    final date = DateTime.parse(dateStr).toLocal();
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 365) return '${(diff.inDays / 365).floor()}y';
    if (diff.inDays > 30) return '${(diff.inDays / 30).floor()}mo';
    if (diff.inDays > 0) return '${diff.inDays}d';
    if (diff.inHours > 0) return '${diff.inHours}h';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m';
    return 'Just now';
  } catch (e) {
    return '';
  }
}

class PostCard extends ConsumerStatefulWidget {
  final Map<String, dynamic> post;
  
  const PostCard({super.key, required this.post});

  @override
  ConsumerState<PostCard> createState() => _PostCardState();
}

class _PostCardState extends ConsumerState<PostCard> {
  void _openComments() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return _CommentSheet(postId: widget.post['ID']);
      },
    );
  }

  void _handleLike() {
    final isLiked = widget.post['IsLiked'] == true;
    ref.read(feedProvider.notifier).toggleLike(widget.post['ID'], isLiked);
  }

  void _handleDelete() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: context.bgSecondary,
        title: Text('Delete Post?', style: GoogleFonts.inter(color: context.textPrimary)),
        content: Text('Are you sure you want to delete this post?', style: GoogleFonts.inter(color: context.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: GoogleFonts.inter(color: context.textSecondary)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(feedProvider.notifier).deletePost(
                widget.post['ID'],
                onSuccess: () {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Post deleted'), backgroundColor: context.success),
                    );
                  }
                },
                onError: (err) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(err), backgroundColor: context.error),
                    );
                  }
                },
              );
            },
            child: Text('Delete', style: GoogleFonts.inter(color: context.error, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  List<TextSpan> _buildTextSpans(String text) {
    final spans = <TextSpan>[];
    final regex = RegExp(r'(@[\w.-]+)');
    final matches = regex.allMatches(text);
    
    int lastMatchEnd = 0;
    for (final match in matches) {
      if (match.start > lastMatchEnd) {
        spans.add(TextSpan(text: text.substring(lastMatchEnd, match.start)));
      }
      spans.add(TextSpan(
        text: match.group(0),
        style: TextStyle(color: context.primary, fontWeight: FontWeight.w600),
      ));
      lastMatchEnd = match.end;
    }
    if (lastMatchEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastMatchEnd)));
    }
    
    return spans;
  }

  @override
  Widget build(BuildContext context) {
    final author = widget.post['User'] ?? {};
    final isLiked = widget.post['IsLiked'] == true;
    
    final authState = ref.watch(authProvider);
    final currentUserId = authState.user?['id'] ?? authState.user?['ID'];
    final postUserId = widget.post['UserID'];
    final isOwner = currentUserId != null && postUserId != null && currentUserId == postUserId;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.bgSecondary,
        border: Border.all(color: context.border),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: isOwner ? null : () {
                  final userId = widget.post['UserID'];
                  if (userId != null) {
                    Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => PlayerDetailScreen(
                        userId: userId,
                        preloadName: author['FullName'],
                        preloadAvatar: author['ProfilePictureUrl'],
                      ),
                    ));
                  }
                },
                child: CircleAvatar(
                  radius: 20,
                  backgroundColor: context.border,
                  backgroundImage: author['ProfilePictureUrl'] != null && author['ProfilePictureUrl'].isNotEmpty
                      ? CachedNetworkImageProvider(_getFullUrl(author['ProfilePictureUrl']))
                      : null,
                  child: (author['ProfilePictureUrl'] == null || author['ProfilePictureUrl'].isEmpty)
                      ? Text(
                          author['FullName']?.substring(0, 1).toUpperCase() ?? 'U',
                          style: GoogleFonts.inter(color: context.textPrimary),
                        )
                      : null,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: isOwner ? null : () {
                    final userId = widget.post['UserID'];
                    if (userId != null) {
                      Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => PlayerDetailScreen(
                          userId: userId,
                          preloadName: author['FullName'],
                          preloadAvatar: author['ProfilePictureUrl'],
                        ),
                      ));
                    }
                  },
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        author['FullName'] ?? 'Unknown User',
                        style: GoogleFonts.inter(
                          color: context.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      Text(
                        '@${author['Username'] ?? 'username'} · ${timeAgo(widget.post['CreatedAt'])}',
                        style: GoogleFonts.inter(
                          color: context.textMuted,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (isOwner)
                IconButton(
                  icon: Icon(LucideIcons.trash2, size: 18, color: context.textMuted),
                  onPressed: _handleDelete,
                  tooltip: 'Delete Post',
                ),
            ],
          ),
          const SizedBox(height: 12),
          Html(
            data: (widget.post['Content'] as String?)?.replaceAll('src="/', 'src="${_apiUrl.replaceAll('/api', '')}/"') ?? '',
            style: {
              "body": Style(
                margin: Margins.zero,
                padding: HtmlPaddings.zero,
                color: context.textPrimary,
                fontSize: FontSize(15),
                fontFamily: 'Inter',
                lineHeight: LineHeight(1.5),
              ),
              "p": Style(
                margin: Margins.only(bottom: 8),
              ),
            },
            extensions: [
              TagExtension(
                tagsToExtend: {"img"},
                builder: (extensionContext) {
                  final src = extensionContext.attributes['src'];
                  if (src == null) return const SizedBox();
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8.0),
                    child: GestureDetector(
                      onTap: () {
                        Navigator.of(context).push(MaterialPageRoute(
                          builder: (ctx) => Scaffold(
                            backgroundColor: Colors.black,
                            appBar: AppBar(
                              backgroundColor: Colors.transparent,
                              elevation: 0,
                              iconTheme: IconThemeData(color: context.textPrimary),
                            ),
                            extendBodyBehindAppBar: true,
                            body: Center(
                              child: InteractiveViewer(
                                minScale: 0.5,
                                maxScale: 4.0,
                                child: CachedNetworkImage(
                                  imageUrl: src,
                                  fit: BoxFit.contain,
                                  placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                                  errorWidget: (context, url, error) => Center(child: Icon(LucideIcons.imageOff, color: context.textMuted, size: 48)),
                                ),
                              ),
                            ),
                          ),
                        ));
                      },
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: CachedNetworkImage(
                          imageUrl: src,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            height: 200,
                            color: context.border,
                            child: const Center(child: CircularProgressIndicator()),
                          ),
                          errorWidget: (context, url, error) => Container(
                            height: 200,
                            color: context.border,
                            child: Center(child: Icon(LucideIcons.imageOff, color: context.textMuted)),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          Divider(color: context.border, height: 1),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildActionButton(
                icon: isLiked ? LucideIcons.heart : LucideIcons.heart,
                label: '${widget.post['LikeCount'] ?? 0}',
                color: isLiked ? Color(0xFFF43F5E) : context.textSecondary,
                onTap: _handleLike,
              ),
              const SizedBox(width: 24),
              _buildActionButton(
                icon: LucideIcons.messageCircle,
                label: '${widget.post['CommentCount'] ?? 0}',
                color: context.textSecondary,
                onTap: _openComments,
              ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildActionButton({required IconData icon, required String label, required Color color, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: GoogleFonts.inter(color: color, fontWeight: FontWeight.w600, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

// ==========================================
// COMMENTS SHEET
// ==========================================

class _CommentSheet extends ConsumerStatefulWidget {
  final int postId;
  const _CommentSheet({required this.postId});

  @override
  ConsumerState<_CommentSheet> createState() => _CommentSheetState();
}

class _CommentSheetState extends ConsumerState<_CommentSheet> {
  final _commentController = TextEditingController();
  List<dynamic> _comments = [];
  List<dynamic> _interactors = [];
  bool _isLoading = true;
  bool _isSubmitting = false;

  // Tagging state
  bool _showSuggestions = false;
  String _mentionQuery = '';
  int _mentionIndex = -1;

  @override
  void initState() {
    super.initState();
    _fetchComments();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _fetchComments() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      final res = await http.get(
        Uri.parse('$_apiUrl/b2c/posts/${widget.postId}/comments'),
        headers: {'Authorization': 'Bearer $token'},
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        if (mounted) setState(() => _comments = data['data'] ?? []);
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _fetchInteractors() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      final res = await http.get(
        Uri.parse('$_apiUrl/b2c/posts/${widget.postId}/interactors'),
        headers: {'Authorization': 'Bearer $token'},
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        if (mounted) setState(() => _interactors = data['data'] ?? []);
      }
    } catch (_) {}
  }

  void _onCommentChanged(String value) {
    final cursorPosition = _commentController.selection.base.offset;
    if (cursorPosition < 0) return;
    
    final textBeforeCursor = value.substring(0, cursorPosition);
    final lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex != -1) {
      final textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Valid mention query shouldn't have spaces
      if (!textAfterAt.contains(' ')) {
        setState(() {
          _mentionQuery = textAfterAt;
          _mentionIndex = lastAtIndex;
          _showSuggestions = true;
        });
        if (_interactors.isEmpty) {
          _fetchInteractors();
        }
        return;
      }
    }
    
    if (_showSuggestions) setState(() => _showSuggestions = false);
  }

  void _insertMention(String mentionName) {
    final text = _commentController.text;
    final textBeforeMention = text.substring(0, _mentionIndex);
    final textAfterCursor = text.substring(_mentionIndex + _mentionQuery.length + 1);
    
    final newText = '$textBeforeMention@$mentionName $textAfterCursor';
    
    setState(() {
      _commentController.text = newText;
      _commentController.selection = TextSelection.collapsed(offset: _mentionIndex + mentionName.length + 2);
      _showSuggestions = false;
    });
  }

  Future<void> _submitComment() async {
    if (_commentController.text.trim().isEmpty) return;
    setState(() => _isSubmitting = true);
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      final res = await http.post(
        Uri.parse('$_apiUrl/b2c/posts/${widget.postId}/comments'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'content': _commentController.text.trim(), 'Content': _commentController.text.trim()}),
      );

      dynamic data;
      try {
        data = jsonDecode(res.body);
      } catch (e) {
        throw Exception('Server error ${res.statusCode}: ${res.body.length > 50 ? res.body.substring(0, 50) : res.body}');
      }

      if (res.statusCode == 200 || res.statusCode == 201) {
        _commentController.clear();
        await _fetchComments();
      } else {
        throw Exception(data['message'] ?? 'Failed to submit comment. Code: ${res.statusCode}');
      }
    } catch (e) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: context.border,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Row(
              children: [
                Icon(LucideIcons.alertCircle, color: context.error),
                const SizedBox(width: 12),
                Text('Error', style: GoogleFonts.inter(color: context.textPrimary, fontWeight: FontWeight.bold)),
              ],
            ),
            content: Text(
              e.toString().replaceAll('Exception: ', ''),
              style: GoogleFonts.inter(color: context.textPrimary),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: Text('OK', style: GoogleFonts.inter(color: context.primary, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );
      }
    }
    if (mounted) setState(() => _isSubmitting = false);
  }

  void _openPlayerProfile(BuildContext context, int userId, {String? name, String? avatar}) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => PlayerDetailScreen(userId: userId, preloadName: name, preloadAvatar: avatar),
    ));
  }

  void _openPlayerProfileByUsername(BuildContext context, String username) {
    // /api/b2c/players/:id also accepts username string
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => PlayerDetailScreen(userId: 0, preloadUsername: username),
    ));
  }

  List<InlineSpan> _buildClickableTextSpans(String text, int? currentUserId) {
    final spans = <InlineSpan>[];
    final regex = RegExp(r'(@[\w.-]+)');
    final matches = regex.allMatches(text);

    int lastMatchEnd = 0;
    for (final match in matches) {
      if (match.start > lastMatchEnd) {
        spans.add(TextSpan(text: text.substring(lastMatchEnd, match.start)));
      }
      final mention = match.group(0)!; // e.g. "@john"
      final mentionUsername = mention.substring(1); // strip @
      // Check if this mention is the logged-in user themselves
      final matchedInteractor = _interactors.firstWhere(
        (i) => (i['Username'] ?? '').toString().toLowerCase() == mentionUsername.toLowerCase(),
        orElse: () => null,
      );
      final mentionUserId = matchedInteractor != null ? matchedInteractor['ID'] : null;
      final isSelf = currentUserId != null && mentionUserId != null && currentUserId == mentionUserId;

      spans.add(TextSpan(
        text: mention,
        style: TextStyle(color: context.primary, fontWeight: FontWeight.w600),
        recognizer: isSelf ? null : (TapGestureRecognizer()
          ..onTap = () {
            if (mentionUserId != null) {
              _openPlayerProfile(context, mentionUserId,
                  name: matchedInteractor?['FullName'],
                  avatar: matchedInteractor?['ProfilePictureUrl']);
            } else {
              _openPlayerProfileByUsername(context, mentionUsername);
            }
          }),
      ));
      lastMatchEnd = match.end;
    }
    if (lastMatchEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastMatchEnd)));
    }
    return spans;
  }

  List<TextSpan> _buildTextSpans(String text) {
    final spans = <TextSpan>[];
    final regex = RegExp(r'(@[\w.-]+)');
    final matches = regex.allMatches(text);
    
    int lastMatchEnd = 0;
    for (final match in matches) {
      if (match.start > lastMatchEnd) {
        spans.add(TextSpan(text: text.substring(lastMatchEnd, match.start)));
      }
      spans.add(TextSpan(
        text: match.group(0),
        style: TextStyle(color: context.primary, fontWeight: FontWeight.w600),
      ));
      lastMatchEnd = match.end;
    }
    if (lastMatchEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastMatchEnd)));
    }
    return spans;
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    
    final filteredInteractors = _interactors.where((i) {
      final uname = (i['Username'] ?? '').toString().toLowerCase();
      return uname.contains(_mentionQuery.toLowerCase());
    }).toList();

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        decoration: BoxDecoration(
          color: context.bgSecondary,
          borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
        ),
        padding: const EdgeInsets.only(top: 16, bottom: 8),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.6,
        ),
        child: Column(
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: context.borderHighlight,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Comments',
            style: GoogleFonts.inter(color: context.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          Divider(color: context.border, height: 32),
          
          Expanded(
            child: _isLoading 
              ? Center(child: CircularProgressIndicator(color: context.accent))
              : _comments.isEmpty
                ? Center(child: Text('No comments yet.', style: GoogleFonts.inter(color: context.textMuted)))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _comments.length,
                    itemBuilder: (context, index) {
                      final comment = _comments[index];
                      final author = comment['User'] ?? {};
                      final authorId = author['ID'];
                      final authState = ref.read(authProvider);
                      final currentUserId = authState.user?['id'] ?? authState.user?['ID'];
                      final isMe = currentUserId != null && authorId != null && currentUserId == authorId;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            GestureDetector(
                              onTap: isMe ? null : () {
                                if (authorId != null) {
                                  _openPlayerProfile(
                                    context,
                                    authorId,
                                    name: author['FullName'],
                                    avatar: author['ProfilePictureUrl'],
                                  );
                                }
                              },
                              child: CircleAvatar(
                                radius: 16,
                                backgroundColor: context.border,
                                backgroundImage: author['ProfilePictureUrl'] != null && author['ProfilePictureUrl'].isNotEmpty
                                    ? CachedNetworkImageProvider(_getFullUrl(author['ProfilePictureUrl']))
                                    : null,
                                child: (author['ProfilePictureUrl'] == null || author['ProfilePictureUrl'].isEmpty)
                                    ? Text(
                                        author['FullName']?.substring(0, 1).toUpperCase() ?? 'U',
                                        style: GoogleFonts.inter(color: context.textPrimary, fontSize: 12),
                                      )
                                    : null,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: context.border,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          author['FullName'] ?? 'User',
                                          style: GoogleFonts.inter(color: context.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          timeAgo(comment['CreatedAt']),
                                          style: GoogleFonts.inter(color: context.textMuted, fontSize: 12),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    RichText(
                                      text: TextSpan(
                                        style: GoogleFonts.inter(color: context.textPrimary, fontSize: 14, height: 1.4),
                                        children: _buildClickableTextSpans(comment['Content'] ?? '', currentUserId),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          
          // Tagging Suggestions
          if (_showSuggestions && filteredInteractors.isNotEmpty)
            Container(
              constraints: const BoxConstraints(maxHeight: 150),
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: context.border,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: context.borderHighlight),
              ),
              child: ListView.builder(
                shrinkWrap: true,
                padding: EdgeInsets.zero,
                itemCount: filteredInteractors.length,
                itemBuilder: (context, index) {
                  final user = filteredInteractors[index];
                  return ListTile(
                    dense: true,
                    leading: CircleAvatar(
                      radius: 12,
                      backgroundColor: context.borderHighlight,
                      child: Text(user['FullName']?.substring(0, 1) ?? 'U', style: TextStyle(fontSize: 10, color: context.textPrimary)),
                    ),
                    title: Text(user['FullName'] ?? '', style: GoogleFonts.inter(color: context.textPrimary, fontSize: 14)),
                    subtitle: Text('@${user['Username']}', style: GoogleFonts.inter(color: context.textMuted, fontSize: 12)),
                    onTap: () => _insertMention(user['Username']),
                  );
                },
              ),
            ),
          
          // Input Area
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: context.border)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    onChanged: _onCommentChanged,
                    style: GoogleFonts.inter(color: context.textPrimary),
                    decoration: InputDecoration(
                      hintText: 'Add a comment...',
                      hintStyle: GoogleFonts.inter(color: context.textMuted),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                      filled: true,
                      fillColor: context.border,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: context.primary, // violet-500
                  ),
                  child: IconButton(
                    icon: _isSubmitting 
                        ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: context.textPrimary, strokeWidth: 2))
                        : Icon(LucideIcons.send, color: context.textPrimary, size: 20),
                    onPressed: _isSubmitting ? null : _submitComment,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
  }
}
