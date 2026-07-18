import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

String get _apiUrl => dotenv.env['API_URL'] ?? 'http://localhost:3000/api';
String get _apiKey => dotenv.env['PUBLIC_GLOBAL_API_KEY'] ?? '';

class DashboardState {
  final bool isLoading;
  final String? error;
  final List<dynamic> clubs;
  final List<dynamic> trials;
  final int? applyingTrialId;

  DashboardState({
    this.isLoading = false,
    this.error,
    this.clubs = const [],
    this.trials = const [],
    this.applyingTrialId,
  });

  DashboardState copyWith({
    bool? isLoading,
    String? error,
    List<dynamic>? clubs,
    List<dynamic>? trials,
    int? applyingTrialId,
    bool clearApplying = false,
  }) {
    return DashboardState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      clubs: clubs ?? this.clubs,
      trials: trials ?? this.trials,
      applyingTrialId: clearApplying ? null : (applyingTrialId ?? this.applyingTrialId),
    );
  }
}

class DashboardNotifier extends Notifier<DashboardState> {
  @override
  DashboardState build() {
    return DashboardState();
  }

  Future<void> fetchDashboardData() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final headers = {'X-API-Key': _apiKey};

      final clubsFuture = http.get(Uri.parse('$_apiUrl/global/clubs'), headers: headers);
      final trialsFuture = http.get(Uri.parse('$_apiUrl/global/trials?status=PUBLISHED'), headers: headers);

      final responses = await Future.wait([clubsFuture, trialsFuture]);

      final clubsResponse = responses[0];
      final trialsResponse = responses[1];

      if (clubsResponse.statusCode != 200 || trialsResponse.statusCode != 200) {
        throw Exception('Failed to fetch dashboard data');
      }

      final clubsData = jsonDecode(clubsResponse.body);
      final trialsData = jsonDecode(trialsResponse.body);

      state = state.copyWith(
        isLoading: false,
        clubs: clubsData['data'] ?? [],
        trials: trialsData['data']?['items'] ?? [],
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceAll('Exception: ', ''),
      );
    }
  }

  Future<void> applyForTrial(int trialId, {required Function(String) onSuccess, required Function(String) onError}) async {
    state = state.copyWith(applyingTrialId: trialId);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (token == null) throw Exception('Not authenticated');

      final response = await http.post(
        Uri.parse('$_apiUrl/trials/$trialId/apply'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      final data = jsonDecode(response.body);
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception(data['message'] ?? 'Failed to apply');
      }

      state = state.copyWith(clearApplying: true);
      onSuccess(data['message'] ?? 'Successfully applied!');
    } catch (e) {
      state = state.copyWith(clearApplying: true);
      onError(e.toString().replaceAll('Exception: ', ''));
    }
  }
}

final dashboardProvider = NotifierProvider<DashboardNotifier, DashboardState>(() {
  return DashboardNotifier();
});
