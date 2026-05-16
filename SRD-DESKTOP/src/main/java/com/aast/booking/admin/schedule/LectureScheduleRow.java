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
    private final int    slotIndex;      // 1-8 (المحاضرة الأولى..الثامنة)
    private final String dayOfWeek;      // السبت/الأحد/الاثنين/الثلاثاء/الأربعاء/الخميس
    private final String startDate;      // ISO "YYYY-MM-DD" — first occurrence date
    private final String group;          // A, B, C ... etc.
    private final boolean biWeekly;      // false=weekly, true=every 2 weeks

    public LectureScheduleRow(String college, String department, String subject,
                               String subjectCode, String lecturerName, String lectureType,
                               int requiredCapacity, int slotIndex, String dayOfWeek,
                               String startDate, String group, boolean biWeekly) {
        this.college           = college;
        this.department        = department;
        this.subject           = subject;
        this.subjectCode       = subjectCode;
        this.lecturerName      = lecturerName;
        this.lectureType       = lectureType;
        this.requiredCapacity  = requiredCapacity;
        this.slotIndex         = slotIndex;
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
    public int    getSlotIndex()        { return slotIndex; }
    public String getDayOfWeek()        { return dayOfWeek; }
    public String getStartDate()        { return startDate; }
    public String getGroup()            { return group; }
    public boolean isBiWeekly()         { return biWeekly; }

    @Override
    public String toString() {
        return String.format("[%s][%s][%s] %s - %s - %s - الفترة%d - %s",
                college, department, subject, lecturerName, group,
                dayOfWeek, slotIndex, biWeekly ? "كل أسبوعين" : "أسبوعي");
    }
}
