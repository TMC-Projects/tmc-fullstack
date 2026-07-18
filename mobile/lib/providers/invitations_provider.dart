import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

String get _apiUrl => dotenv.env['API_URL'] ?? 'https://api.njara.web.id/api';

class InvitationsState {
  final bool isLoading;
  final String? error;
  final List<dynamic> invitations;
  final int? processingId;

  InvitationsState({
    this.isLoading = false,
    this.error,
    this.invitations = const [],
    this.processingId,
  });

  InvitationsState copyWith({
    bool? isLoading,
    String? error,
    List<dynamic>? invitations,
    int? processingId,
    bool clearProcessingId = false,
    bool clearError = false,
  }) {
    return InvitationsState(
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      invitations: invitations ?? this.invitations,
      processingId: clearProcessingId ? null : (processingId ?? this.processingId),
    );
  }
}

class InvitationsNotifier extends Notifier<InvitationsState> {
  @override
  InvitationsState build() {
    return InvitationsState();
  }

  Future<void> fetchInvitations() async {
    print('Fetching invitations...');
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (token == null) throw Exception('Not authenticated');

      print('Calling API: $_apiUrl/b2c/invitations');
      final response = await http.get(
        Uri.parse('$_apiUrl/b2c/invitations'),
        headers: {'Authorization': 'Bearer $token'},
      );
      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        state = state.copyWith(
          isLoading: false,
          invitations: data['data'] ?? [],
        );
        print('Success. Invitations count: ${state.invitations.length}');
      } else {
        throw Exception(data['message'] ?? 'Failed to load invitations');
      }
    } catch (e, st) {
      print('Error in fetchInvitations: $e');
      print('Stacktrace: $st');
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceAll('Exception: ', ''),
      );
    }
  }

  Future<void> respondToInvitation(int id, bool accept, {required Function() onSuccess, required Function(String) onError}) async {
    state = state.copyWith(processingId: id);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (token == null) throw Exception('Not authenticated');

      final response = await http.post(
        Uri.parse('$_apiUrl/b2c/invitations/$id/respond'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'accept': accept}),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        state = state.copyWith(
          invitations: state.invitations.where((i) {
            final iId = i['ID'] ?? i['id'];
            return iId != id;
          }).toList(),
          clearProcessingId: true,
        );
        onSuccess();
      } else {
        throw Exception(data['message'] ?? 'Failed to respond to invitation');
      }
    } catch (e) {
      state = state.copyWith(clearProcessingId: true);
      onError(e.toString().replaceAll('Exception: ', ''));
    }
  }
}

final invitationsProvider = NotifierProvider<InvitationsNotifier, InvitationsState>(() {
  return InvitationsNotifier();
});
