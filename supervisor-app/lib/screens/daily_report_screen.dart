import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class DailyReportScreen extends StatefulWidget {
  final List<Batch> batches;
  const DailyReportScreen({super.key, required this.batches});

  @override
  State<DailyReportScreen> createState() => _DailyReportScreenState();
}

class _DailyReportScreenState extends State<DailyReportScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  String? _selectedBatchId;
  final _mortalityCtrl = TextEditingController(text: '0');
  final _feedCtrl = TextEditingController();
  final _waterCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  double? _lat, _lng;
  bool _gpsLoading = false;
  bool _gpsObtained = false;
  bool _submitting = false;
  bool _success = false;

  late AnimationController _successCtrl;
  late Animation<double> _successScale;

  @override
  void initState() {
    super.initState();
    _successCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _successScale = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _successCtrl, curve: Curves.elasticOut),
    );
    if (widget.batches.isNotEmpty) {
      _selectedBatchId = widget.batches.first.id;
    }
    _getLocation();
  }

  @override
  void dispose() {
    _mortalityCtrl.dispose();
    _feedCtrl.dispose();
    _waterCtrl.dispose();
    _notesCtrl.dispose();
    _successCtrl.dispose();
    super.dispose();
  }

  Future<void> _getLocation() async {
    setState(() => _gpsLoading = true);
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever) {
        setState(() => _gpsLoading = false);
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
      setState(() {
        _lat = pos.latitude;
        _lng = pos.longitude;
        _gpsObtained = true;
        _gpsLoading = false;
      });
    } catch (_) {
      setState(() => _gpsLoading = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedBatchId == null) return;

    setState(() => _submitting = true);
    try {
      await ApiService.submitDailyReport(
        batchId: _selectedBatchId!,
        mortality: int.parse(_mortalityCtrl.text),
        feedConsumed: double.parse(_feedCtrl.text),
        waterConsumed: _waterCtrl.text.isNotEmpty ? double.parse(_waterCtrl.text) : null,
        lat: _lat,
        lng: _lng,
        notes: _notesCtrl.text.isNotEmpty ? _notesCtrl.text : null,
      );
      setState(() { _submitting = false; _success = true; });
      _successCtrl.forward();
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() => _submitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        title: const Text('Daily Report', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _success ? _buildSuccess() : _buildForm(),
    );
  }

  Widget _buildSuccess() {
    return Center(
      child: ScaleTransition(
        scale: _successScale,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 44),
            ),
            const SizedBox(height: 16),
            const Text('Report Submitted!',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 6),
            const Text('Your daily report has been submitted for review.',
                style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // GPS Status
            _GpsStatusCard(
              loading: _gpsLoading,
              obtained: _gpsObtained,
              lat: _lat,
              lng: _lng,
              onRetry: _getLocation,
            ),
            const SizedBox(height: 16),

            // Batch Selector
            _label('Batch'),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: DropdownButton<String>(
                value: _selectedBatchId,
                isExpanded: true,
                dropdownColor: const Color(0xFF1E293B),
                underline: const SizedBox(),
                style: const TextStyle(color: Colors.white, fontSize: 14),
                items: widget.batches.map((b) => DropdownMenuItem(
                  value: b.id,
                  child: Text(b.batchCode),
                )).toList(),
                onChanged: (v) => setState(() => _selectedBatchId = v),
              ),
            ),
            const SizedBox(height: 14),

            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _label('Mortality (birds)'),
                _numField(_mortalityCtrl, '0', isInt: true),
              ])),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _label('Feed Consumed (kg)'),
                _numField(_feedCtrl, '250.5'),
              ])),
            ]),
            const SizedBox(height: 14),

            _label('Water Consumed (L) — optional'),
            _numField(_waterCtrl, '500', required: false),
            const SizedBox(height: 14),

            _label('Notes — optional'),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 3,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Any observations…',
                hintStyle: const TextStyle(color: Color(0xFF475569)),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                contentPadding: const EdgeInsets.all(14),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF334155)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF334155)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF2563EB)),
                ),
              ),
            ),
            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  disabledBackgroundColor: const Color(0xFF2563EB).withOpacity(0.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _submitting
                    ? const SizedBox(width: 20, height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Submit Report',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(text, style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
  );

  Widget _numField(TextEditingController ctrl, String hint, {bool isInt = false, bool required = true}) {
    return TextFormField(
      controller: ctrl,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      style: const TextStyle(color: Colors.white, fontSize: 14),
      validator: required ? (v) {
        if (v == null || v.isEmpty) return 'Required';
        if (double.tryParse(v) == null) return 'Invalid number';
        return null;
      } : null,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Color(0xFF475569)),
        filled: true,
        fillColor: const Color(0xFF1E293B),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF2563EB))),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFEF4444))),
        focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFEF4444))),
      ),
    );
  }
}

class _GpsStatusCard extends StatelessWidget {
  final bool loading, obtained;
  final double? lat, lng;
  final VoidCallback onRetry;
  const _GpsStatusCard({required this.loading, required this.obtained, this.lat, this.lng, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    Color bg, iconColor;
    IconData icon;
    String title, subtitle;

    if (loading) {
      bg = const Color(0xFFF59E0B).withOpacity(0.1);
      iconColor = const Color(0xFFF59E0B);
      icon = Icons.location_searching_rounded;
      title = 'Getting GPS Location…';
      subtitle = 'Please wait';
    } else if (obtained) {
      bg = const Color(0xFF10B981).withOpacity(0.1);
      iconColor = const Color(0xFF10B981);
      icon = Icons.location_on_rounded;
      title = 'GPS Location Obtained';
      subtitle = '${lat!.toStringAsFixed(5)}, ${lng!.toStringAsFixed(5)}';
    } else {
      bg = const Color(0xFFEF4444).withOpacity(0.1);
      iconColor = const Color(0xFFEF4444);
      icon = Icons.location_off_rounded;
      title = 'GPS Unavailable';
      subtitle = 'Report may fail GPS validation';
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: iconColor.withOpacity(0.3)),
      ),
      child: Row(children: [
        loading
            ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: iconColor))
            : Icon(icon, color: iconColor, size: 20),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: iconColor)),
          Text(subtitle, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
        ])),
        if (!loading && !obtained)
          GestureDetector(
            onTap: onRetry,
            child: Text('Retry', style: TextStyle(fontSize: 12, color: iconColor, fontWeight: FontWeight.w600)),
          ),
      ]),
    );
  }
}
