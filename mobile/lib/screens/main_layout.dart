import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import 'dashboard_screen.dart';
import 'trials_screen.dart';
import 'feed_screen.dart';
import 'invitations_screen.dart';
import 'subscription_screen.dart';
import 'profile_screen.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const TrialsScreen(),
    const FeedScreen(),
    const InvitationsScreen(),
    const SubscriptionScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bgPrimary, // slate-950
      body: _screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(
              color: context.border, // slate-800
              width: 1,
            ),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          backgroundColor: context.bgSecondary, // slate-900
          type: BottomNavigationBarType.fixed,
          selectedItemColor: context.accent, // amber-500
          unselectedItemColor: context.textMuted, // slate-500
          selectedLabelStyle: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600),
          unselectedLabelStyle: GoogleFonts.inter(fontSize: 10),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.layoutDashboard),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.clipboardList),
              label: 'Trial',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.rss),
              label: 'Feed',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.shield),
              label: 'Invites',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.crown),
              label: 'Premium',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.user),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
