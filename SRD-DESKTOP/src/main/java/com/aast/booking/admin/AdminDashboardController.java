package com.aast.booking.admin;

import com.aast.booking.auth.AuthService;
import com.aast.booking.core.SessionManager;
import com.aast.booking.models.Booking;
import com.aast.booking.services.BranchManagerService;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.Stage;

import com.google.cloud.firestore.*;
import com.google.api.core.ApiFuture;

import java.io.IOException;
import java.net.URL;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * DESIGN PATTERN: Facade + Singleton
 *
 * AdminDashboardController acts as the main orchestrator for the admin module.
 * It delegates data fetching to the service layer (Facade) and uses the
 * Singleton SessionManager for user context.
 *
 * SOLID:
 * - SRP: Controller only handles UI logic and delegates to services
 * - OCP: New views can be added via new VBox panes without modifying existing code
 * - DIP: Depends on service abstractions, not direct Firestore calls
 */
public class AdminDashboardController implements Initializable {

    // Sidebar nav buttons
    @FXML private Button btnDashboard, btnRequests, btnNewBooking, btnRoomMgmt,
                          btnSearch, btnDelegation, btnSettings, btnStats;
    @FXML private Label welcomeLabel, roleLabel;

    // Header
    @FXML private Label pageTitle, pageSubtitle;
    @FXML private Button ramadanBtn;

    // Views
    @FXML private VBox dashboardView, pendingView, newBookingView, roomMgmtView,
                        searchView, delegationView, settingsView, statsView;

    // Dashboard stats
    @FXML private Label statAcceptedToday, statPendingCount, statTotalBookings, statTotalRooms;
    @FXML private Label todayDateLabel;

    // Today's events table
    @FXML private TableView<Booking> todayEventsTable;
    @FXML private TableColumn<Booking, String> evColRoom, evColType, evColUser, evColTime, evColPurpose;

    private boolean isRamadanMode = false;
    private final ObservableList<Booking> todayEvents = FXCollections.observableArrayList();
    private List<Booking> allBookings = new ArrayList<>();
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final String todayStr = LocalDate.now().toString();

    // All views for navigation
    private VBox[] allViews;
    private Button[] allNavBtns;

    @Override
    public void initialize(URL url, ResourceBundle rb) {
        var user = SessionManager.getInstance().getCurrentUser();
        if (user != null && welcomeLabel != null)
            welcomeLabel.setText("مرحباً، " + user.getDisplayName());

        if (todayDateLabel != null)
            todayDateLabel.setText("📅  " + todayStr);

        allViews = new VBox[]{dashboardView, pendingView, newBookingView, roomMgmtView,
                              searchView, delegationView, settingsView, statsView};
        allNavBtns = new Button[]{btnDashboard, btnRequests, btnNewBooking, btnRoomMgmt,
                                  btnSearch, btnDelegation, btnSettings, btnStats};

        setupTodayEventsTable();
        fetchAllData();
        fetchRamadanMode();
        showDashboard();
    }

    // ─── Navigation ──────────────────────────────────────────────────────

    @FXML private void showDashboard() {
        switchView(0);
        pageTitle.setText("لوحة تحكم المسؤول");
        pageSubtitle.setText("إدارة الجداول الأسبوعية ومتابعة العمليات");
    }

    @FXML private void showPendingRequests() {
        switchView(1);
        pageTitle.setText("الطلبات المعلقة");
        pageSubtitle.setText("مراجعة وإدارة طلبات الحجز المعلقة");
    }

    @FXML private void showNewBooking() {
        switchView(2);
        pageTitle.setText("طلب حجز جديد");
        pageSubtitle.setText("إنشاء حجز جديد لقاعة");
    }

    @FXML private void showRoomManagement() {
        switchView(3);
        pageTitle.setText("إدارة القاعات");
        pageSubtitle.setText("إضافة وتعديل وحذف القاعات");
    }

    @FXML private void showSearch() {
        switchView(4);
        pageTitle.setText("البحث المتقدم");
        pageSubtitle.setText("البحث عن القاعات المتاحة");
    }

    @FXML private void showDelegation() {
        switchView(5);
        pageTitle.setText("الصلاحيات والتفويض");
        pageSubtitle.setText("إدارة صلاحيات المستخدمين والتفويضات");
    }

    @FXML private void showSettings() {
        switchView(6);
        pageTitle.setText("الإعدادات");
        pageSubtitle.setText("إعدادات النظام العامة");
    }

    @FXML private void showStatistics() {
        switchView(7);
        pageTitle.setText("الإحصائيات والتقارير");
        pageSubtitle.setText("تحليل شامل لاستخدام القاعات");
    }

    private void switchView(int index) {
        for (int i = 0; i < allViews.length; i++) {
            if (allViews[i] != null) allViews[i].setVisible(i == index);
        }
        setActiveNav(index);
    }

    private void setActiveNav(int activeIndex) {
        String inactive = "admin-nav-btn", active = "admin-nav-btn-active";
        for (int i = 0; i < allNavBtns.length; i++) {
            if (allNavBtns[i] != null) {
                allNavBtns[i].getStyleClass().removeAll(inactive, active);
                allNavBtns[i].getStyleClass().add(i == activeIndex ? active : inactive);
            }
        }
    }

    // ─── Data Fetching (Facade Pattern via service layer) ────────────────

    private void fetchAllData() {
        CompletableFuture.supplyAsync(() -> {
            try {
                Firestore db = com.google.firebase.cloud.FirestoreClient.getFirestore();

                // Fetch all bookings
                ApiFuture<QuerySnapshot> bookingsFuture = db.collection("bookings")
                        .orderBy("createdAt", Query.Direction.DESCENDING).get();

                // Fetch all rooms
                ApiFuture<QuerySnapshot> roomsFuture = db.collection("rooms").get();

                QuerySnapshot bookingsSnap = bookingsFuture.get();
                QuerySnapshot roomsSnap = roomsFuture.get();

                List<Booking> bookings = new ArrayList<>();
                for (DocumentSnapshot doc : bookingsSnap.getDocuments()) {
                    Booking b = new Booking();
                    b.setId(doc.getId());
                    b.setRoomId(doc.getString("roomId"));
                    b.setRoomType(doc.getString("roomType"));
                    b.setDate(doc.getString("date"));
                    b.setTimeFrom(doc.getString("timeFrom"));
                    b.setTimeTo(doc.getString("timeTo"));
                    b.setStatus(doc.getString("status"));
                    b.setPurpose(doc.getString("purpose"));
                    b.setResponsibleName(doc.getString("responsibleName"));
                    b.setUserName(doc.getString("userName"));
                    Boolean is16 = doc.getBoolean("is16WeekFixed");
                    String courseName = doc.getString("courseName");
                    b.setPurpose(courseName != null ? courseName : b.getPurpose());
                    if (is16 != null && is16) b.setRoomType("fixed");
                    bookings.add(b);
                }

                int roomCount = roomsSnap.size();

                return new Object[]{bookings, roomCount};
            } catch (Exception e) {
                e.printStackTrace();
                return new Object[]{new ArrayList<>(), 0};
            }
        }, executor).thenAccept(result -> {
            @SuppressWarnings("unchecked")
            List<Booking> bookings = (List<Booking>) result[0];
            int roomCount = (int) result[1];

            Platform.runLater(() -> {
                allBookings = bookings;
                updateDashboardStats(roomCount);
                updateTodayEvents();
            });
        });
    }

    private void updateDashboardStats(int roomCount) {
        int pendingCount = (int) allBookings.stream()
                .filter(b -> "pending".equals(b.getStatus()) || "awaiting_manager_final".equals(b.getStatus()))
                .count();
        int acceptedToday = (int) allBookings.stream()
                .filter(b -> "approved".equals(b.getStatus()) && todayStr.equals(b.getDate()))
                .count();
        int totalBookings = allBookings.size();

        if (statAcceptedToday != null) statAcceptedToday.setText(String.valueOf(acceptedToday));
        if (statPendingCount != null) statPendingCount.setText(String.valueOf(pendingCount));
        if (statTotalBookings != null) statTotalBookings.setText(String.valueOf(totalBookings));
        if (statTotalRooms != null) statTotalRooms.setText(String.valueOf(roomCount));
    }

    private void updateTodayEvents() {
        List<Booking> today = allBookings.stream()
                .filter(b -> todayStr.equals(b.getDate())
                        && ("approved".equals(b.getStatus()) || "approved_by_branch".equals(b.getStatus()))
                        && (!"fixed".equals(b.getRoomType()) || "multi".equals(b.getRoomType())))
                .sorted(Comparator.comparing(b -> b.getTimeFrom() != null ? b.getTimeFrom() : ""))
                .collect(Collectors.toList());
        todayEvents.setAll(today);
    }

    private void setupTodayEventsTable() {
        if (evColRoom == null) return;

        evColRoom.setCellValueFactory(d -> new SimpleStringProperty(
                d.getValue().getRoomId() != null ? d.getValue().getRoomId() : "-"));

        evColType.setCellValueFactory(d -> {
            String type = d.getValue().getRoomType();
            String label = "multi".equals(type) ? "قاعة متعددة الأغراض" : "استثنائية / متغيرة";
            return new SimpleStringProperty(label);
        });

        evColUser.setCellValueFactory(d -> {
            Booking b = d.getValue();
            String name = b.getResponsibleName() != null ? b.getResponsibleName() : b.getUserName();
            return new SimpleStringProperty(name != null ? name : "-");
        });

        evColTime.setCellValueFactory(d -> new SimpleStringProperty(
                (d.getValue().getTimeFrom() != null ? d.getValue().getTimeFrom() : "") + " - " +
                (d.getValue().getTimeTo() != null ? d.getValue().getTimeTo() : "")));

        evColPurpose.setCellValueFactory(d -> new SimpleStringProperty(
                d.getValue().getPurpose() != null ? d.getValue().getPurpose() : "-"));

        todayEventsTable.setItems(todayEvents);
    }

    // ─── Ramadan Mode ────────────────────────────────────────────────────

    private void fetchRamadanMode() {
        BranchManagerService.getInstance().fetchRamadanMode().thenAccept(mode -> {
            Platform.runLater(() -> applyRamadanState(mode));
        });
    }

    @FXML private void toggleRamadanMode() {
        boolean newMode = !isRamadanMode;
        BranchManagerService.getInstance().setRamadanMode(newMode).thenRun(() -> {
            Platform.runLater(() -> applyRamadanState(newMode));
        });
    }

    private void applyRamadanState(boolean on) {
        isRamadanMode = on;
        if (ramadanBtn != null) {
            if (on) {
                ramadanBtn.setText("🌙  وضع رمضان: مفعّل");
                ramadanBtn.getStyleClass().removeAll("admin-ramadan-off");
                ramadanBtn.getStyleClass().add("admin-ramadan-on");
            } else {
                ramadanBtn.setText("🌙  تفعيل وضع رمضان");
                ramadanBtn.getStyleClass().removeAll("admin-ramadan-on");
                ramadanBtn.getStyleClass().add("admin-ramadan-off");
            }
        }
    }

    // ─── Logout ──────────────────────────────────────────────────────────

    @FXML private void handleLogout() throws IOException {
        AuthService.logout();
        Stage stage = SessionManager.getInstance().getPrimaryStage();
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/Login.fxml"));
        Scene scene = new Scene(loader.load(), 1000, 680);
        scene.getStylesheets().add(getClass().getResource("/css/styles.css").toExternalForm());
        stage.setScene(scene);
        stage.setMaximized(false);
    }
}
