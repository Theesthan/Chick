import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class TransportScreen extends StatefulWidget {
  final List<Batch> batches;
  const TransportScreen({super.key, required this.batches});

  @override
  State<TransportScreen> createState() => _TransportScreenState();
}

class _TransportScreenState extends State<TransportScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  String? _selectedBatchId;
  final _vehicleCtrl = TextEditingController();
  final _driverCtrl = TextEditingController();
  final _destinationCtrl = TextEditingController();
  final _countCtrl = TextEditingController();
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
    if (widget.batches.isNotEmpty) _selectedBatchId = widget.batches.first.id;
  }

  @override
  void dispose() {
    _vehicleCtrl.dispose();
    _driverCtrl.dispose();
    _destinationCtrl.dispose();
    _countCtrl.dispose();
    _successCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedBatchId == null) return;
    setState(() => _submitting = true);
    try {
      await ApiService.createTransport(
        batchId: _selectedBatchId!,
        vehicleNumber: _vehicleCtrl.text.trim(),
        driverName: _driverCtrl.text.trim(),
        destination: _destinationCtrl.text.trim(),
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
        title: const Text('Create Transport', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
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
              color: const Color(0xFF8B5CF6).withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.local_shipping_rounded, color: Color(0xFF8B5CF6), size: 44),
          ),
          const SizedBox(height: 16),
          const Text('Transport Dispatched!',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 6),
          const Text('The transport record has been created.',
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
            // Info banner
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.3)),
              ),
              child: Row(children: [
                const Icon(Icons.info_outline_rounded, color: Color(0xFF8B5CF6), size: 16),
                const SizedBox(width: 8),
                const Expanded(child: Text(
                  'Dispatch time will be recorded automatically when you submit.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                )),
              ]),
            ),
            const SizedBox(height: 16),

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
                _label('Vehicle Number'),
                _textField(_vehicleCtrl, 'MH 12 AB 1234'),
              ])),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _label('Bird Count'),
                _numField(_countCtrl, '500'),
              ])),
            ]),
            const SizedBox(height: 14),

            _label('Driver Name'),
            _textField(_driverCtrl, 'Rajesh Kumar'),
            const SizedBox(height: 14),

            _label('Destination'),
            _textField(_destinationCtrl, 'Processing Plant A'),
            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF8B5CF6),
                  disabledBackgroundColor: const Color(0xFF8B5CF6).withOpacity(0.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _submitting
                    ? const SizedBox(width: 20, height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Row(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.local_shipping_rounded, size: 18, color: Colors.white),
                        SizedBox(width: 8),
                        Text('Dispatch', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
                      ]),
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

  InputDecoration _dec(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: Color(0xFF475569)),
    filled: true,
    fillColor: const Color(0xFF1E293B),
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF334155))),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF8B5CF6))),
    errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFEF4444))),
    focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFEF4444))),
  );

  Widget _textField(TextEditingController ctrl, String hint) {
    return TextFormField(
      controller: ctrl,
      style: const TextStyle(color: Colors.white, fontSize: 14),
      validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
      decoration: _dec(hint),
    );
  }

  Widget _numField(TextEditingController ctrl, String hint) {
    return TextFormField(
      controller: ctrl,
      keyboardType: TextInputType.number,
      style: const TextStyle(color: Colors.white, fontSize: 14),
      validator: (v) {
        if (v == null || v.isEmpty) return 'Required';
        if (int.tryParse(v) == null) return 'Invalid';
        return null;
      },
      decoration: _dec(hint),
    );
  }
}
