import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

String get _apiUrl => dotenv.env['API_URL'] ?? 'https://api.njara.web.id/api';
String get _apiKey => dotenv.env['PUBLIC_GLOBAL_API_KEY'] ?? '';

class TrialsState {
  final bool isLoading;
  final String? error;
  final List<dynamic> trials;
  final List<dynamic> myApplications;
  final int? applyingTrialId;

  TrialsState({
    this.isLoading = false,
    this.error,
    this.trials = const [],
    this.myApplications = const [],
    this.applyingTrialId,
  });

  TrialsState copyWith({
    bool? isLoading,
    String? error,
    List<dynamic>? trials,
    List<dynamic>? myApplications,
    int? applyingTrialId,
    bool clearApplying = false,
  }) {
    return TrialsState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      trials: trials ?? this.trials,
      myApplications: myApplications ?? this.myApplications,
      applyingTrialId: clearApplying ? null : (applyingTrialId ?? this.applyingTrialId),
    );
  }
}

class TrialsNotifier extends Notifier<TrialsState> {
  @override
  TrialsState build() {
    return TrialsState();
  }

  Future<void> fetchTrialsData() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      final headers = {'X-API-Key': _apiKey};
      final authHeaders = token != null ? {'Authorization': 'Bearer $token'} : <String, String>{};

      final trialsFuture = http.get(Uri.parse('$_apiUrl/global/trials?status=PUBLISHED'), headers: headers);
      
      // If user is logged in, also fetch their applications
      Future<http.Response>? appsFuture;
      if (token != null) {
        appsFuture = http.get(Uri.parse('$_apiUrl/my-applications'), headers: authHeaders);
      }

      final trialsResponse = await trialsFuture;
      if (trialsResponse.statusCode != 200) {
        throw Exception('Failed to fetch trials data');
      }
      final trialsData = jsonDecode(trialsResponse.body);

      List<dynamic> appsDataList = [];
      if (appsFuture != null) {
        final appsResponse = await appsFuture;
        if (appsResponse.statusCode == 200) {
          final appsData = jsonDecode(appsResponse.body);
          appsDataList = appsData['data'] ?? [];
        }
      }

      state = state.copyWith(
        isLoading: false,
        trials: trialsData['data']?['items'] ?? [],
        myApplications: appsDataList,
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
      
      // Refresh the lists to show the new application
      await fetchTrialsData();
    } catch (e) {
      state = state.copyWith(clearApplying: true);
      onError(e.toString().replaceAll('Exception: ', ''));
    }
  }
}

final trialsProvider = NotifierProvider<TrialsNotifier, TrialsState>(() {
  return TrialsNotifier();
});
