import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

String get _apiUrl => dotenv.env['API_URL'] ?? 'http://localhost:3000/api';

class AuthState {
  final bool isLoading;
  final String? error;
  final String? token;
  final Map<String, dynamic>? user;

  AuthState({this.isLoading = false, this.error, this.token, this.user});

  AuthState copyWith({bool? isLoading, String? error, String? token, Map<String, dynamic>? user}) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      token: token ?? this.token,
      user: user ?? this.user,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    return AuthState();
  }

  Future<void> checkAuth() async {
    state = state.copyWith(isLoading: true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      if (token != null && token.isNotEmpty) {
        // Optionally validate with backend
        final response = await http.get(
          Uri.parse('$_apiUrl/profile'),
          headers: {'Authorization': 'Bearer $token'},
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          state = state.copyWith(isLoading: false, token: token, user: data['data']);
          return;
        } else {
          // Token invalid or expired
          await prefs.remove('jwt_token');
        }
      }
      state = state.copyWith(isLoading: false, token: null);
    } catch (e) {
      state = state.copyWith(isLoading: false, token: null);
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await http.post(
        Uri.parse('$_apiUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode != 200) {
        throw Exception(data['message'] ?? 'Invalid credentials.');
      }

      final user = data['data']['user'];
      final category = user['category'];

      // B2B roles rejection logic (mirroring B2C web portal)
      const b2bRoles = ['owner', 'manager', 'staff', 'ba'];
      if (b2bRoles.contains(category)) {
        throw Exception('This platform is for B2C Player accounts only. Please use the B2B Club Portal for your account.');
      }

      final token = data['data']['token'];
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('jwt_token', token);

      state = state.copyWith(isLoading: false, token: token, user: user);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString().replaceAll('Exception: ', ''));
      rethrow;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    state = AuthState();
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});
