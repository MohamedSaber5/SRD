package com.aast.booking.admin.schedule;

/**
 * SOLID: SRP — pure immutable data object for one row from the Excel sheet.
 *        No logic, no Firestore, no UI.
 *
 * Represents exactly the columns in the Excel template:
 *   college | department | subject | subjectCode | lecturerName |
 *   lectureType | requiredCapacity | slotIndex | dayOfWeek |
 *   startDate | group | biWeekly
 */
public class LectureScheduleRow {

    private final String college;        // الكلية
    private final String department;     // القسم
    private final String subject;        // اسم المادة
    private final String subjectCode;    // كود المادة
    private final String lecturerName;   // اسم المحاضر
    private final String lectureType;    // "lecture" or "section"
    private final int    requiredCapacity; // السعة المطلوبة
    private final int    academicPeriod;  // الفترة الأكاديمية (الفصل الدراسي)
    private final int    startSlot;       // سلوت البداية (1-16)
    private final int    endSlot;         // سلوت النهاية (1-16)
    private final String dayOfWeek;      // السبت/الأحد/الاثنين/الثلاثاء/الأربعاء/الخميس
    private final String startDate;      // ISO "YYYY-MM-DD" — first occurrence date
    private final String group;          // A, B, C ... etc.
    private final boolean biWeekly;      // false=weekly, true=every 2 weeks

    public LectureScheduleRow(String college, String department, String subject,
                              String subjectCode, String lecturerName, String lectureType,
                              int requiredCapacity, int academicPeriod, int startSlot, int endSlot,
                              String dayOfWeek, String startDate, String group, boolean biWeekly) {
        this.college           = college;
        this.department        = department;
        this.subject           = subject;
        this.subjectCode       = subjectCode;
        this.lecturerName      = lecturerName;
        this.lectureType       = lectureType;
        this.requiredCapacity  = requiredCapacity;
        this.academicPeriod    = academicPeriod;
        this.startSlot         = startSlot;
        this.endSlot           = endSlot;
        this.dayOfWeek         = dayOfWeek;
        this.startDate         = startDate;
        this.group             = group;
        this.biWeekly          = biWeekly;
    }

    // ── Getters ───────────────────────────────────────────────────────────
    public String getCollege()          { return college; }
    public String getDepartment()       { return department; }
    public String getSubject()          { return subject; }
    public String getSubjectCode()      { return subjectCode; }
    public String getLecturerName()     { return lecturerName; }
    public String getLectureType()      { return lectureType; }
    public int    getRequiredCapacity() { return requiredCapacity; }
    public int    getAcademicPeriod()   { return academicPeriod; }
    public int    getStartSlot()        { return startSlot; }
    public int    getEndSlot()          { return endSlot; }
    public int    getSlotIndex()        { return startSlot; } // Backward compatibility
    public String getDayOfWeek()        { return dayOfWeek; }
    public String getStartDate()        { return startDate; }
    public String getGroup()            { return group; }
    public boolean isBiWeekly()         { return biWeekly; }

    @Override
    public String toString() {
        return String.format("[%s][%s][%s] %s - %s - %s - الترم %d (سلوت %d-%d) - %s",
                college, department, subject, lecturerName, group,
                dayOfWeek, academicPeriod, startSlot, endSlot, biWeekly ? "كل أسبوعين" : "أسبوعي");
    }
}
