package com.aast.booking.admin.schedule;

import com.aast.booking.admin.search.LectureSlot;
import com.aast.booking.core.FirebaseService;
import com.aast.booking.models.Room;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteBatch;
import com.google.cloud.firestore.FieldValue;

import java.io.File;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * DESIGN PATTERN: Facade
 * SOLID:
 *   - DIP: Depends on abstractions (RoomSelectionStrategy) not concrete implementations.
 *   - SRP: Orchestrates the entire scheduling process but delegates actual work to sub-components.
 *
 * This engine takes the Excel file, parses it, generates dates, checks availability,
 * selects rooms using the provided strategy, and saves all bookings to Firestore in a batch.
 */
public class LectureSchedulingEngine {

    private final ExcelScheduleParser parser = new ExcelScheduleParser();
    private final RoomAvailabilityChecker availabilityChecker = new RoomAvailabilityChecker();
    private final WeeklyDateIterator dateIterator = new WeeklyDateIterator();
    private final RoomSelectionStrategy selectionStrategy = new BestFitRoomSelectionStrategy();

    /**
     * Interface for reporting progress to the UI.
     */
    public interface ProgressCallback {
        void onProgress(String message, double percentage);
    }

    /**
     * Main orchestration method.
     * 
     * @param excelFile The uploaded Excel file
     * @param isRamadan Whether we are currently generating this schedule under Ramadan slot rules
     * @param callback UI callback for progress updates
     * @return A CompletableFuture that completes with the number of bookings created.
     */
    public CompletableFuture<Integer> processSchedule(File excelFile, boolean isRamadan, ProgressCallback callback) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                callback.onProgress("جاري قراءة ملف الإكسل...", 0.1);
                List<LectureScheduleRow> rows = parser.parse(excelFile);
                if (rows.isEmpty()) throw new Exception("الملف فارغ أو غير صالح.");

                callback.onProgress("جاري جلب القاعات من قاعدة البيانات...", 0.2);
                List<Room> allRooms = availabilityChecker.getAllFixedRooms();
                
                callback.onProgress("جاري تحليل الحجوزات الحالية لتجنب التعارض...", 0.25);
                List<com.aast.booking.models.Booking> existingBookings = availabilityChecker.fetchAllActiveBookings();

                List<Map<String, Object>> bookingsToSave = new ArrayList<>();
                // Track locally added bookings to prevent conflicts within the same import session
                List<com.aast.booking.models.Booking> localNewBookings = new ArrayList<>();
                
                String batchId = UUID.randomUUID().toString(); // unique ID for this import session

                int totalRows = rows.size();
                int processed = 0;

                for (LectureScheduleRow row : rows) {
                    processed++;
                    callback.onProgress(String.format("جاري معالجة مادة %s (%d من %d)...", 
                            row.getSubject(), processed, totalRows), 0.3 + (0.5 * ((double)processed / totalRows)));

                    // 1. Determine dates
                    List<LocalDate> dates = dateIterator.generateDates(row.getStartDate(), row.isBiWeekly());

                    // 2. Determine time slot dynamically based on startSlot and endSlot range
                    LectureSlot slot = dateIterator.resolveSlot(row.getStartSlot(), row.getEndSlot(), isRamadan);
                    if (slot == null) continue; 

                    // 3. For each date, find a room
                    for (LocalDate date : dates) {
                        String dateStr = date.toString();
                        
                        // Find occupied rooms from BOTH existing and local-session bookings
                        List<String> occupiedRoomIds = availabilityChecker.getOccupiedRoomIds(dateStr, slot.getFrom(), slot.getTo(), existingBookings);
                        List<String> locallyOccupied = availabilityChecker.getOccupiedRoomIds(dateStr, slot.getFrom(), slot.getTo(), localNewBookings);
                        
                        // Filter candidates
                        List<Room> candidates = new ArrayList<>();
                        for (Room r : allRooms) {
                            if (!occupiedRoomIds.contains(r.getId()) && !locallyOccupied.contains(r.getId()) 
                                    && r.getCapacity() >= row.getRequiredCapacity()) {
                                candidates.add(r);
                            }
                        }

                        // Select room
                        Room selectedRoom = selectionStrategy.select(candidates, row.getRequiredCapacity());

                        if (selectedRoom != null) {
                            bookingsToSave.add(createBookingMap(row, selectedRoom, dateStr, slot, batchId));
                            
                            // Add to local session cache to prevent double booking the same room in the same slot
                            com.aast.booking.models.Booking localB = new com.aast.booking.models.Booking();
                            localB.setRoomId(selectedRoom.getId());
                            localB.setDate(dateStr);
                            localB.setTimeFrom(slot.getFrom());
                            localB.setTimeTo(slot.getTo());
                            localNewBookings.add(localB);
                        }
                    }
                }

                callback.onProgress("جاري حفظ الحجوزات في قاعدة البيانات...", 0.9);
                saveBookingsInBatches(bookingsToSave);
                
                callback.onProgress("اكتملت العملية بنجاح!", 1.0);
                return bookingsToSave.size();

            } catch (Exception e) {
                throw new RuntimeException("خطأ في جدولة المحاضرات: " + e.getMessage(), e);
            }
        });
    }

    private Map<String, Object> createBookingMap(LectureScheduleRow row, Room room, String date, LectureSlot slot, String batchId) {
        Map<String, Object> map = new HashMap<>();
        map.put("roomId", room.getId());
        map.put("roomType", "fixed");
        map.put("hallCategory", "lecture");
        map.put("date", date);
        map.put("timeFrom", slot.getFrom());
        map.put("timeTo", slot.getTo());
        map.put("purpose", "محاضرة دورية: " + row.getSubject());
        map.put("requiredCapacity", row.getRequiredCapacity());
        map.put("status", "approved"); // Auto-approved
        map.put("createdAt", FieldValue.serverTimestamp());
        
        // Custom fields for weekly lectures - normalized for perfect query matching
        map.put("source", "weekly_lecture");
        map.put("batchId", batchId);
        map.put("is16WeekFixed", true);
        map.put("courseName", row.getSubject());
        map.put("courseCode", row.getSubjectCode());
        map.put("lecturerName", row.getLecturerName());
        map.put("college", GroupScheduleController.normalizeCollege(row.getCollege()));
        map.put("department", GroupScheduleController.normalizeDepartment(row.getDepartment()));
        map.put("group", row.getGroup());
        map.put("lectureType", row.getLectureType());
        map.put("biWeekly", row.isBiWeekly());
        map.put("isBiWeekly", row.isBiWeekly());
        
        // Write the Academic Semester (period) and exact slot ranges to the document
        map.put("period", String.valueOf(row.getAcademicPeriod()));
        map.put("startSlot", row.getStartSlot());
        map.put("endSlot", row.getEndSlot());
        
        return map;
    }

    private void saveBookingsInBatches(List<Map<String, Object>> bookings) throws Exception {
        Firestore db = FirebaseService.getInstance().getFirestore();
        WriteBatch batch = db.batch();
        int count = 0;

        for (Map<String, Object> b : bookings) {
            batch.set(db.collection("bookings").document(), b);
            count++;
            // Firestore max batch size is 500
            if (count % 400 == 0) {
                batch.commit().get();
                batch = db.batch(); // start new batch
            }
        }
        
        if (count % 400 != 0) {
            batch.commit().get();
        }
    }

    /**
     * Cancels (deletes) all bookings generated by this weekly scheduling engine.
     */
    public CompletableFuture<Integer> cancelAllWeeklyBookings() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore db = FirebaseService.getInstance().getFirestore();
                
                // Note: requires composite index on (source) if used with other filters, 
                // but single field filter is fine.
                var snap = db.collection("bookings")
                        .whereEqualTo("source", "weekly_lecture")
                        .get().get();

                WriteBatch batch = db.batch();
                int count = 0;

                for (var doc : snap.getDocuments()) {
                    batch.delete(doc.getReference());
                    count++;
                    if (count % 400 == 0) {
                        batch.commit().get();
                        batch = db.batch();
                    }
                }
                if (count % 400 != 0) {
                    batch.commit().get();
                }

                return count;
            } catch (Exception e) {
                throw new RuntimeException("خطأ في إلغاء الحجوزات: " + e.getMessage(), e);
            }
        });
    }
}
