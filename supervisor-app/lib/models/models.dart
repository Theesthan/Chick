class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final bool isActive;

  const User({required this.id, required this.name, required this.email, required this.role, required this.isActive});

  factory User.fromJson(Map<String, dynamic> j) => User(
    id: j['id'], name: j['name'], email: j['email'],
    role: j['role'], isActive: j['is_active'],
  );
}

class Farm {
  final String id;
  final String siteId;
  final String name;
  final String location;
  final double gpsLat;
  final double gpsLng;
  final int? capacity;

  const Farm({required this.id, required this.siteId, required this.name,
    required this.location, required this.gpsLat, required this.gpsLng, this.capacity});

  factory Farm.fromJson(Map<String, dynamic> j) => Farm(
    id: j['id'], siteId: j['site_id'], name: j['name'],
    location: j['location'],
    gpsLat: (j['gps_lat'] as num).toDouble(),
    gpsLng: (j['gps_lng'] as num).toDouble(),
    capacity: j['capacity'] as int?,
  );
}

class Batch {
  final String id;
  final String farmId;
  final String batchCode;
  final int initialCount;
  final String startDate;
  final String status;

  const Batch({required this.id, required this.farmId, required this.batchCode,
    required this.initialCount, required this.startDate, required this.status});

  factory Batch.fromJson(Map<String, dynamic> j) => Batch(
    id: j['id'], farmId: j['farm_id'], batchCode: j['batch_code'],
    // backend may use chick_count or initial_count
    initialCount: (j['initial_count'] ?? j['chick_count'] ?? 0) as int,
    startDate: j['start_date'] as String,
    status: j['status'] as String,
  );
}

class DailyReport {
  final String id;
  final String batchId;
  final String reportDate;
  final int mortality;
  final double feedConsumed;
  final bool gpsValid;
  final String status;
  final String? rejectionReason;

  const DailyReport({required this.id, required this.batchId, required this.reportDate,
    required this.mortality, required this.feedConsumed, required this.gpsValid,
    required this.status, this.rejectionReason});

  factory DailyReport.fromJson(Map<String, dynamic> j) => DailyReport(
    id: j['id'], batchId: j['batch_id'], reportDate: j['report_date'],
    mortality: j['mortality'] as int,
    feedConsumed: (j['feed_consumed'] as num).toDouble(),
    gpsValid: j['gps_valid'] as bool,
    status: j['status'] as String,
    rejectionReason: j['rejection_reason'] as String?,
  );
}

class Weighing {
  final String id;
  final String batchId;
  final double grossWeight;
  final double cageWeight;
  final double netWeight;
  final int? birdCount;
  final double? avgWeight;
  final String? notes;

  const Weighing({required this.id, required this.batchId, required this.grossWeight,
    required this.cageWeight, required this.netWeight, this.birdCount, this.avgWeight, this.notes});

  factory Weighing.fromJson(Map<String, dynamic> j) => Weighing(
    id: j['id'], batchId: j['batch_id'],
    grossWeight: (j['gross_weight'] as num).toDouble(),
    cageWeight: ((j['cage_weight'] ?? j['tare_weight'] ?? 0) as num).toDouble(),
    netWeight: (j['net_weight'] as num).toDouble(),
    birdCount: j['bird_count'] as int?,
    avgWeight: j['avg_weight'] != null ? (j['avg_weight'] as num).toDouble() : null,
    notes: j['notes'] as String?,
  );
}

class Transport {
  final String id;
  final String batchId;
  final String vehicleNumber;
  final String? driverName;
  final String origin;
  final String destination;
  final String dispatchTime;
  final String? arrivalTime;

  const Transport({required this.id, required this.batchId, required this.vehicleNumber,
    this.driverName, required this.origin, required this.destination,
    required this.dispatchTime, this.arrivalTime});

  factory Transport.fromJson(Map<String, dynamic> j) => Transport(
    id: j['id'], batchId: j['batch_id'], vehicleNumber: j['vehicle_number'],
    driverName: j['driver_name'] as String?,
    origin: j['origin'] as String,
    destination: j['destination'] as String,
    dispatchTime: j['dispatch_time'] as String,
    arrivalTime: j['arrival_time'] as String?,
  );
}
