import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../providers/settings_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsState = ref.watch(settingsProvider);

    return Scaffold(
      backgroundColor: context.bgPrimary,
      appBar: AppBar(
        backgroundColor: context.bgSecondary,
        elevation: 0,
        iconTheme: IconThemeData(color: context.textPrimary),
        title: Text(
          'Settings',
          style: GoogleFonts.inter(
            color: context.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: context.border, height: 1),
        ),
      ),
      body: settingsState.isLoading
          ? Center(child: CircularProgressIndicator(color: context.primary))
          : ListView(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
              children: [
                _buildSectionHeader('Preferences', context),
                const SizedBox(height: 16),
                _buildLanguageSelector(context, ref, settingsState),
                const SizedBox(height: 16),
                _buildNotificationToggle(context, ref, settingsState),
              ],
            ),
    );
  }

  Widget _buildSectionHeader(String title, BuildContext context) {
    return Text(
      title.toUpperCase(),
      style: GoogleFonts.inter(
        color: context.textMuted,
        fontSize: 12,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
      ),
    );
  }

  Widget _buildLanguageSelector(BuildContext context, WidgetRef ref, SettingsState state) {
    return Container(
      decoration: BoxDecoration(
        color: context.bgSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.border),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: context.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(LucideIcons.globe, color: context.primary),
        ),
        title: Text(
          'Change Language',
          style: GoogleFonts.inter(
            color: context.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Text(
          'Select your preferred language',
          style: GoogleFonts.inter(
            color: context.textSecondary,
            fontSize: 13,
          ),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: context.bgPrimary,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: context.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: state.language,
              icon: Icon(LucideIcons.chevronDown, size: 16, color: context.textMuted),
              dropdownColor: context.bgSecondary,
              style: GoogleFonts.inter(color: context.textPrimary, fontSize: 14),
              onChanged: (String? newValue) {
                if (newValue != null) {
                  ref.read(settingsProvider.notifier).setLanguage(newValue);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Language changed to ${newValue == 'en' ? 'English' : 'Bahasa Indonesia'}')),
                  );
                }
              },
              items: const [
                DropdownMenuItem(value: 'en', child: Text('English')),
                DropdownMenuItem(value: 'id', child: Text('Indonesia')),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationToggle(BuildContext context, WidgetRef ref, SettingsState state) {
    return Container(
      decoration: BoxDecoration(
        color: context.bgSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.border),
      ),
      child: SwitchListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        activeThumbColor: context.primary,
        secondary: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: context.accent.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(LucideIcons.bell, color: context.accent),
        ),
        title: Text(
          'Notifications',
          style: GoogleFonts.inter(
            color: context.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Text(
          'Enable or disable notifications',
          style: GoogleFonts.inter(
            color: context.textSecondary,
            fontSize: 13,
          ),
        ),
        value: state.notificationsEnabled,
        onChanged: (bool value) {
          ref.read(settingsProvider.notifier).toggleNotifications(value);
        },
      ),
    );
  }
}
