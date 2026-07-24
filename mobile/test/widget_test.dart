// Integration test: Login flow menggunakan mocktail untuk mock http.Client
//
// Skenario yang diuji:
//  1. Login berhasil → state.token terisi, state.error null
//  2. Login gagal (401) → state.error terisi, exception dilempar
//  3. Login gagal untuk akun B2B (owner/manager) → ditolak di sisi client
//  4. Login berhasil lalu UI navigasi ke MainLayout
//  5. Tampilkan error banner di UI ketika login gagal

import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/screens/login_screen.dart';
import 'package:mobile/screens/main_layout.dart';

// ─── Mock ────────────────────────────────────────────────────────────────────

class MockHttpClient extends Mock implements http.Client {}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/// Response sukses login dengan user kategori 'player'.
http.Response _loginSuccessResponse({String category = 'player'}) {
  return http.Response(
    jsonEncode({
      'message': 'Login successful',
      'data': {
        'token': 'fake-jwt-token',
        'refresh_token': 'fake-refresh-token',
        'user': {
          'id': '1',
          'email': 'player@example.com',
          'username': 'player1',
          'full_name': 'Player One',
          'category': category,
          'bio': 'Test bio',
          'language': 'en',
        },
      },
    }),
    200,
    headers: {'content-type': 'application/json'},
  );
}

/// Response gagal login (credentials salah).
http.Response _loginUnauthorizedResponse() {
  return http.Response(
    jsonEncode({'message': 'Invalid email or password.'}),
    401,
    headers: {'content-type': 'application/json'},
  );
}

/// Buat ProviderContainer dengan mock client ter-inject.
ProviderContainer _makeContainer(MockHttpClient mockClient) {
  return ProviderContainer(
    overrides: [
      httpClientProvider.overrideWithValue(mockClient),
    ],
  );
}

/// Widget wrapper minimal untuk test UI.
Widget _buildApp(MockHttpClient mockClient) {
  return ProviderScope(
    overrides: [
      httpClientProvider.overrideWithValue(mockClient),
    ],
    child: const MaterialApp(
      home: LoginScreen(),
    ),
  );
}

// ─── Setup ───────────────────────────────────────────────────────────────────

void main() {
  setUpAll(() {
    // Fallback untuk Uri agar mocktail bisa menangkap any()
    registerFallbackValue(Uri.parse('http://fallback.test'));
  });

  setUp(() async {
    // Seed dotenv agar _apiUrl tidak throw
    dotenv.loadFromString(envString: 'API_URL=http://localhost:3000/api');
    // Reset SharedPreferences sebelum tiap test
    SharedPreferences.setMockInitialValues({});
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Unit Tests – AuthNotifier
  // ═══════════════════════════════════════════════════════════════════════════

  group('AuthNotifier.login – unit', () {
    test('sukses: state.token terisi dan state.error null', () async {
      final mockClient = MockHttpClient();
      final container = _makeContainer(mockClient);
      addTearDown(container.dispose);

      when(() => mockClient.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).thenAnswer((_) async => _loginSuccessResponse());

      await container.read(authProvider.notifier).login(
            'player@example.com',
            'password',
          );

      final state = container.read(authProvider);
      expect(state.token, equals('fake-jwt-token'));
      expect(state.error, isNull);
      expect(state.isLoading, isFalse);
      expect(state.user?['category'], equals('player'));
    });

    test('gagal 401: state.error terisi dan exception dilempar', () async {
      final mockClient = MockHttpClient();
      final container = _makeContainer(mockClient);
      addTearDown(container.dispose);

      when(() => mockClient.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).thenAnswer((_) async => _loginUnauthorizedResponse());

      expect(
        () => container.read(authProvider.notifier).login(
              'wrong@example.com',
              'badpassword',
            ),
        throwsException,
      );

      // Tunggu future selesai
      await Future.delayed(Duration.zero);

      final state = container.read(authProvider);
      expect(state.token, isNull);
      expect(state.error, equals('Invalid email or password.'));
      expect(state.isLoading, isFalse);
    });

    test('akun B2B (owner) ditolak oleh logika client', () async {
      final mockClient = MockHttpClient();
      final container = _makeContainer(mockClient);
      addTearDown(container.dispose);

      when(() => mockClient.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).thenAnswer((_) async => _loginSuccessResponse(category: 'owner'));

      expect(
        () => container.read(authProvider.notifier).login(
              'owner@club.com',
              'password',
            ),
        throwsException,
      );

      await Future.delayed(Duration.zero);

      final state = container.read(authProvider);
      expect(state.token, isNull);
      expect(state.error, contains('B2B Club Portal'));
    });

    for (final role in ['owner', 'manager', 'staff', 'ba']) {
      test('akun B2B role "$role" ditolak', () async {
        final mockClient = MockHttpClient();
        final container = _makeContainer(mockClient);
        addTearDown(container.dispose);

        when(() => mockClient.post(
              any(),
              headers: any(named: 'headers'),
              body: any(named: 'body'),
            )).thenAnswer((_) async => _loginSuccessResponse(category: role));

        expect(
          () => container.read(authProvider.notifier).login('user@test.com', 'pass'),
          throwsException,
        );

        await Future.delayed(Duration.zero);
        final state = container.read(authProvider);
        expect(state.token, isNull);
      });
    }

    test('token tersimpan di SharedPreferences setelah login sukses', () async {
      final mockClient = MockHttpClient();
      final container = _makeContainer(mockClient);
      addTearDown(container.dispose);

      when(() => mockClient.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).thenAnswer((_) async => _loginSuccessResponse());

      await container.read(authProvider.notifier).login(
            'player@example.com',
            'password',
          );

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('jwt_token'), equals('fake-jwt-token'));
    });

    test('POST dikirim ke endpoint /api/login dengan body yang benar', () async {
      final mockClient = MockHttpClient();
      final container = _makeContainer(mockClient);
      addTearDown(container.dispose);

      when(() => mockClient.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).thenAnswer((_) async => _loginSuccessResponse());

      await container.read(authProvider.notifier).login(
            'player@example.com',
            'mypassword',
          );

      final captured = verify(() => mockClient.post(
            captureAny(),
            headers: captureAny(named: 'headers'),
            body: captureAny(named: 'body'),
          )).captured;

      final uri = captured[0] as Uri;
      final body = jsonDecode(captured[2] as String) as Map<String, dynamic>;

      expect(uri.path, equals('/api/login'));
      expect(body['email'], equals('player@example.com'));
      expect(body['password'], equals('mypassword'));
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Widget / Integration Tests – LoginScreen UI
  // ═══════════════════════════════════════════════════════════════════════════

  group('LoginScreen – widget integration', () {
    testWidgets('render: form email & password terlihat', (tester) async {
      final mockClient = MockHttpClient();

      await tester.pumpWidget(_buildApp(mockClient));
      await tester.pumpAndSettle();

      expect(find.byType(TextField), findsWidgets);
      // Tombol Sign In
      expect(find.text('Sign In'), findsOneWidget);
      // Link ke Register — teks ada di dalam RichText/TextSpan
      expect(
        find.byWidgetPredicate((w) =>
            w is RichText &&
            w.text.toPlainText().contains('Create one')),
        findsOneWidget,
      );
    });

    testWidgets('login sukses → navigasi ke MainLayout', (tester) async {
      final mockClient = MockHttpClient();

      // Mock checkAuth (GET /profile) → kembalikan 401 agar tidak auto-login
      when(() => mockClient.get(
            any(),
            headers: any(named: 'headers'),
          )).thenAnswer((_) async => http.Response('{}', 401));

      // Mock login POST
      when(() => mockClient.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).thenAnswer((_) async => _loginSuccessResponse());

      await tester.pumpWidget(_buildApp(mockClient));
      await tester.pump();

      // Isi email
      final emailField = find.byType(TextField).first;
      await tester.enterText(emailField, 'player@example.com');

      // Isi password
      final passwordField = find.byType(TextField).last;
      await tester.enterText(passwordField, 'password');

      // Tap Sign In
      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Seharusnya navigasi ke MainLayout
      expect(find.byType(MainLayout), findsOneWidget);
    });

    testWidgets('login gagal → error banner tampil di layar', (tester) async {
      final mockClient = MockHttpClient();

      when(() => mockClient.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).thenAnswer((_) async => _loginUnauthorizedResponse());

      await tester.pumpWidget(_buildApp(mockClient));
      await tester.pump();

      final emailField = find.byType(TextField).first;
      await tester.enterText(emailField, 'wrong@example.com');

      final passwordField = find.byType(TextField).last;
      await tester.enterText(passwordField, 'badpassword');

      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle();

      // Error dari API harus tampil
      expect(find.text('Invalid email or password.'), findsOneWidget);
    });

    testWidgets('form kosong tidak mengirim request', (tester) async {
      final mockClient = MockHttpClient();

      await tester.pumpWidget(_buildApp(mockClient));
      await tester.pump();

      // Tap Sign In tanpa isi apapun
      await tester.tap(find.text('Sign In'));
      await tester.pump();

      // Pastikan post tidak dipanggil sama sekali
      verifyNever(() => mockClient.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          ));
    });
  });
}
