import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

String get _apiUrl => dotenv.env['API_URL'] ?? 'https://api.njara.web.id/api';

class SubscriptionState {
  final bool isLoading;
  final bool isProcessing;
  final String? error;
  final List<dynamic> plans;
  final Map<String, dynamic>? activeSub;
  final List<dynamic> history;
  final List<dynamic> paymentMethods;
  final Map<String, dynamic>? pendingSub;
  final Map<String, dynamic>? paymentResult;

  SubscriptionState({
    this.isLoading = false,
    this.isProcessing = false,
    this.error,
    this.plans = const [],
    this.activeSub,
    this.history = const [],
    this.paymentMethods = const [],
    this.pendingSub,
    this.paymentResult,
  });

  SubscriptionState copyWith({
    bool? isLoading,
    bool? isProcessing,
    String? error,
    List<dynamic>? plans,
    Map<String, dynamic>? activeSub,
    List<dynamic>? history,
    List<dynamic>? paymentMethods,
    Map<String, dynamic>? pendingSub,
    Map<String, dynamic>? paymentResult,
    bool clearActiveSub = false,
    bool clearPendingSub = false,
    bool clearPaymentResult = false,
    bool clearError = false,
  }) {
    return SubscriptionState(
      isLoading: isLoading ?? this.isLoading,
      isProcessing: isProcessing ?? this.isProcessing,
      error: clearError ? null : (error ?? this.error),
      plans: plans ?? this.plans,
      activeSub: clearActiveSub ? null : (activeSub ?? this.activeSub),
      history: history ?? this.history,
      paymentMethods: paymentMethods ?? this.paymentMethods,
      pendingSub: clearPendingSub ? null : (pendingSub ?? this.pendingSub),
      paymentResult: clearPaymentResult ? null : (paymentResult ?? this.paymentResult),
    );
  }
}

class SubscriptionNotifier extends Notifier<SubscriptionState> {
  @override
  SubscriptionState build() {
    Future.microtask(() => fetchSubscriptionData());
    return SubscriptionState(isLoading: true);
  }

  Future<void> fetchSubscriptionData() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (token == null) throw Exception('Not authenticated');

      final headers = {
        'Authorization': 'Bearer $token',
      };

      final results = await Future.wait([
        http.get(Uri.parse('$_apiUrl/b2c/subscription/plans'), headers: headers),
        http.get(Uri.parse('$_apiUrl/b2c/subscription/me'), headers: headers),
        http.get(Uri.parse('$_apiUrl/b2c/subscription/history'), headers: headers),
        http.get(Uri.parse('$_apiUrl/payment-methods'), headers: headers),
      ]);

      List<dynamic> plans = [];
      Map<String, dynamic>? activeSub;
      List<dynamic> history = [];
      List<dynamic> paymentMethods = [];

      if (results[0].statusCode == 200) {
        plans = jsonDecode(results[0].body)['data'] ?? [];
      }
      if (results[1].statusCode == 200) {
        activeSub = jsonDecode(results[1].body)['data'];
      }
      if (results[2].statusCode == 200) {
        history = jsonDecode(results[2].body)['data'] ?? [];
      }
      if (results[3].statusCode == 200) {
        paymentMethods = jsonDecode(results[3].body)['data'] ?? [];
      }

      state = state.copyWith(
        isLoading: false,
        plans: plans,
        activeSub: activeSub,
        clearActiveSub: activeSub == null,
        history: history,
        paymentMethods: paymentMethods,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceAll('Exception: ', ''),
      );
    }
  }

  Future<void> createSubscription(int planId, {required Function() onSuccess, required Function(String) onError}) async {
    state = state.copyWith(isProcessing: true, clearError: true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (token == null) throw Exception('Not authenticated');

      final response = await http.post(
        Uri.parse('$_apiUrl/b2c/subscription'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'plan_id': planId}),
      ).timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        state = state.copyWith(
          isProcessing: false,
          pendingSub: data['data'],
        );
        onSuccess();
      } else {
        throw Exception(data['message'] ?? 'Failed to create subscription');
      }
    } catch (e) {
      state = state.copyWith(isProcessing: false);
      onError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> paySubscription(int subId, String methodCode, {required Function() onSuccess, required Function(String) onError}) async {
    state = state.copyWith(isProcessing: true, clearError: true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (token == null) throw Exception('Not authenticated');

      final response = await http.post(
        Uri.parse('$_apiUrl/b2c/subscription/$subId/pay'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'payment_method_code': methodCode}),
      ).timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        state = state.copyWith(
          isProcessing: false,
          paymentResult: data['data'],
        );
        onSuccess();
      } else {
        throw Exception(data['message'] ?? 'Failed to process payment');
      }
    } catch (e) {
      state = state.copyWith(isProcessing: false);
      onError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  void resetPaymentResult() {
    state = state.copyWith(
      clearPendingSub: true,
      clearPaymentResult: true,
    );
  }
}

final subscriptionProvider = NotifierProvider<SubscriptionNotifier, SubscriptionState>(() => SubscriptionNotifier());
