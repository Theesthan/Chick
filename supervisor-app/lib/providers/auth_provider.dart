import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _loading = false;
  String? _error;

  User? get user => _user;
  bool get loading => _loading;
  String? get error => _error;
  bool get isLoggedIn => _user != null;

  Future<void> hydrate() async {
    await ApiService.loadToken();
    try {
      _user = await ApiService.getMe();
      notifyListeners();
    } catch (_) {
      await ApiService.clearToken();
    }
  }

  Future<bool> login(String email, String password) async {
    _loading = true; _error = null; notifyListeners();
    try {
      await ApiService.login(email, password);
      _user = await ApiService.getMe();
      _loading = false; notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString(); _loading = false; notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await ApiService.clearToken();
    _user = null; notifyListeners();
  }
}
