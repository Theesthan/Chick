import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../models/models.dart';
import '../widgets/farm_card.dart';
import 'daily_report_screen.dart';
import 'weighing_screen.dart';
import 'transport_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  int _tab = 0;
  List<Farm> _farms = [];
  List<Batch> _batches = [];
  List<DailyReport> _reports = [];
  bool _loading = true;

  late AnimationController _fadeCtrl;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
    _fade = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _load();
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        ApiService.getFarms(),
        ApiService.getBatches(),
        ApiService.getDailyReports(),
      ]);
      if (mounted) {
        setState(() {
          _farms = results[0] as List<Farm>;
          _batches = results[1] as List<Batch>;
          _reports = results[2] as List<DailyReport>;
          _loading = false;
        });
        _fadeCtrl.forward();
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final activeBatches = _batches.where((b) => b.status == 'active').length;
    final pendingReports = _reports.where((r) => r.status == 'pending').length;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        title: Row(
          children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB).withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.egg_alt_rounded, color: Color(0xFF2563EB), size: 18),
            ),
            const SizedBox(width: 10),
            const Text('PoultryFlow', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF94A3B8)),
            onPressed: () { setState(() => _loading = true); _fadeCtrl.reset(); _load(); },
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.account_circle_outlined, color: Color(0xFF94A3B8)),
            color: const Color(0xFF1E293B),
            onSelected: (v) { if (v == 'logout') auth.logout(); },
            itemBuilder: (_) => [
              PopupMenuItem(
                enabled: false,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(auth.user?.name ?? '', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                  Text(auth.user?.email ?? '', style: const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
                ]),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(value: 'logout', child: Row(children: [
                Icon(Icons.logout_rounded, size: 16, color: Color(0xFFEF4444)),
                SizedBox(width: 8),
                Text('Sign out', style: TextStyle(color: Color(0xFFEF4444), fontSize: 13)),
              ])),
            ],
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFF1E293B)))),
            child: Row(
              children: [
                _NavTab(label: 'Dashboard', index: 0, current: _tab, onTap: () => setState(() => _tab = 0)),
                _NavTab(label: 'Farms', index: 1, current: _tab, onTap: () => setState(() => _tab = 1)),
                _NavTab(label: 'Batches', index: 2, current: _tab, onTap: () => setState(() => _tab = 2)),
                _NavTab(label: 'Reports', index: 3, current: _tab, onTap: () => setState(() => _tab = 3)),
              ],
            ),
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)))
          : FadeTransition(
              opacity: _fade,
              child: RefreshIndicator(
                color: const Color(0xFF2563EB),
                backgroundColor: const Color(0xFF1E293B),
                onRefresh: _load,
                child: [
                  _DashboardTab(
                    farms: _farms.length,
                    activeBatches: activeBatches,
                    pendingReports: pendingReports,
                    onQuickAction: _handleQuickAction,
                  ),
                  _FarmsTab(farms: _farms),
                  _BatchesTab(batches: _batches),
                  _ReportsTab(reports: _reports),
                ][_tab],
              ),
            ),
    );
  }

  void _handleQuickAction(String action) {
    switch (action) {
      case 'report':
        if (_batches.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No batches available'), backgroundColor: Color(0xFF475569)),
          );
          return;
        }
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => DailyReportScreen(batches: _batches.where((b) => b.status == 'active').toList()),
        )).then((_) => _load());
        break;
      case 'weighing':
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => WeighingScreen(batches: _batches.where((b) => b.status == 'active').toList()),
        )).then((_) => _load());
        break;
      case 'transport':
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => TransportScreen(batches: _batches.where((b) => b.status == 'active').toList()),
        )).then((_) => _load());
        break;
    }
  }
}

class _NavTab extends StatelessWidget {
  final String label;
  final int index, current;
  final VoidCallback onTap;
  const _NavTab({required this.label, required this.index, required this.current, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final active = index == current;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(
            color: active ? const Color(0xFF2563EB) : Colors.transparent,
            width: 2,
          )),
        ),
        child: Text(label, style: TextStyle(
          fontSize: 13, fontWeight: FontWeight.w500,
          color: active ? const Color(0xFF2563EB) : const Color(0xFF64748B),
        )),
      ),
    );
  }
}

class _DashboardTab extends StatelessWidget {
  final int farms, activeBatches, pendingReports;
  final void Function(String) onQuickAction;
  const _DashboardTab({required this.farms, required this.activeBatches, required this.pendingReports, required this.onQuickAction});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: _StatCard(label: 'Farms', value: farms.toString(), icon: Icons.home_work_rounded, color: const Color(0xFF2563EB))),
          const SizedBox(width: 10),
          Expanded(child: _StatCard(label: 'Active Batches', value: activeBatches.toString(), icon: Icons.layers_rounded, color: const Color(0xFF10B981))),
          const SizedBox(width: 10),
          Expanded(child: _StatCard(label: 'Pending', value: pendingReports.toString(), icon: Icons.pending_actions_rounded, color: const Color(0xFFF59E0B))),
        ]),
        const SizedBox(height: 24),
        const Text('Quick Actions', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
        const SizedBox(height: 12),
        _QuickActionTile(
          icon: Icons.assignment_rounded,
          label: 'Submit Daily Report',
          subtitle: 'Log mortality, feed, and GPS',
          color: const Color(0xFF2563EB),
          onTap: () => onQuickAction('report'),
        ),
        _QuickActionTile(
          icon: Icons.monitor_weight_rounded,
          label: 'Record Weighing',
          subtitle: 'Capture batch weight data',
          color: const Color(0xFF10B981),
          onTap: () => onQuickAction('weighing'),
        ),
        _QuickActionTile(
          icon: Icons.local_shipping_rounded,
          label: 'Create Transport',
          subtitle: 'Dispatch batch for transport',
          color: const Color(0xFF8B5CF6),
          onTap: () => onQuickAction('transport'),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _StatCard({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
        Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
      ]),
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  final IconData icon;
  final String label, subtitle;
  final Color color;
  final VoidCallback onTap;
  const _QuickActionTile({required this.icon, required this.label, required this.subtitle, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFF334155)),
        ),
        child: Row(children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
            Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
          ])),
          const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFF475569)),
        ]),
      ),
    );
  }
}

class _FarmsTab extends StatelessWidget {
  final List<Farm> farms;
  const _FarmsTab({required this.farms});

  @override
  Widget build(BuildContext context) {
    if (farms.isEmpty) {
      return const Center(child: Text('No farms found', style: TextStyle(color: Color(0xFF64748B))));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: farms.length,
      itemBuilder: (_, i) => FarmCard(farm: farms[i]),
    );
  }
}

class _BatchesTab extends StatelessWidget {
  final List<Batch> batches;
  const _BatchesTab({required this.batches});

  @override
  Widget build(BuildContext context) {
    if (batches.isEmpty) {
      return const Center(child: Text('No batches found', style: TextStyle(color: Color(0xFF64748B))));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: batches.length,
      itemBuilder: (_, i) {
        final b = batches[i];
        final statusColor = b.status == 'active'
            ? const Color(0xFF10B981)
            : b.status == 'closed'
                ? const Color(0xFF64748B)
                : const Color(0xFFF59E0B);
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF334155)),
          ),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(b.batchCode, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
              Text('Started: ${b.startDate}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              Text('${b.initialCount} birds', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
            ])),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(b.status, style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.w500)),
            ),
          ]),
        );
      },
    );
  }
}

class _ReportsTab extends StatelessWidget {
  final List<DailyReport> reports;
  const _ReportsTab({required this.reports});

  @override
  Widget build(BuildContext context) {
    if (reports.isEmpty) {
      return const Center(child: Text('No reports found', style: TextStyle(color: Color(0xFF64748B))));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: reports.length,
      itemBuilder: (_, i) {
        final r = reports[i];
        final statusColor = r.status == 'verified'
            ? const Color(0xFF10B981)
            : r.status == 'rejected'
                ? const Color(0xFFEF4444)
                : const Color(0xFFF59E0B);
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF334155)),
          ),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(r.reportDate, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
              Text('Mortality: ${r.mortality} · Feed: ${r.feedConsumed} kg',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
              if (r.rejectionReason != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text('Reason: ${r.rejectionReason}',
                      style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444))),
                ),
            ])),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(r.status, style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.w500)),
              ),
              const SizedBox(height: 4),
              Icon(r.gpsValid ? Icons.location_on_rounded : Icons.location_off_rounded,
                  size: 14, color: r.gpsValid ? const Color(0xFF10B981) : const Color(0xFF64748B)),
            ]),
          ]),
        );
      },
    );
  }
}
