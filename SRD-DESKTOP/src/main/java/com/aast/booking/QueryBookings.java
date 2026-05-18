package com.aast.booking;

import com.aast.booking.core.FirebaseService;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import java.time.LocalDate;
import java.util.*;

public class QueryBookings {
    public static void main(String[] args) {
        try {
            FirebaseService.getInstance().initialize();
            Firestore db = FirebaseService.getInstance().getFirestore();
            
            System.out.println("Analyzing imported bookings with Controller logic...");
            String selectedGroup = "F";
            
            var query = db.collection("bookings")
                    .whereEqualTo("college", "حاسبات ومعلومات")
                    .whereEqualTo("department", "هندسة البرمجيات")
                    .get().get();
            
            List<QueryDocumentSnapshot> docs = query.getDocuments();
            System.out.println("Total matching docs in Firestore: " + docs.size());
            
            Map<String, BookingSlotInfo> uniqueSlots = new HashMap<>();
            
            for (var doc : docs) {
                String source = doc.getString("source");
                String status = doc.getString("status");
                
                boolean isWeekly = "weekly_lecture".equals(source);
                boolean isApproved = "approved".equals(status) || "approved_by_branch".equals(status);
                
                if (!isWeekly && !isApproved) {
                    continue;
                }
                
                String docGroup = doc.getString("group");
                if (docGroup == null || !docGroup.equalsIgnoreCase(selectedGroup)) {
                    continue;
                }
                
                String dateStr = doc.getString("date");
                if (dateStr == null) continue;
                
                LocalDate date = LocalDate.parse(dateStr);
                String dayOfWeek = date.getDayOfWeek().name();
                
                String timeFrom = doc.getString("timeFrom");
                String timeTo = doc.getString("timeTo");
                String courseCode = doc.getString("courseCode");
                String lectureType = doc.getString("lectureType");
                
                String key = dayOfWeek + "_" + timeFrom + "_" + courseCode + "_" + lectureType;
                
                if (!uniqueSlots.containsKey(key)) {
                    BookingSlotInfo info = new BookingSlotInfo();
                    info.dayOfWeek = dayOfWeek;
                    info.timeFrom = timeFrom;
                    info.timeTo = timeTo;
                    info.courseCode = courseCode;
                    info.slotIndex = getStartPeriodFromTime(timeFrom);
                    
                    Boolean b1 = doc.getBoolean("biWeekly");
                    Boolean b2 = doc.getBoolean("isBiWeekly");
                    
                    System.out.println("Doc ID: " + doc.getId());
                    System.out.println("  code: " + courseCode);
                    System.out.println("  college: " + doc.getString("college"));
                    System.out.println("  dept: " + doc.getString("department"));
                    System.out.println("  group: " + doc.getString("group"));
                    System.out.println("  status: " + doc.getString("status"));
                    System.out.println("  source: " + doc.getString("source"));
                    System.out.println("  date: " + dateStr);
                    System.out.println("  time: " + timeFrom + " - " + timeTo);
                    System.out.println("  biWeekly (field): " + b1 + " | isBiWeekly (field): " + b2);
                    System.out.println("----------------------------------------");
                    
                    info.biWeekly = (b1 != null && b1) || (b2 != null && b2);
                    
                    uniqueSlots.put(key, info);
                }
            }
            
            System.out.println("\n--- Unique Slots resolved by the Controller ---");
            for (Map.Entry<String, BookingSlotInfo> entry : uniqueSlots.entrySet()) {
                BookingSlotInfo info = entry.getValue();
                System.out.println("Key: " + entry.getKey() + " | Day: " + info.dayOfWeek + " | Time: " + info.timeFrom + " - " + info.timeTo + " | Resolved SlotIndex: " + info.slotIndex + " | biWeekly: " + info.biWeekly);
            }
            
            System.exit(0);
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static int getStartPeriodFromTime(String timeFrom) {
        if (timeFrom == null || !timeFrom.contains(":")) return 1;
        try {
            String clean = timeFrom.replace("ص", "").replace("م", "").replace("AM", "").replace("PM", "").trim();
            String[] parts = clean.split(":");
            int hour = Integer.parseInt(parts[0]);
            
            boolean hasMeridiem = timeFrom.contains("ص") || timeFrom.contains("م") || 
                                  timeFrom.toUpperCase().contains("AM") || timeFrom.toUpperCase().contains("PM");
            if (hasMeridiem) {
                boolean isPM = timeFrom.contains("م") || timeFrom.toUpperCase().contains("PM");
                if (isPM && hour < 12) {
                    hour += 12;
                } else if (!isPM && hour == 12) {
                    hour = 0;
                }
            }
            
            int period = hour - 8 + 1;
            if (period >= 1 && period <= 16) {
                return period;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 1;
    }

    static class BookingSlotInfo {
        String dayOfWeek;
        String timeFrom;
        String timeTo;
        String courseCode;
        int slotIndex;
        boolean biWeekly;
    }
}
