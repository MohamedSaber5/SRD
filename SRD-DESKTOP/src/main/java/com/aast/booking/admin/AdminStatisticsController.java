package com.aast.booking.admin;

import com.aast.booking.core.FirebaseService;
import com.aast.booking.models.Room;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.chart.*;
import javafx.scene.control.Label;

import java.net.URL;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * AdminStatisticsController
 *
 * Ports the React AdminStatistics.jsx page logic to JavaFX.
 * Fetches all bookings and rooms from Firestore, computes the same
 * statistical metrics as the web frontend, then renders them using
 * native JavaFX chart controls.
 *
 * DESIGN PATTERN: Facade (delegates Firestore access to FirebaseService Singleton)
 * SOLID: SRP — only handles statistics rendering, no booking CRUD.
 */
public class AdminStatisticsController implements Initializable {

    // ── KPI Labels ──────────────────────────────────────────────────────────
    @FXML private Label kpiTotal;
    @FXML private Label kpiApproved;
    @FXML private Label kpiEmergency;
    @FXML private Label kpiTopRoom;

    // ── Charts ──────────────────────────────────────────────────────────────
    @FXML private LineChart<String, Number>  peakHoursChart;
    @FXML private BarChart<String, Number>   busiestDaysChart;
    @FXML private BarChart<String, Number>   topRoomsChart;
    @FXML private BarChart<String, Number>   buildingChart;
    @FXML private PieChart                   statusPieChart;
    @FXML private PieChart                   leadTimePieChart;

    private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "stats-fetcher");
        t.setDaemon(true);
        return t;
    });

    // ── Arabic day ordering (same as React component) ───────────────────────
    private static final List<String> DAY_ORDER = Arrays.asList(
        "السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"
    );

    // ── Peak hour ordering: 8 AM → 8 PM ────────────────────────────────────
    private static final List<String> HOUR_ORDER = Arrays.asList(
        "8 ص", "9 ص", "10 ص", "11 ص", "12 م", "1 م", "2 م", "3 م", "4 م", "5 م", "6 م", "7 م", "8 م"
    );

    @Override
    public void initialize(URL url, ResourceBundle rb) {
        styleCharts();
        // Data is now loaded lazily via public refreshData()
    }

    // ── Firestore Data Fetch ─────────────────────────────────────────────────

    public void refreshData() {
        CompletableFuture.runAsync(() -> {
            try {
                Firestore db = FirebaseService.getInstance().getFirestore();

                // 1. Fetch Bookings (Full set for stats - but we should ideally limit or cache)
                ApiFuture<QuerySnapshot> bookingsFuture = db.collection("bookings").get();
                
                // 2. Use Room cache if available
                List<Room> rooms;
                if (!com.aast.booking.services.GlobalDataService.getInstance().isRoomCacheStale()) {
                    rooms = com.aast.booking.services.GlobalDataService.getInstance().getCachedRooms();
                } else {
                    QuerySnapshot roomsSnap = db.collection("rooms").get().get();
                    rooms = new ArrayList<>();
                    for (DocumentSnapshot doc : roomsSnap.getDocuments()) {
                        rooms.add(Room.fromDocument(doc));
                    }
                    com.aast.booking.services.GlobalDataService.getInstance().setCachedRooms(rooms);
                }

                List<Map<String, Object>> bookings = new ArrayList<>();
                for (DocumentSnapshot doc : bookingsFuture.get().getDocuments()) {
                    bookings.add(doc.getData() != null ? doc.getData() : new HashMap<>());
                    bookings.get(bookings.size() - 1).put("__id", doc.getId());
                }

                // Build roomId → building map
                Map<String, String> roomBuilding = new HashMap<>();
                for (Room r : rooms) {
                    if (r.getBuilding() != null) {
                        roomBuilding.put(r.getId(), r.getBuilding());
                    }
                }

                Platform.runLater(() -> populate(bookings, roomBuilding));

            } catch (Exception e) {
                e.printStackTrace();
            }
        }, executor);
    }

    // ── Populate all charts ──────────────────────────────────────────────────

    private void populate(List<Map<String, Object>> bookings, Map<String, String> roomBuilding) {

        // ── KPI 1: Total ────────────────────────────────────────────────────
        kpiTotal.setText(String.valueOf(bookings.size()));

        // ── KPI 2: Approved ─────────────────────────────────────────────────
        long approved = bookings.stream()
                .filter(b -> "approved".equals(b.get("status")))
                .count();
        kpiApproved.setText(String.valueOf(approved));

        // ── KPI 3 & Lead-time chart: Emergency requests (<= 2 days notice) ─
        int emergency = 0, normal = 0;
        for (Map<String, Object> b : bookings) {
            Object createdAtObj = b.get("createdAt");
            Object dateObj      = b.get("date");
            if (createdAtObj == null || dateObj == null) continue;
            try {
                java.util.Date createdDate;
                if (createdAtObj instanceof com.google.cloud.Timestamp) {
                    createdDate = ((com.google.cloud.Timestamp) createdAtObj).toDate();
                } else {
                    continue;
                }
                java.time.LocalDate eventDate = java.time.LocalDate.parse(dateObj.toString());
                java.time.LocalDate created   = createdDate.toInstant()
                        .atZone(java.time.ZoneId.systemDefault()).toLocalDate();
                long diffDays = Math.abs(java.time.temporal.ChronoUnit.DAYS.between(created, eventDate));
                if (diffDays <= 2) emergency++;
                else normal++;
            } catch (Exception ignored) { }
        }
        kpiEmergency.setText(String.valueOf(emergency));

        // Lead-time pie
        leadTimePieChart.getData().clear();
        PieChart.Data normalSlice    = new PieChart.Data("طلب مبكر (طبيعي)", normal);
        PieChart.Data emergencySlice = new PieChart.Data("طلب طارئ (< 48 ساعة)", emergency);
        leadTimePieChart.getData().addAll(normalSlice, emergencySlice);
        applyPieColors(leadTimePieChart, new String[]{"#1e3a5f", "#ef4444"});

        // ── KPI 4 & Top Rooms chart ──────────────────────────────────────────
        Map<String, Integer> roomCounts = new LinkedHashMap<>();
        for (Map<String, Object> b : bookings) {
            String roomId = (String) b.get("roomId");
            if (roomId != null) roomCounts.merge(roomId, 1, Integer::sum);
        }
        // Sort descending
        List<Map.Entry<String, Integer>> sortedRooms = roomCounts.entrySet().stream()
                .sorted((a, b2) -> b2.getValue() - a.getValue())
                .collect(Collectors.toList());

        kpiTopRoom.setText(sortedRooms.isEmpty() ? "لا يوجد" : sortedRooms.get(0).getKey());

        // Top 5 rooms bar chart
        XYChart.Series<String, Number> roomSeries = new XYChart.Series<>();
        roomSeries.setName("الطلبات");
        sortedRooms.stream().limit(5).forEach(e ->
                roomSeries.getData().add(new XYChart.Data<>(e.getKey(), e.getValue()))
        );
        topRoomsChart.getData().clear();
        topRoomsChart.getData().add(roomSeries);
        applyBarColors(roomSeries, "#b58b4b");

        // ── Status Pie ───────────────────────────────────────────────────────
        Map<String, Long> statusCounts = bookings.stream()
                .filter(b -> b.get("status") != null)
                .collect(Collectors.groupingBy(b -> b.get("status").toString(), Collectors.counting()));

        statusPieChart.getData().clear();
        addPieSliceIfNonZero(statusPieChart, "مقبول",           statusCounts.getOrDefault("approved", 0L));
        addPieSliceIfNonZero(statusPieChart, "معلق للأدمن",     statusCounts.getOrDefault("pending", 0L));
        addPieSliceIfNonZero(statusPieChart, "انتظار المدير",   statusCounts.getOrDefault("awaiting_manager_final", 0L));
        addPieSliceIfNonZero(statusPieChart, "مرفوض",           statusCounts.getOrDefault("rejected", 0L));
        applyPieColors(statusPieChart, new String[]{"#22c55e", "#eab308", "#f59e0b", "#ef4444"});

        // ── Peak Hours ───────────────────────────────────────────────────────
        Map<String, Integer> hourMap = new LinkedHashMap<>();
        HOUR_ORDER.forEach(h -> hourMap.put(h, 0));
        for (Map<String, Object> b : bookings) {
            String status = (String) b.get("status");
            if ("rejected".equals(status) || "cancelled".equals(status)) continue;
            String timeFrom = (String) b.get("timeFrom");
            if (timeFrom == null) continue;
            try {
                int hour = Integer.parseInt(timeFrom.split(":")[0]);
                String ampm = hour >= 12 ? " م" : " ص";
                int displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
                String label = displayHour + ampm;
                if (hourMap.containsKey(label)) {
                    hourMap.merge(label, 1, Integer::sum);
                }
            } catch (Exception ignored) { }
        }

        XYChart.Series<String, Number> peakSeries = new XYChart.Series<>();
        peakSeries.setName("الحجوزات");
        HOUR_ORDER.forEach(h -> peakSeries.getData().add(new XYChart.Data<>(h, hourMap.get(h))));
        peakHoursChart.getData().clear();
        peakHoursChart.getData().add(peakSeries);

        // ── Busiest Days ─────────────────────────────────────────────────────
        Map<String, Integer> daysMap = new LinkedHashMap<>();
        DAY_ORDER.forEach(d -> daysMap.put(d, 0));
        String[] dayNames = {"الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"};
        for (Map<String, Object> b : bookings) {
            String status = (String) b.get("status");
            if ("rejected".equals(status) || "cancelled".equals(status)) continue;
            String dateStr = (String) b.get("date");
            if (dateStr == null) continue;
            try {
                java.time.LocalDate date = java.time.LocalDate.parse(dateStr);
                String dayName = dayNames[date.getDayOfWeek().getValue() % 7];
                daysMap.merge(dayName, 1, Integer::sum);
            } catch (Exception ignored) { }
        }

        XYChart.Series<String, Number> daysSeries = new XYChart.Series<>();
        daysSeries.setName("الحجوزات");
        DAY_ORDER.forEach(d -> daysSeries.getData().add(new XYChart.Data<>(d, daysMap.get(d))));
        busiestDaysChart.getData().clear();
        busiestDaysChart.getData().add(daysSeries);
        applyBarColors(daysSeries, "#1e3a5f");

        // ── Building Pressure ────────────────────────────────────────────────
        Map<String, Integer> buildingCounts = new LinkedHashMap<>();
        for (Map<String, Object> b : bookings) {
            String roomId = (String) b.get("roomId");
            String building = roomBuilding.get(roomId);
            if (building != null) {
                buildingCounts.merge("مبنى " + building, 1, Integer::sum);
            }
        }
        List<Map.Entry<String, Integer>> sortedBuildings = buildingCounts.entrySet().stream()
                .sorted((a, b2) -> b2.getValue() - a.getValue())
                .collect(Collectors.toList());

        XYChart.Series<String, Number> buildingSeries = new XYChart.Series<>();
        buildingSeries.setName("الحجوزات");
        String[] buildingColors = {"#1e3a5f", "#b58b4b", "#e2c58a", "#5a7698", "#94a3b8", "#cbd5e1"};
        sortedBuildings.forEach(e ->
                buildingSeries.getData().add(new XYChart.Data<>(e.getKey(), e.getValue()))
        );
        buildingChart.getData().clear();
        buildingChart.getData().add(buildingSeries);
        applyBarColors(buildingSeries, "#5a7698");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void addPieSliceIfNonZero(PieChart chart, String name, long value) {
        if (value > 0) {
            chart.getData().add(new PieChart.Data(name + "  (" + value + ")", value));
        }
    }

    /**
     * Apply a single flat color to all bars in a series.
     * JavaFX assigns default-color0..N; we override with inline style after render.
     */
    private void applyBarColors(XYChart.Series<String, Number> series, String hexColor) {
        // Apply after the scene is laid out
        Platform.runLater(() -> {
            if (series.getNode() != null) {
                series.getNode().setStyle("-fx-background-color: " + hexColor + ";");
            }
            series.getData().forEach(d -> {
                if (d.getNode() != null) {
                    d.getNode().setStyle("-fx-bar-fill: " + hexColor + ";");
                }
            });
        });
    }

    /**
     * Apply individual colors to each pie slice.
     */
    private void applyPieColors(PieChart chart, String[] colors) {
        Platform.runLater(() -> {
            List<PieChart.Data> data = chart.getData();
            for (int i = 0; i < data.size() && i < colors.length; i++) {
                if (data.get(i).getNode() != null) {
                    data.get(i).getNode().setStyle("-fx-pie-color: " + colors[i] + ";");
                }
            }
        });
    }

    /**
     * Remove JavaFX default chart chrome (grid lines, plot background) for cleaner look.
     */
    private void styleCharts() {
        // Line chart — clean area style
        peakHoursChart.setCreateSymbols(false);
        peakHoursChart.setAnimated(false);

        // Bar charts — no animations
        busiestDaysChart.setAnimated(false);
        topRoomsChart.setAnimated(false);
        buildingChart.setAnimated(false);

        // Pie charts
        statusPieChart.setAnimated(false);
        leadTimePieChart.setAnimated(false);
    }
}
