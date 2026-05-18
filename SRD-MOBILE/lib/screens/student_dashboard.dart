import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';
import '../core/theme/app_theme.dart';

class StudentDashboard extends StatefulWidget {
  const StudentDashboard({Key? key}) : super(key: key);

  @override
  State<StudentDashboard> createState() => _StudentDashboardState();
}

class _StudentDashboardState extends State<StudentDashboard> with SingleTickerProviderStateMixin {
  late TabController _dayTabController;
  bool _isFullGridView = false; // Toggle between Daily View and Full 2D Grid
  bool _isLandscapeMode = false; // Toggle for landscape view in full table

  final List<String> _daysEnglish = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  final List<String> _daysArabic = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

  // Pre-configured dropdown values for AAST students
  final List<String> _colleges = ['حاسبات ومعلومات', 'الهندسة', 'الحاسبات', 'إدارة الأعمال', 'النقل الدولي', 'النقل البحري'];
  final List<String> _departments = ['هندسة البرمجيات', 'علوم الحاسب', 'حاسبات', 'تسويق', 'اتصالات', 'ميكانيكا', 'نقل بحري', 'عام'];
  final List<String> _groups = ['F', 'A', 'B', 'C', 'D', 'E', '1', '2', '3'];

  @override
  void initState() {
    super.initState();
    _dayTabController = TabController(length: _daysEnglish.length, vsync: this);
  }

  @override
  void dispose() {
    // Reset orientation to portrait on leaving/destroying this widget
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    _dayTabController.dispose();
    super.dispose();
  }

  // Helper to parse day of week name from date string YYYY-MM-DD
  String _getDayOfWeekName(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      switch (date.weekday) {
        case 1: return 'MONDAY';
        case 2: return 'TUESDAY';
        case 3: return 'WEDNESDAY';
        case 4: return 'THURSDAY';
        case 5: return 'FRIDAY';
        case 6: return 'SATURDAY';
        case 7: return 'SUNDAY';
        default: return '';
      }
    } catch (e) {
      return '';
    }
  }

  // Determine slot index from timeFrom string (maps 08:30 -> Slot 1, 09:30 -> Slot 2, etc.)
  int _determineSlotIndex(String timeFrom) {
    if (!timeFrom.contains(":")) return 1;
    try {
      final clean = timeFrom.replaceAll(RegExp(r'[صمAMPM ]'), '').trim();
      final parts = clean.split(":");
      int hour = int.parse(parts[0]);
      
      bool hasMeridiem = timeFrom.contains("ص") || timeFrom.contains("م") || 
                         timeFrom.toUpperCase().contains("AM") || timeFrom.toUpperCase().contains("PM");
      if (hasMeridiem) {
        bool isPM = timeFrom.contains("م") || timeFrom.toUpperCase().contains("PM");
        if (isPM && hour < 12) {
          hour += 12;
        } else if (!isPM && hour == 12) {
          hour = 0;
        }
      }
      
      // Period 1 starts at 08:30 -> hour = 8
      int period = hour - 8 + 1;
      if (period >= 1 && period <= 16) {
        return period;
      }
    } catch (e) {
      print('Error parsing timeFrom slot index: $e');
    }
    return 1;
  }

  // Deduplicate and process Firestore bookings list into slot structures
  Map<String, List<Map<String, dynamic>>> _processScheduleBookings(List<Map<String, dynamic>> bookings) {
    Map<String, List<Map<String, dynamic>>> processed = {};
    // Initialize day map lists for 16 slots (indices 0 to 16, index 0 is unused)
    for (var day in _daysEnglish) {
      processed[day] = List.generate(17, (_) => {});
    }

    // Unique keys tracking to deduplicate weekly recurring bookings
    Set<String> uniqueKeys = {};

    for (var b in bookings) {
      final dateStr = b['date'] as String?;
      if (dateStr == null) continue;

      final dayOfWeek = _getDayOfWeekName(dateStr);
      if (!_daysEnglish.contains(dayOfWeek)) continue;

      final timeFrom = b['timeFrom'] as String? ?? '';
      final courseCode = b['courseCode'] as String? ?? '';
      final lectureType = b['lectureType'] as String? ?? 'lecture';

      // Deduplicate recurring bookings
      final key = "${dayOfWeek}_${timeFrom}_${courseCode}_$lectureType";
      if (uniqueKeys.contains(key)) continue;
      uniqueKeys.add(key);

      final slotIdx = _determineSlotIndex(timeFrom);
      final biWeekly = b['biWeekly'] == true || b['isBiWeekly'] == true;

      if (slotIdx >= 1 && slotIdx <= 16) {
        if (biWeekly) {
          // Bi-weekly occupies only the single period slotIdx
          processed[dayOfWeek]![slotIdx] = b;
        } else {
          // Weekly occupies period slotIdx and slotIdx + 1
          processed[dayOfWeek]![slotIdx] = b;
          if (slotIdx + 1 <= 16) {
            processed[dayOfWeek]![slotIdx + 1] = b;
          }
        }
      }
    }

    return processed;
  }

  // Dialog to let student edit their class profile dropdown fields
  void _showClassProfileDialog(AuthProvider authProvider) {
    String localCollege = authProvider.selectedCollege;
    String localDept = authProvider.selectedDepartment;
    String localGroup = authProvider.selectedGroup;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Directionality(
              textDirection: TextDirection.rtl,
              child: Padding(
                padding: EdgeInsets.only(
                  bottom: MediaQuery.of(context).viewInsets.bottom,
                  left: 24,
                  right: 24,
                  top: 24,
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'إعدادات الملف الدراسي',
                        style: GoogleFonts.cairo(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'اختر تفاصيل الكلية والقسم والجروب لجلب جدولك الدراسي الفوري.',
                        style: GoogleFonts.cairo(
                          fontSize: 13,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // College selection dropdown
                      Text(
                        'الكلية',
                        style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: AppTheme.lightBlueBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _colleges.contains(localCollege) ? localCollege : _colleges.first,
                            isExpanded: true,
                            items: _colleges.map((c) {
                              return DropdownMenuItem<String>(
                                value: c,
                                child: Text(c, style: GoogleFonts.cairo(fontSize: 14, color: AppTheme.lightTextPrimary)),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setModalState(() => localCollege = val);
                              }
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Department selection dropdown
                      Text(
                        'القسم الدراسي',
                        style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: AppTheme.lightBlueBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _departments.contains(localDept) ? localDept : _departments.last,
                            isExpanded: true,
                            items: _departments.map((d) {
                              return DropdownMenuItem<String>(
                                value: d,
                                child: Text(d, style: GoogleFonts.cairo(fontSize: 14, color: AppTheme.lightTextPrimary)),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setModalState(() => localDept = val);
                              }
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Group selection dropdown
                      Text(
                        'الشعبة / الجروب',
                        style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: AppTheme.lightBlueBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _groups.contains(localGroup) ? localGroup : _groups.first,
                            isExpanded: true,
                            items: _groups.map((g) {
                              return DropdownMenuItem<String>(
                                value: g,
                                child: Text(g, style: GoogleFonts.cairo(fontSize: 14, color: AppTheme.lightTextPrimary)),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setModalState(() => localGroup = val);
                              }
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),

                      // Save profile button
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          authProvider.updateClassSelection(
                            college: localCollege,
                            department: localDept,
                            group: localGroup,
                          );
                          Navigator.pop(context);
                        },
                        child: Text(
                          'تحديث وعرض الجدول',
                          style: GoogleFonts.cairo(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildProfileDrawer(
    BuildContext context,
    AuthProvider authProvider,
    String studentName,
    String studentId,
  ) {
    return Drawer(
      child: Container(
        color: AppTheme.lightBg,
        child: Column(
          children: [
            // Drawer Header with Gradient Background
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.primaryColor, AppTheme.secondaryColor],
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                ),
              ),
              currentAccountPicture: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const CircleAvatar(
                  backgroundColor: Colors.white,
                  child: Icon(
                    Icons.person_rounded,
                    size: 40,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
              accountName: Text(
                studentName,
                style: GoogleFonts.cairo(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              accountEmail: Text(
                'كود الطالب: $studentId',
                style: GoogleFonts.cairo(
                  fontSize: 12,
                  color: Colors.white70,
                ),
              ),
            ),
            
            // Detailed Info Cards list
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                children: [
                  _buildProfileDetailCard('الاسم الكامل', studentName, Icons.person_outline),
                  _buildProfileDetailCard('الرقم الدراسي / الكود', studentId, Icons.badge_outlined),
                  _buildProfileDetailCard('الكلية', authProvider.selectedCollege, Icons.account_balance_outlined),
                  _buildProfileDetailCard('القسم الدراسي', authProvider.selectedDepartment, Icons.layers_outlined),
                  _buildProfileDetailCard('الشعبة / الجروب الحالي', authProvider.selectedGroup, Icons.groups_outlined),
                ],
              ),
            ),

            // Logout Button placed nicely at the bottom
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.dangerColor,
                  minimumSize: const Size.fromHeight(50),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 2,
                ),
                icon: const Icon(Icons.logout_rounded, color: Colors.white),
                label: Text(
                  'تسجيل الخروج',
                  style: GoogleFonts.cairo(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                onPressed: () {
                  Navigator.pop(context); // Close Drawer
                  authProvider.logout();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileDetailCard(String title, String value, IconData icon) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: Colors.white,
      elevation: 0.5,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.lightBlueBg,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 20, color: AppTheme.primaryColor),
        ),
        title: Text(
          title,
          style: GoogleFonts.cairo(
            fontSize: 11,
            color: AppTheme.lightTextSecondary,
          ),
        ),
        subtitle: Text(
          value,
          style: GoogleFonts.cairo(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: AppTheme.lightTextPrimary,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final userData = authProvider.userData;
    final scheduleBookings = authProvider.scheduleBookings;

    // Deduplicated grid slots map
    final scheduleGrid = _processScheduleBookings(scheduleBookings);

    final studentName = userData?['displayName'] ?? authProvider.currentUser?.displayName ?? 'طالب الأكاديمية';
    final studentId = userData?['studentId'] ?? authProvider.currentUser?.email?.split('@').first ?? 'N/A';

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: AppTheme.lightBg,
        endDrawer: _buildProfileDrawer(context, authProvider, studentName, studentId),
        appBar: _isLandscapeMode
            ? null
            : AppBar(
                backgroundColor: Colors.white,
                elevation: 0,
                toolbarHeight: 70,
                title: Row(
                  children: [
                    // AAST Small Brand Logo in Header
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppTheme.lightBlueAccent, width: 1.5),
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/images/logo_aast.jpg',
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => const Icon(Icons.school, color: AppTheme.primaryColor),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          studentName,
                          style: GoogleFonts.cairo(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.lightTextPrimary,
                          ),
                        ),
                        Text(
                          'كود الطالب: $studentId',
                          style: GoogleFonts.cairo(
                            fontSize: 11,
                            color: AppTheme.lightTextSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                actions: [
                  Builder(
                    builder: (context) => IconButton(
                      icon: const CircleAvatar(
                        radius: 18,
                        backgroundColor: AppTheme.lightBlueBg,
                        child: Icon(
                          Icons.person_rounded,
                          color: AppTheme.primaryColor,
                          size: 20,
                        ),
                      ),
                      tooltip: 'الملف الشخصي',
                      onPressed: () {
                        Scaffold.of(context).openEndDrawer();
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
              ),
        floatingActionButton: _isFullGridView
            ? FloatingActionButton.extended(
                onPressed: () {
                  setState(() {
                    _isLandscapeMode = !_isLandscapeMode;
                    if (_isLandscapeMode) {
                      SystemChrome.setPreferredOrientations([
                        DeviceOrientation.landscapeLeft,
                        DeviceOrientation.landscapeRight,
                      ]);
                    } else {
                      SystemChrome.setPreferredOrientations([
                        DeviceOrientation.portraitUp,
                      ]);
                    }
                  });
                },
                backgroundColor: AppTheme.secondaryColor,
                icon: Icon(
                  _isLandscapeMode ? Icons.screen_lock_portrait : Icons.screen_rotation,
                  color: Colors.white,
                ),
                label: Text(
                  _isLandscapeMode ? 'الوضع الرأسي' : 'تدوير الشاشة بالعرض',
                  style: GoogleFonts.cairo(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: Colors.white,
                  ),
                ),
              )
            : null,
        body: Column(
          children: [
            // 1. Sleek Active Class Banner with edit options
            if (!_isLandscapeMode) ...[
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'الجدول النشط الحالي:',
                            style: GoogleFonts.cairo(
                              fontSize: 12,
                              color: AppTheme.lightTextSecondary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              _buildInfoChip(authProvider.selectedCollege, Icons.account_balance),
                              const SizedBox(width: 6),
                              _buildInfoChip(authProvider.selectedDepartment, Icons.layers),
                              const SizedBox(width: 6),
                              _buildInfoChip('جروب ${authProvider.selectedGroup}', Icons.groups),
                            ],
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      style: IconButton.styleFrom(
                        backgroundColor: AppTheme.lightBlueBg,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.settings_suggest, color: AppTheme.primaryColor),
                      onPressed: () => _showClassProfileDialog(authProvider),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: Color(0xFFF1F5F9)),
            ],

            // 2. View Toggle Bar (Daily vs Full Network Table Grid)
            if (!_isLandscapeMode) ...[
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    Expanded(
                      child: SegmentedButton<bool>(
                        segments: const <ButtonSegment<bool>>[
                          ButtonSegment<bool>(
                            value: false,
                            label: Text('الجدول اليومي الرأسي'),
                            icon: Icon(Icons.view_day_outlined),
                          ),
                          ButtonSegment<bool>(
                            value: true,
                            label: Text('شبكة الجدول الكامل (2D)'),
                            icon: Icon(Icons.grid_on_rounded),
                          ),
                        ],
                        selected: <bool>{_isFullGridView},
                        onSelectionChanged: (Set<bool> newSelection) {
                          setState(() {
                            _isFullGridView = newSelection.first;
                          });
                        },
                        style: SegmentedButton.styleFrom(
                          selectedBackgroundColor: AppTheme.primaryColor,
                          selectedForegroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          textStyle: GoogleFonts.cairo(fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // 3. Dynamic display block based on layout type selection
            Expanded(
              child: _isFullGridView
                  ? _buildZoomable2DGridTable(scheduleGrid)
                  : _buildDailyTabView(scheduleGrid),
            ),
          ],
        ),
      ),
    );
  }

  // Info Chip widget helper
  Widget _buildInfoChip(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.lightBlueBg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.lightBlueAccent.withOpacity(0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AppTheme.secondaryColor),
          const SizedBox(width: 4),
          Text(
            label,
            style: GoogleFonts.cairo(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }

  // VIEW 1: Daily list display segmented into beautiful day slides
  Widget _buildDailyTabView(Map<String, List<Map<String, dynamic>>> scheduleGrid) {
    return Column(
      children: [
        // Slide selectors for Day Tab
        Container(
          color: Colors.white,
          child: TabBar(
            controller: _dayTabController,
            isScrollable: true,
            labelColor: AppTheme.primaryColor,
            unselectedLabelColor: AppTheme.lightTextSecondary,
            indicatorColor: AppTheme.primaryColor,
            indicatorWeight: 3,
            labelStyle: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14),
            unselectedLabelStyle: GoogleFonts.cairo(fontSize: 13),
            tabs: _daysArabic.map((day) => Tab(text: day)).toList(),
          ),
        ),
        const SizedBox(height: 12),
        // Day Slide Panels
        Expanded(
          child: TabBarView(
            controller: _dayTabController,
            children: _daysEnglish.map((dayEng) {
              final daySlots = scheduleGrid[dayEng]!;
              final List<Map<String, dynamic>> occupiedSlots = [];

              for (int slotIdx = 1; slotIdx <= 8; slotIdx++) {
                final p1 = (slotIdx - 1) * 2 + 1;
                final p2 = p1 + 1;
                final lecture1 = daySlots[p1];
                final lecture2 = daySlots[p2];
                if (lecture1.isNotEmpty || lecture2.isNotEmpty) {
                  final lecture = lecture1.isNotEmpty ? lecture1 : lecture2;
                  String slotTime = "";
                  switch (slotIdx) {
                    case 1: slotTime = "08:30 ص - 10:30 ص"; break;
                    case 2: slotTime = "10:30 ص - 12:30 م"; break;
                    case 3: slotTime = "12:30 م - 02:30 م"; break;
                    case 4: slotTime = "02:30 م - 04:30 م"; break;
                    case 5: slotTime = "04:30 م - 06:30 م"; break;
                    case 6: slotTime = "06:30 م - 08:30 م"; break;
                    case 7: slotTime = "08:30 م - 10:30 م"; break;
                    case 8: slotTime = "10:30 م - 12:30 ص"; break;
                  }
                  occupiedSlots.add({
                    'slotIdx': slotIdx,
                    'timeLabel': slotTime,
                    'lecture': lecture,
                  });
                }
              }

              if (occupiedSlots.isEmpty) {
                return Center(
                  child: SingleChildScrollView(
                    child: Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF0FDF4),
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFFDCFCE7), width: 2),
                            ),
                            child: const Icon(
                              Icons.celebration_rounded,
                              size: 64,
                              color: Color(0xFF16A34A),
                            ),
                          ),
                          const SizedBox(height: 20),
                          Text(
                            'يوم خالٍ من المحاضرات! 🎉',
                            style: GoogleFonts.cairo(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryColor,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'استمتع بوقتك اليوم، لا توجد أي محاضرات أو سكاشن مجدولة.',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.cairo(
                              fontSize: 13,
                              color: AppTheme.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                itemCount: occupiedSlots.length,
                itemBuilder: (context, index) {
                  final slot = occupiedSlots[index];
                  return _buildDailySlotCard(
                    slot['slotIdx'] as int,
                    slot['timeLabel'] as String,
                    slot['lecture'] as Map<String, dynamic>,
                  );
                },
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  // Single card element for Daily View
  Widget _buildDailySlotCard(int slotIdx, String timeLabel, Map<String, dynamic> lecture) {
    final isOccupied = lecture.isNotEmpty;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isOccupied ? AppTheme.lightBlueAccent : const Color(0xFFF1F5F9),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.015),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: IntrinsicHeight(
          child: Row(
            children: [
              // Vertical Period Label Bar
              Container(
                width: 60,
                color: isOccupied ? AppTheme.primaryColor : const Color(0xFFF1F5F9),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'فترة',
                      style: GoogleFonts.cairo(
                        fontSize: 10,
                        color: isOccupied ? Colors.white70 : AppTheme.lightTextSecondary,
                        height: 1.2,
                      ),
                    ),
                    Text(
                      '$slotIdx',
                      style: GoogleFonts.cairo(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: isOccupied ? Colors.white : AppTheme.primaryColor,
                        height: 1.2,
                      ),
                    ),
                  ],
                ),
              ),

              // Horizontal details panel
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: isOccupied
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Timing and Category labels
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.access_time, size: 13, color: AppTheme.secondaryColor),
                                    const SizedBox(width: 4),
                                    Text(
                                      timeLabel,
                                      style: GoogleFonts.cairo(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.secondaryColor,
                                      ),
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: (lecture['lectureType']?.toString().toLowerCase() == 'section')
                                        ? const Color(0xFFFEF3C7) // golden tint
                                        : const Color(0xFFDCFCE7), // green tint
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    (lecture['lectureType']?.toString().toLowerCase() == 'section')
                                        ? 'سيكشن'
                                        : 'محاضرة',
                                    style: GoogleFonts.cairo(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      color: (lecture['lectureType']?.toString().toLowerCase() == 'section')
                                          ? const Color(0xFFD97706)
                                          : const Color(0xFF15803D),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),

                            // Subject Name and Code
                            Text(
                              "⚪ ${lecture['courseCode'] ?? 'N/A'} - ${lecture['courseName'] ?? 'N/A'}",
                              style: GoogleFonts.cairo(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.lightTextPrimary,
                              ),
                            ),
                            const SizedBox(height: 6),

                            // Lecturer Name
                            Row(
                              children: [
                                const Icon(Icons.person_outline, size: 14, color: AppTheme.lightTextSecondary),
                                const SizedBox(width: 4),
                                Text(
                                  lecture['lecturerName'] ?? 'N/A',
                                  style: GoogleFonts.cairo(
                                    fontSize: 12,
                                    color: AppTheme.lightTextSecondary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),

                            // Room Location Details
                            Row(
                              children: [
                                const Icon(Icons.place_outlined, size: 14, color: AppTheme.primaryColor),
                                const SizedBox(width: 4),
                                Text(
                                  'قاعة المحاضرة: ${lecture['roomId'] ?? 'N/A'}',
                                  style: GoogleFonts.cairo(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.access_time, size: 13, color: Colors.grey),
                                const SizedBox(width: 4),
                                Text(
                                  timeLabel,
                                  style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'فترة فارغة',
                              style: GoogleFonts.cairo(
                                fontSize: 13,
                                color: Colors.grey.shade400,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // VIEW 2: Premium 2D Grid Table similar to Excel/Desktop showing days as rows and periods as columns
  // Panning and zooming is handled effortlessly by the InteractiveViewer.
  Widget _buildZoomable2DGridTable(Map<String, List<Map<String, dynamic>>> scheduleGrid) {
    const double dayColWidth = 85.0;
    const double periodColWidth = 65.0;
    const double headerRowHeight = 44.0;
    const double dayRowHeight = 90.0;
    
    // We have 16 periods in total (8 slots * 2 periods/slot)
    const int totalPeriods = 16;

    List<Widget> rows = [];

    // 1. Header Row (Day + 16 Periods)
    rows.add(
      Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: dayColWidth,
            height: headerRowHeight,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: AppTheme.secondaryColor,
              border: Border(
                bottom: BorderSide(color: Color(0xFFCBD5E1)),
                left: BorderSide(color: Color(0xFFCBD5E1)),
                top: BorderSide(color: Color(0xFFCBD5E1)),
                right: BorderSide(color: Color(0xFFCBD5E1)),
              ),
            ),
            child: Text(
              'اليوم',
              style: GoogleFonts.cairo(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ),
          ...List.generate(totalPeriods, (index) {
            return Container(
              width: periodColWidth,
              height: headerRowHeight,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: AppTheme.secondaryColor,
                border: Border(
                  bottom: BorderSide(color: Color(0xFFCBD5E1)),
                  left: BorderSide(color: Color(0xFFCBD5E1)),
                  top: BorderSide(color: Color(0xFFCBD5E1)),
                ),
              ),
              child: Text(
                '${index + 1}',
                style: GoogleFonts.cairo(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            );
          }),
        ],
      ),
    );

    // 2. Day Rows (Saturday -> Friday)
    for (int d = 0; d < _daysEnglish.length; d++) {
      final dayEng = _daysEnglish[d];
      final dayAr = _daysArabic[d];
      final daySlots = scheduleGrid[dayEng]!;
      
      List<Widget> rowCells = [];
      
      // Add Day Header
      rowCells.add(
        Container(
          width: dayColWidth,
          height: dayRowHeight,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withOpacity(0.95),
            border: const Border(
              bottom: BorderSide(color: Color(0xFFCBD5E1)),
              left: BorderSide(color: Color(0xFFCBD5E1)),
              right: BorderSide(color: Color(0xFFCBD5E1)),
            ),
          ),
          child: Text(
            dayAr,
            style: GoogleFonts.cairo(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ),
      );

      // Period-by-period dynamic loop spanning 1 to 16
      int p = 1;
      while (p <= 16) {
        final lecture = daySlots[p];
        if (lecture.isNotEmpty) {
          final isBiWeekly = lecture['biWeekly'] == true || lecture['isBiWeekly'] == true;
          bool isWeeklySpan = false;
          if (!isBiWeekly && p < 16) {
            final nextLecture = daySlots[p + 1];
            if (nextLecture.isNotEmpty && nextLecture['id'] == lecture['id']) {
              isWeeklySpan = true;
            }
          }

          if (isWeeklySpan) {
            // Weekly occupies 2 consecutive periods (merge them)
            rowCells.add(
              Container(
                width: periodColWidth * 2,
                height: dayRowHeight,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    bottom: BorderSide(color: Color(0xFFCBD5E1)),
                    left: BorderSide(color: Color(0xFFCBD5E1)),
                  ),
                ),
                child: _buildGridLectureCell(lecture, height: dayRowHeight, compact: false),
              ),
            );
            p += 2;
          } else {
            // Standalone or bi-weekly single-period slice (render single cell width)
            rowCells.add(
              Container(
                width: periodColWidth,
                height: dayRowHeight,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    bottom: BorderSide(color: Color(0xFFCBD5E1)),
                    left: BorderSide(color: Color(0xFFCBD5E1)),
                  ),
                ),
                child: _buildGridLectureCell(lecture, height: dayRowHeight, compact: true),
              ),
            );
            p += 1;
          }
        } else {
          // Empty period
          rowCells.add(
            Container(
              width: periodColWidth,
              height: dayRowHeight,
              decoration: const BoxDecoration(
                color: Color(0xFFF8FAFC),
                border: Border(
                  bottom: BorderSide(color: Color(0xFFCBD5E1)),
                  left: BorderSide(color: Color(0xFFCBD5E1)),
                ),
              ),
            ),
          );
          p += 1;
        }
      }
      
      rows.add(
        Row(
          mainAxisSize: MainAxisSize.min,
          children: rowCells,
        ),
      );
    }

    final double tableWidth = dayColWidth + (periodColWidth * totalPeriods) + 24;
    final double tableHeight = headerRowHeight + (dayRowHeight * _daysEnglish.length) + 24;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      clipBehavior: Clip.antiAlias,
      child: InteractiveViewer(
        boundaryMargin: const EdgeInsets.all(120),
        minScale: 0.2,
        maxScale: 3.0,
        constrained: false, // Essential for dynamic Excel-like panned sheets!
        child: SizedBox(
          width: tableWidth,
          height: tableHeight,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: rows,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGridLectureCell(Map<String, dynamic> lecture, {required double height, bool compact = false}) {
    final isOccupied = lecture.isNotEmpty;

    if (!isOccupied) {
      return Container(
        height: height,
        color: const Color(0xFFF8FAFC),
      );
    }

    final isSection = (lecture['lectureType']?.toString().toLowerCase() == 'section');
    final isBiWeekly = lecture['biWeekly'] == true || lecture['isBiWeekly'] == true;

    return Container(
      height: height,
      color: Colors.white,
      padding: const EdgeInsets.all(4.0),
      child: Center(
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Time details
              Text(
                compact
                    ? "${lecture['timeFrom'] ?? ''}"
                    : "${lecture['timeFrom'] ?? ''} - ${lecture['timeTo'] ?? ''}",
                style: GoogleFonts.cairo(
                  fontSize: compact ? 7.5 : 8.5,
                  fontWeight: FontWeight.bold,
                  color: isBiWeekly ? const Color(0xFF0284c7) : AppTheme.secondaryColor,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),

              // Course Code
              Text(
                lecture['courseCode'] ?? 'N/A',
                style: GoogleFonts.cairo(
                  fontSize: compact ? 9 : 10,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.lightTextPrimary,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),

              // Lecturer name
              Text(
                lecture['lecturerName'] ?? 'N/A',
                style: GoogleFonts.cairo(
                  fontSize: compact ? 7.5 : 8.5,
                  color: AppTheme.lightTextSecondary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 2),

              // Room ID and Tag
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: BoxDecoration(
                      color: AppTheme.lightBlueAccent,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      compact ? "ق ${lecture['roomId'] ?? 'N/A'}" : "قاعة ${lecture['roomId'] ?? 'N/A'}",
                      style: GoogleFonts.cairo(
                        fontSize: compact ? 7.5 : 8.5,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  ),
                  if (!compact) ...[
                    const SizedBox(width: 2),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: isSection ? const Color(0xFFFEF3C7) : const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        isSection
                            ? (isBiWeekly ? 'سيكشن (2)' : 'سيكشن')
                            : (isBiWeekly ? 'محاضرة (2)' : 'محاضرة'),
                        style: GoogleFonts.cairo(
                          fontSize: 7.5,
                          fontWeight: FontWeight.bold,
                          color: isSection ? const Color(0xFFD97706) : const Color(0xFF15803D),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
