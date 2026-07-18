import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../providers/subscription_provider.dart';
import 'package:intl/intl.dart';

class SubscriptionScreen extends ConsumerStatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  ConsumerState<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends ConsumerState<SubscriptionScreen> {
  String? _selectedMethodCode;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(subscriptionProvider.notifier).fetchSubscriptionData();
    });
  }

  void _showError(String err) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(err),
      backgroundColor: context.error, // rose-600
    ));
  }

  void _showSuccess(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: context.success, // emerald-500
    ));
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(subscriptionProvider);

    if (state.isLoading) {
      return Center(child: CircularProgressIndicator(color: context.accent));
    }

    if (state.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(state.error!, style: GoogleFonts.inter(color: context.error)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(subscriptionProvider.notifier).fetchSubscriptionData(),
              child: const Text('Retry'),
            )
          ],
        ),
      );
    }

    return Scaffold(
      backgroundColor: context.bgPrimary, // slate-950
      appBar: AppBar(
        backgroundColor: context.bgSecondary, // slate-900
        title: Text('Premium', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: context.textPrimary)),
      ),
      body: RefreshIndicator(
        color: context.accent,
        onRefresh: () => ref.read(subscriptionProvider.notifier).fetchSubscriptionData(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (state.activeSub != null) ...[
              _buildActiveSubscription(state.activeSub!),
              const SizedBox(height: 24),
            ] else if (state.paymentResult != null) ...[
              _buildPaymentResult(state.paymentResult!),
              const SizedBox(height: 24),
            ] else if (state.pendingSub != null) ...[
              _buildPendingPayment(state),
              const SizedBox(height: 24),
            ] else ...[
              _buildUpgradeSection(state),
              const SizedBox(height: 24),
            ],
            if (state.history.isNotEmpty) _buildHistory(state.history),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveSubscription(Map<String, dynamic> activeSub) {
    final plan = activeSub['plan'];
    final expiredAt = activeSub['expired_at'];
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [context.accent.withOpacity(0.1), Color(0xFFF97316).withOpacity(0.1)],
        ),
        border: Border.all(color: context.accent.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(24),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: context.accent.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(LucideIcons.shield, color: context.accent, size: 32),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Active Premium', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: context.textPrimary)),
                    Text('You are subscribed to ${plan?['name']}.', style: GoogleFonts.inter(color: context.textSecondary)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: context.bgSecondary,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: context.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Status', style: GoogleFonts.inter(color: context.textMuted, fontSize: 12)),
                      Text(activeSub['status'].toString().toUpperCase(), style: GoogleFonts.inter(color: context.success, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: context.bgSecondary,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: context.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Valid Until', style: GoogleFonts.inter(color: context.textMuted, fontSize: 12)),
                      Text(
                        expiredAt != null ? DateFormat('MMM d, yyyy').format(DateTime.parse(expiredAt)) : 'N/A',
                        style: GoogleFonts.inter(color: context.textPrimary, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildUpgradeSection(SubscriptionState state) {
    return Column(
      children: [
        Text('Upgrade to Premium', style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.bold, color: context.textPrimary)),
        const SizedBox(height: 8),
        Text('Unlock unlimited trial apps, highlights, and achievements.', textAlign: TextAlign.center, style: GoogleFonts.inter(color: context.textSecondary, fontSize: 16)),
        const SizedBox(height: 24),
        ...state.plans.map((plan) {
          final isPopular = plan['id'] == 2; // Usually 3 months is popular
          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: context.bgSecondary,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: isPopular ? context.accent : context.border),
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (isPopular)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [context.accent, Color(0xFFF97316)]),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text('MOST POPULAR', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: context.textPrimary)),
                  ),
                Text(plan['name'], style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: context.textPrimary)),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('Rp ${(plan['price'] / 1000).toStringAsFixed(0)}k', style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.bold, color: context.accent)),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4, left: 4),
                      child: Text('/${plan['duration_months']} mo', style: GoogleFonts.inter(color: context.textMuted)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(plan['description'] ?? '', style: GoogleFonts.inter(color: context.textSecondary)),
                const SizedBox(height: 20),
                _buildFeatureItem('Unlimited Trial Applications'),
                _buildFeatureItem('Unlimited Highlights'),
                _buildFeatureItem('Unlimited Achievements'),
                _buildFeatureItem('Premium Badge on Profile'),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: state.isProcessing ? null : () {
                      ref.read(subscriptionProvider.notifier).createSubscription(
                        plan['id'],
                        onSuccess: () {},
                        onError: _showError,
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isPopular ? context.accent : context.border,
                      foregroundColor: context.textPrimary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: state.isProcessing 
                        ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: context.textPrimary))
                        : Text('Select Plan', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                  ),
                )
              ],
            ),
          );
        }).toList()
      ],
    );
  }

  Widget _buildFeatureItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: context.success.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(LucideIcons.check, size: 12, color: context.success),
          ),
          const SizedBox(width: 12),
          Text(text, style: GoogleFonts.inter(color: context.textPrimary, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildPendingPayment(SubscriptionState state) {
    return Container(
      decoration: BoxDecoration(
        color: context.bgSecondary,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: context.border),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Select Payment Method', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: context.textPrimary)),
          const SizedBox(height: 16),
          ...state.paymentMethods.map((pm) {
            return RadioListTile<String>(
              value: pm['code'],
              groupValue: _selectedMethodCode ?? (state.paymentMethods.isNotEmpty ? state.paymentMethods[0]['code'] : null),
              onChanged: (val) {
                setState(() {
                  _selectedMethodCode = val;
                });
              },
              title: Text(pm['name'], style: GoogleFonts.inter(color: context.textPrimary)),
              subtitle: Text(pm['type'].toString().toUpperCase(), style: GoogleFonts.inter(color: context.textMuted, fontSize: 12)),
              activeColor: context.accent,
              contentPadding: EdgeInsets.zero,
            );
          }).toList(),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: () => ref.read(subscriptionProvider.notifier).resetPaymentResult(),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: context.border,
                    foregroundColor: context.textPrimary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Cancel', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: state.isProcessing ? null : () {
                    final code = _selectedMethodCode ?? (state.paymentMethods.isNotEmpty ? state.paymentMethods[0]['code'] : '');
                    if (code.isEmpty) return;
                    ref.read(subscriptionProvider.notifier).paySubscription(
                      state.pendingSub!['id'],
                      code,
                      onSuccess: () {},
                      onError: _showError,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.accent,
                    foregroundColor: context.textPrimary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: state.isProcessing
                      ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: context.textPrimary))
                      : Text('Pay Rp ${NumberFormat.decimalPattern('id').format(state.pendingSub!['amount'])}', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildPaymentResult(Map<String, dynamic> result) {
    return Container(
      decoration: BoxDecoration(
        color: context.bgSecondary,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: context.border),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Color(0xFF3B82F6).withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(LucideIcons.banknote, color: Color(0xFF3B82F6), size: 32),
          ),
          const SizedBox(height: 16),
          Text('Complete Your Payment', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: context.textPrimary)),
          const SizedBox(height: 8),
          Text('Order ID: ${result['order_id']}', style: GoogleFonts.inter(color: context.textSecondary)),
          Text('Amount: Rp ${NumberFormat.decimalPattern('id').format(double.tryParse(result['gross_amount'] ?? '0') ?? 0)}', style: GoogleFonts.inter(color: context.textPrimary, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          
          if (result['payment_type'] == 'bank_transfer' && result['va_numbers'] != null && (result['va_numbers'] as List).isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.border,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text('Virtual Account (${result['va_numbers'][0]['bank'].toString().toUpperCase()})', style: GoogleFonts.inter(color: context.textSecondary, fontSize: 12)),
                  const SizedBox(height: 8),
                  Text(result['va_numbers'][0]['va_number'], style: GoogleFonts.inter(color: context.textPrimary, fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 2)),
                ],
              ),
            ),
            
          if (result['payment_type'] == 'echannel' && result['payment_code'] != null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.border,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text('Mandiri Bill Code', style: GoogleFonts.inter(color: context.textSecondary, fontSize: 12)),
                  const SizedBox(height: 8),
                  Text(result['payment_code'], style: GoogleFonts.inter(color: context.textPrimary, fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 2)),
                ],
              ),
            ),
            
          if (result['payment_type'] == 'qris' && result['qris_url'] != null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.textPrimary,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text('Scan QRIS to Pay', style: GoogleFonts.inter(color: context.textMuted, fontSize: 12)),
                  const SizedBox(height: 12),
                  Image.network(result['qris_url'], width: 200, height: 200),
                ],
              ),
            ),
            
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                ref.read(subscriptionProvider.notifier).resetPaymentResult();
                ref.read(subscriptionProvider.notifier).fetchSubscriptionData();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: context.success,
                foregroundColor: context.textPrimary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text('I Have Completed Payment', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildHistory(List<dynamic> history) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.clock, color: context.accent, size: 20),
            const SizedBox(width: 8),
            Text('Transaction History', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: context.textPrimary)),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            color: context.bgSecondary,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: context.border),
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: history.length,
            separatorBuilder: (context, index) => Divider(color: context.border, height: 1),
            itemBuilder: (context, index) {
              final sub = history[index];
              final planName = sub['plan']?['name'] ?? '-';
              final status = sub['status'] ?? 'pending';
              
              Color statusColor;
              if (status == 'paid') statusColor = context.success;
              else if (status == 'pending') statusColor = context.accent;
              else statusColor = Color(0xFFF43F5E);
              
              return Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(planName, style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: context.textPrimary)),
                          const SizedBox(height: 4),
                          Text(sub['payment_order_id'] ?? '-', style: GoogleFonts.inter(color: context.textMuted, fontSize: 12)),
                          Text(sub['paid_at'] != null ? DateFormat('MMM d, yyyy').format(DateTime.parse(sub['paid_at'])) : '-', style: GoogleFonts.inter(color: context.textMuted, fontSize: 12)),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('Rp ${NumberFormat.decimalPattern('id').format(sub['amount'])}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: context.textPrimary)),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            status.toString().toUpperCase(),
                            style: GoogleFonts.inter(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        )
                      ],
                    )
                  ],
                ),
              );
            },
          ),
        )
      ],
    );
  }
}
