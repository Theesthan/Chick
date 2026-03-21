import 'package:flutter/material.dart';

class AnimatedButton extends StatefulWidget {
  final String label;
  final bool loading;
  final VoidCallback onPressed;
  final Color? color;

  const AnimatedButton({
    super.key,
    required this.label,
    required this.loading,
    required this.onPressed,
    this.color,
  });

  @override
  State<AnimatedButton> createState() => _AnimatedButtonState();
}

class _AnimatedButtonState extends State<AnimatedButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 120));
    _scale = Tween<double>(begin: 1, end: 0.96).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _onTapDown(_) => _ctrl.forward();
  void _onTapUp(_) => _ctrl.reverse();
  void _onTapCancel() => _ctrl.reverse();

  @override
  Widget build(BuildContext context) {
    final bg = widget.color ?? const Color(0xFF2563EB);
    return GestureDetector(
      onTapDown: widget.loading ? null : _onTapDown,
      onTapUp: widget.loading ? null : _onTapUp,
      onTapCancel: widget.loading ? null : _onTapCancel,
      onTap: widget.loading ? null : widget.onPressed,
      child: ScaleTransition(
        scale: _scale,
        child: Container(
          width: double.infinity,
          height: 48,
          decoration: BoxDecoration(
            color: widget.loading ? bg.withOpacity(0.6) : bg,
            borderRadius: BorderRadius.circular(12),
            boxShadow: widget.loading
                ? null
                : [BoxShadow(color: bg.withOpacity(0.4), blurRadius: 12, offset: const Offset(0, 4))],
          ),
          child: Center(
            child: widget.loading
                ? const SizedBox(
                    width: 20, height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Text(widget.label,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
          ),
        ),
      ),
    );
  }
}
