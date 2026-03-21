import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class WeighingScreen extends StatefulWidget {
  final List<Batch> batches;
  const WeighingScreen({super.key, required this.batches});

  @override
  State<WeighingScreen> createState() => _WeighingScreenState();
}

class _WeighingScreenState extends State<WeighingScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  String? _selectedBatchId;
  final _grossCtrl = TextEditingController();
  final _cageCtrl = TextEditingController();
  final _countCtrl = TextEditingController();
  bool _submitting = false;
  bool _success = false;

  late AnimationController _successCtrl;
  late Animation<double> _successScale;

  double get _netWeight {
    final gross = double.tryParse(_grossCtrl.text) ?? 0;
    final cage = double.tryParse(_cageCtrl.text) ?? 0;
    return (gross - cage).clamp(0, double.infinity);
  }

  double get _avgWeight {
    final count = int.tryParse(_countCtrl.text) ?? 0;
    if (count == 0) return 0;
    return _netWeight / count;
  }

  @override
  void initState() {
    super.initState();
    _successCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _successScale = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _successCtrl, curve: Curves.elasticOut),
    );
    if (widget.batches.isNotEmpty) _selectedBatchId = widget.batches.first.id;

    _grossCtrl.addListener(() => setState(() {}));
    _cageCtrl.addListener(() => setState(() {}));
    _countCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _grossCtrl.dispose();
    _cageCtrl.dispose();
    _countCtrl.dispose();
    _successCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedBatchId == null) return;
    setState(() => _submitting = true);
    try {
      await ApiService.recordWeighing(
        batchId: _selectedBatchId!,
        grossWeight: double.parse(_grossCtrl.text),
        cageWeight: double.parse(_cageCtrl.text),
        birdCount: int.parse(_countCtrl.text),
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
        title: const Text('Record Weighing', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
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
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 44),
          ),
          const SizedBox(height: 16),
          const Text('Weighing Recorded!',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 6),
          const Text('The weighing data has been saved.',
              style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
        ]),
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
                  value: b.id, child: Text(b.batchCode),
                )).toList(),
                onChanged: (v) => setState(() => _selectedBatchId = v),
              ),
            ),
            const SizedBox(height: 14),

            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _label('Gross Weight (kg)'),
                _numField(_grossCtrl, '520.0'),
              ])),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _label('Cage Weight (kg)'),
                _numField(_cageCtrl, '20.0'),
              ])),
            ]),
            const SizedBox(height: 14),

            _label('Number of Birds'),
            _numField(_countCtrl, '100', isInt: true),
            const SizedBox(height: 16),

            // Live weight preview card
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: _netWeight > 0 ? const Color(0xFF2563EB).withOpacity(0.5) : const Color(0xFF334155),
                ),
              ),
              child: Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Net Weight', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  const SizedBox(height: 4),
                  Text(
                    '${_netWeight.toStringAsFixed(2)} kg',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ])),
                Container(width: 1, height: 40, color: const Color(0xFF334155)),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  const Text('Avg / Bird', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  const SizedBox(height: 4),
                  Text(
                    '${_avgWeight.toStringAsFixed(3)} kg',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                  ),
                ])),
              ]),
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
                    : const Text('Save Weighing',
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

  Widget _numField(TextEditingController ctrl, String hint, {bool isInt = false}) {
    return TextFormField(
      controller: ctrl,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      style: const TextStyle(color: Colors.white, fontSize: 14),
      validator: (v) {
        if (v == null || v.isEmpty) return 'Required';
        if (isInt && int.tryParse(v) == null) return 'Invalid number';
        if (!isInt && double.tryParse(v) == null) return 'Invalid number';
        return null;
      },
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
