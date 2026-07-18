import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http_parser/http_parser.dart';

String get _apiUrl => dotenv.env['API_URL'] ?? 'https://api.njara.web.id/api';

class ProfileState {
  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? profileData;
  final int followersCount;
  final int followingCount;

  ProfileState({
    this.isLoading = false,
    this.error,
    this.profileData,
    this.followersCount = 0,
    this.followingCount = 0,
  });

  ProfileState copyWith({
    bool? isLoading,
    String? error,
    Map<String, dynamic>? profileData,
    int? followersCount,
    int? followingCount,
  }) {
    return ProfileState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      profileData: profileData ?? this.profileData,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
    );
  }
}

class ProfileNotifier extends Notifier<ProfileState> {
  @override
  ProfileState build() {
    return ProfileState();
  }

  Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token');
    if (token == null || token.isEmpty) {
      throw Exception('Not authenticated');
    }
    return token;
  }

  dynamic _safeDecode(http.Response res) {
    try {
      return jsonDecode(res.body);
    } catch (_) {
      throw Exception('Server error ${res.statusCode}: ${res.body.length > 50 ? res.body.substring(0, 50) : res.body}');
    }
  }

  Future<void> fetchProfile() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final token = await _getToken();
      
      final res = await http.get(
        Uri.parse('$_apiUrl/profile'),
        headers: {'Authorization': 'Bearer $token'},
      );

      final data = _safeDecode(res);
      if (res.statusCode != 200) {
        throw Exception(data['message'] ?? 'Failed to fetch profile. Code: ${res.statusCode}');
      }

      final profile = data['data'];
      int followers = 0;
      int following = 0;

      // Try fetching followers count
      if (profile != null && profile['id'] != null) {
        try {
          final countRes = await http.get(
            Uri.parse('$_apiUrl/b2c/players/${profile['id']}'),
            headers: {'Authorization': 'Bearer $token'},
          );
          if (countRes.statusCode == 200) {
            final countData = jsonDecode(countRes.body);
            followers = countData['data']?['followers_count'] ?? 0;
            following = countData['data']?['following_count'] ?? 0;
          }
        } catch (_) {}
      }

      state = state.copyWith(
        isLoading: false,
        profileData: profile,
        followersCount: followers,
        followingCount: following,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceAll('Exception: ', ''),
      );
    }
  }

  Future<void> updateBasicProfile(Map<String, dynamic> formData, {required Function(String) onSuccess, required Function(String) onError}) async {
    try {
      final token = await _getToken();
      final res = await http.put(
        Uri.parse('$_apiUrl/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(formData),
      );

      final data = _safeDecode(res);
      if (res.statusCode != 200) {
        throw Exception(data['message'] ?? 'Failed to update profile. Code: ${res.statusCode}');
      }

      onSuccess(data['message'] ?? 'Profile updated successfully!');
      fetchProfile();
    } catch (e) {
      onError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> updatePassword(Map<String, dynamic> formData, {required Function(String) onSuccess, required Function(String) onError}) async {
    try {
      final token = await _getToken();
      final res = await http.put(
        Uri.parse('$_apiUrl/profile/password'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(formData),
      );

      final data = _safeDecode(res);
      if (res.statusCode != 200) {
        throw Exception(data['message'] ?? 'Failed to update password. Code: ${res.statusCode}');
      }

      onSuccess(data['message'] ?? 'Password updated successfully!');
    } catch (e) {
      onError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> uploadAvatar(String filePath, {required Function(String) onSuccess, required Function(String) onError}) async {
    try {
      final token = await _getToken();
      final request = http.MultipartRequest('POST', Uri.parse('$_apiUrl/profile/upload-photo'));
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
        mediaType = MediaType('image', 'jpeg'); // fallback
      }

      request.files.add(await http.MultipartFile.fromPath(
        'photo', 
        filePath,
        contentType: mediaType,
      ));
      
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      final data = _safeDecode(response);
      if (response.statusCode != 200) {
        throw Exception(data['message'] ?? 'Failed to upload photo. Code: ${response.statusCode}');
      }

      onSuccess(data['message'] ?? 'Photo uploaded successfully!');
      fetchProfile();
    } catch (e) {
      onError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> saveItem(String endpoint, Map<String, dynamic> formData, int? id, {required Function(String) onSuccess, required Function(String) onError}) async {
    try {
      final token = await _getToken();
      final url = id != null ? '$_apiUrl/profile/$endpoint/$id' : '$_apiUrl/profile/$endpoint';
      final res = id != null 
          ? await http.put(Uri.parse(url), headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'}, body: jsonEncode(formData))
          : await http.post(Uri.parse(url), headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'}, body: jsonEncode(formData));

      final data = _safeDecode(res);
      if (res.statusCode != 200 && res.statusCode != 201) {
        throw Exception(data['message'] ?? 'Failed to save item. Code: ${res.statusCode}');
      }

      onSuccess(data['message'] ?? 'Saved successfully!');
      fetchProfile();
    } catch (e) {
      onError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> deleteItem(String endpoint, int id, {required Function(String) onSuccess, required Function(String) onError}) async {
    try {
      final token = await _getToken();
      final res = await http.delete(
        Uri.parse('$_apiUrl/profile/$endpoint/$id'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (res.statusCode != 200) {
        final data = _safeDecode(res);
        throw Exception(data['message'] ?? 'Failed to delete item. Code: ${res.statusCode}');
      }

      onSuccess('Deleted successfully!');
      fetchProfile();
    } catch (e) {
      onError(e.toString().replaceAll('Exception: ', ''));
    }
  }
}

final profileProvider = NotifierProvider<ProfileNotifier, ProfileState>(() => ProfileNotifier());
