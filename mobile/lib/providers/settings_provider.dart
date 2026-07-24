import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsState {
  final String language;
  final bool notificationsEnabled;
  final bool isLoading;

  SettingsState({
    this.language = 'en',
    this.notificationsEnabled = true,
    this.isLoading = false,
  });

  SettingsState copyWith({
    String? language,
    bool? notificationsEnabled,
    bool? isLoading,
  }) {
    return SettingsState(
      language: language ?? this.language,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class SettingsNotifier extends Notifier<SettingsState> {
  static const _keyLanguage = 'settings_language';
  static const _keyNotifications = 'settings_notifications';

  @override
  SettingsState build() {
    _loadSettings();
    return SettingsState(isLoading: true);
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final lang = prefs.getString(_keyLanguage) ?? 'en';
    final notif = prefs.getBool(_keyNotifications) ?? true;

    state = state.copyWith(
      language: lang,
      notificationsEnabled: notif,
      isLoading: false,
    );
  }

  Future<void> setLanguage(String langCode) async {
    state = state.copyWith(language: langCode);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyLanguage, langCode);
  }

  Future<void> toggleNotifications(bool enabled) async {
    state = state.copyWith(notificationsEnabled: enabled);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyNotifications, enabled);
  }
}

final settingsProvider = NotifierProvider<SettingsNotifier, SettingsState>(() {
  return SettingsNotifier();
});
