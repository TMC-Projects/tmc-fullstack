import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http_parser/http_parser.dart';

String get _apiUrl => dotenv.env['API_URL'] ?? 'https://api.njara.web.id/api';

class FeedState {
  final bool isLoading;
  final String? error;
  final List<dynamic> posts;

  FeedState({
    this.isLoading = false,
    this.error,
    this.posts = const [],
  });

  FeedState copyWith({
    bool? isLoading,
    String? error,
    List<dynamic>? posts,
  }) {
    return FeedState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      posts: posts ?? this.posts,
    );
  }
}

class FeedNotifier extends Notifier<FeedState> {
  @override
  FeedState build() {
    return FeedState();
  }

  Future<void> fetchFeed() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (token == null) throw Exception('Not authenticated');

      final response = await http.get(
        Uri.parse('$_apiUrl/b2c/posts'),
        headers: {'Authorization': 'Bearer $token'},
      );

      final data = jsonDecode(response.body);
      if (response.statusCode != 200) {
        throw Exception(data['message'] ?? 'Failed to fetch feed');
      }

      state = state.copyWith(
        isLoading: false,
        posts: data['data'] ?? [],
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceAll('Exception: ', ''),
      );
    }
  }

  Future<void> createPost(String content, {required Function(String) onSuccess, required Function(String) onError}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (token == null) throw Exception('Not authenticated');

      final response = await http.post(
        Uri.parse('$_apiUrl/b2c/posts'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'content': content, 'Content': content}),
      );

      dynamic data;
      try {
        data = jsonDecode(response.body);
      } catch (e) {
        throw Exception('Server error ${response.statusCode}: ${response.body.length > 50 ? response.body.substring(0, 50) : response.body}');
      }
      
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception(data['message'] ?? 'Failed to create post. Code: ${response.statusCode}');
      }

      onSuccess(data['message'] ?? 'Post created successfully!');
      fetchFeed(); // Refresh feed
    } catch (e) {
      onError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> toggleLike(int postId, bool isCurrentlyLiked) async {
    // Optimistic UI update
    final prevPosts = state.posts;
    state = state.copyWith(
      posts: prevPosts.map((p) {
        if (p['ID'] == postId) {
          return Map<String, dynamic>.from(p)..addAll({
            'IsLiked': !isCurrentlyLiked,
            'LikeCount': isCurrentlyLiked ? (p['LikeCount'] ?? 1) - 1 : (p['LikeCount'] ?? 0) + 1,
          });
        }
        return p;
      }).toList(),
    );

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (token == null) throw Exception('Not authenticated');

      final response = await http.post(
        Uri.parse('$_apiUrl/b2c/posts/$postId/like'),
        headers: {'Authorization': 'Bearer $token'},
      );

      final data = jsonDecode(response.body);
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception(data['message'] ?? 'Failed to toggle like');
      }

      // Sync exact state from server
      final isLikedServer = data['data']['is_liked'];
      state = state.copyWith(
        posts: state.posts.map((p) {
          if (p['ID'] == postId) {
            return Map<String, dynamic>.from(p)..addAll({
              'IsLiked': isLikedServer,
              // We assume our optimistic LikeCount calculation was mostly correct, but if we wanted to be perfectly in sync we'd need the server to return the new LikeCount.
            });
          }
          return p;
        }).toList(),
      );
    } catch (e) {
      // Revert on failure
      state = state.copyWith(posts: prevPosts);
    }
  }

  Future<void> deletePost(int postId, {required Function() onSuccess, required Function(String) onError}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (token == null) throw Exception('Not authenticated');

      final response = await http.delete(
        Uri.parse('$_apiUrl/b2c/posts/$postId'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode != 200) {
        final data = jsonDecode(response.body);
        throw Exception(data['message'] ?? 'Failed to delete post');
      }

      state = state.copyWith(
        posts: state.posts.where((p) => p['ID'] != postId).toList(),
      );
      fetchFeed();
      onSuccess();
    } catch (e) {
      onError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<String?> uploadPostImage(String filePath) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (token == null) throw Exception('Not authenticated');

      final request = http.MultipartRequest('POST', Uri.parse('$_apiUrl/b2c/posts/upload-image'));
      request.headers['Authorization'] = 'Bearer $token';
      
      MediaType mediaType;
      String ext = filePath.split('.').last.toLowerCase();
      if (ext == 'jpg' || ext == 'jpeg') {
        mediaType = MediaType('image', 'jpeg');
      } else if (ext == 'png') {
        mediaType = MediaType('image', 'png');
      } else if (ext == 'webp') {
        mediaType = MediaType('image', 'webp');
      } else {
        mediaType = MediaType('image', 'jpeg');
      }

      request.files.add(await http.MultipartFile.fromPath(
        'image', 
        filePath,
        contentType: mediaType,
      ));
      
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        if (data['success'] == true && data['data'] != null && data['data']['url'] != null) {
          String url = data['data']['url'];
          // Ensure it's a full URL if it's relative
          if (!url.startsWith('http')) {
             final baseUrl = _apiUrl.replaceAll('/api', '');
             url = '$baseUrl$url';
          }
          return url;
        }
      }
      return null;
    } catch (e) {
      print('Upload post image error: $e');
      return null;
    }
  }
}

final feedProvider = NotifierProvider<FeedNotifier, FeedState>(() {
  return FeedNotifier();
});
