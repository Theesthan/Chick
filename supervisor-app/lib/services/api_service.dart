import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';
import '../models/models.dart';

const Duration _requestTimeout = Duration(seconds: 8);

String get _baseUrl {
  const configured = String.fromEnvironment('API_BASE_URL', defaultValue: '');
  if (configured.isNotEmpty) return configured;

  if (kIsWeb) return 'http://localhost:8000';

  switch (defaultTargetPlatform) {
    case TargetPlatform.android:
      return 'http://10.0.2.2:8000'; // Android emulator → host localhost
    case TargetPlatform.iOS:
      return 'http://127.0.0.1:8000'; // iOS simulator → host localhost
    default:
      return 'http://localhost:8000';
  }
}

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

class ApiService {
  static String? _token;

  static Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
  }

  static Future<void> saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  static Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  static ApiException _networkException() {
    return ApiException(
      'Cannot reach server at $_baseUrl. Make sure backend is running and this device can access it.',
    );
  }

  static Future<dynamic> _get(String path) async {
    try {
      final res = await http
          .get(Uri.parse('$_baseUrl$path'), headers: _headers)
          .timeout(_requestTimeout);
      if (res.statusCode == 200) return jsonDecode(res.body);
      if (res.statusCode == 401) throw ApiException('Unauthorized');
      throw ApiException(_extractError(res.body));
    } on TimeoutException {
      throw ApiException('Request timed out after ${_requestTimeout.inSeconds}s to $_baseUrl.');
    } on http.ClientException {
      throw _networkException();
    }
  }

  static Future<dynamic> _post(String path, Map<String, dynamic> body) async {
    try {
      final res = await http
          .post(Uri.parse('$_baseUrl$path'), headers: _headers, body: jsonEncode(body))
          .timeout(_requestTimeout);
      if (res.statusCode == 200 || res.statusCode == 201) return jsonDecode(res.body);
      if (res.statusCode == 401) throw ApiException('Unauthorized');
      throw ApiException(_extractError(res.body));
    } on TimeoutException {
      throw ApiException('Request timed out after ${_requestTimeout.inSeconds}s to $_baseUrl.');
    } on http.ClientException {
      throw _networkException();
    }
  }

  static Future<dynamic> _patch(String path, Map<String, dynamic> body) async {
    try {
      final res = await http
          .patch(Uri.parse('$_baseUrl$path'), headers: _headers, body: jsonEncode(body))
          .timeout(_requestTimeout);
      if (res.statusCode == 200) return jsonDecode(res.body);
      throw ApiException(_extractError(res.body));
    } on TimeoutException {
      throw ApiException('Request timed out after ${_requestTimeout.inSeconds}s to $_baseUrl.');
    } on http.ClientException {
      throw _networkException();
    }
  }

  static String _extractError(String body) {
    try {
      final j = jsonDecode(body);
      return j['detail']?.toString() ?? 'Unknown error';
    } catch (_) { return body; }
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  static Future<String> login(String email, String password) async {
    final data = await _post('/auth/login', {'email': email, 'password': password});
    final token = data['access_token'] as String;
    await saveToken(token);
    return token;
  }

  static Future<User> getMe() async {
    final data = await _get('/users/me');
    return User.fromJson(data as Map<String, dynamic>);
  }

  // ── Farms ───────────────────────────────────────────────────────────────────
  static Future<List<Farm>> getFarms() async {
    final data = await _get('/farms/') as List;
    return data.map((j) => Farm.fromJson(j as Map<String, dynamic>)).toList();
  }

  // ── Batches ─────────────────────────────────────────────────────────────────
  static Future<List<Batch>> getBatches() async {
    final data = await _get('/batches/') as List;
    return data.map((j) => Batch.fromJson(j as Map<String, dynamic>)).toList();
  }

  // ── Daily Reports ────────────────────────────────────────────────────────────
  static Future<DailyReport> submitDailyReport({
    required String batchId,
    required int mortality,
    required double feedConsumed,
    double? waterConsumed,
    double? lat,
    double? lng,
    String? notes,
  }) async {
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final body = <String, dynamic>{
      'batch_id': batchId,
      'report_date': today,
      'mortality': mortality,
      'feed_consumed': feedConsumed,
      if (lat != null) 'gps_lat': lat,
      if (lng != null) 'gps_lng': lng,
      if (waterConsumed != null) 'water_consumed': waterConsumed,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    };
    final data = await _post('/daily-reports/', body);
    return DailyReport.fromJson(data as Map<String, dynamic>);
  }

  static Future<List<DailyReport>> getDailyReports({String? batchId}) async {
    final path = batchId != null ? '/daily-reports/?batch_id=$batchId' : '/daily-reports/';
    final data = await _get(path) as List;
    return data.map((j) => DailyReport.fromJson(j as Map<String, dynamic>)).toList();
  }

  // ── Weighing ─────────────────────────────────────────────────────────────────
  static Future<Weighing> recordWeighing({
    required String batchId,
    required double grossWeight,
    required double cageWeight,
    required int birdCount,
    String? notes,
  }) async {
    final body = <String, dynamic>{
      'batch_id': batchId,
      'gross_weight': grossWeight,
      'cage_weight': cageWeight,
      'bird_count': birdCount,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    };
    final data = await _post('/weighing/', body);
    return Weighing.fromJson(data as Map<String, dynamic>);
  }

  static Future<List<Weighing>> getWeighings({String? batchId}) async {
    final path = batchId != null ? '/weighing/?batch_id=$batchId' : '/weighing/';
    final data = await _get(path) as List;
    return data.map((j) => Weighing.fromJson(j as Map<String, dynamic>)).toList();
  }

  // ── Transport ────────────────────────────────────────────────────────────────
  static Future<Transport> createTransport({
    required String batchId,
    required String vehicleNumber,
    required String driverName,
    required String destination,
    required int birdCount,
    String origin = 'Farm',
  }) async {
    final dispatchTime = DateTime.now().toUtc().toIso8601String();
    final body = <String, dynamic>{
      'batch_id': batchId,
      'vehicle_number': vehicleNumber,
      'driver_name': driverName,
      'origin': origin,
      'destination': destination,
      'dispatch_time': dispatchTime,
      'bird_count': birdCount,
    };
    final data = await _post('/transport/', body);
    return Transport.fromJson(data as Map<String, dynamic>);
  }
}
