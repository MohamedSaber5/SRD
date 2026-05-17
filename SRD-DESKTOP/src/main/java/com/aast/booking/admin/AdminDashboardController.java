package com.aast.booking.admin;

import com.aast.booking.auth.AuthService;
import com.aast.booking.core.SessionManager;
import com.aast.booking.models.Booking;
import com.aast.booking.services.BranchManagerService;
import javafx.animation.FadeTransition;
import javafx.animation.ScaleTransition;
import javafx.animation.ParallelTransition;
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
import javafx.util.Duration;

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
                          btnSearch, btnDelegation, btnSettings, btnStats, btnLectureScheduling;
    @FXML private Label welcomeLabel, roleLabel;

    // Header
    @FXML private Label pageTitle, pageSubtitle;
    @FXML private Button ramadanBtn;

    // Views
    @FXML private VBox dashboardView, pendingView, newBookingView, roomMgmtView,
                        searchView, delegationView, settingsView, statsView, lectureSchedulingView;

    // Dashboard stats
    @FXML private Label statAcceptedToday, statPendingCount, statTotalBookings, statTotalRooms;
    @FXML private Label todayDateLabel;

    // Sub-controllers
    @FXML private AdminBookingFormController newBookingFormController;

    // Today's events table
    @FXML private TableView<Booking> todayEventsTable;
    @FXML private TableColumn<Booking, String> evColRoom, evColType, evColUser, evColTime, evColPurpose;

    // Pending Requests
    @FXML private Label lblPendingCount;
    @FXML private FlowPane requestsContainer;
    
    // Modals
    @FXML private StackPane approveModalOverlay;
    @FXML private Label lblApproveDetails;
    @FXML private VBox vboxAvailableRooms;
    @FXML private ComboBox<String> cmbAvailableRooms;
    @FXML private CheckBox chkUrgent;
    
    @FXML private StackPane rejectModalOverlay;
    @FXML private TextArea txtRejectReason;
    @FXML private ComboBox<String> cmbSuggestedRoom;
    @FXML private DatePicker dpSuggestedDate;
    @FXML private ComboBox<String> cmbSuggestedSlot;

    // Detail Overlay
    @FXML private StackPane detailOverlay;
    @FXML private VBox detailCard;
    @FXML private Label detailTitle, detailStatusBadge, detailDate, detailTime;
    @FXML private Label detailRequester, detailResponsible, detailCapacity, detailRoomType;
    @FXML private Label detailPurpose, detailRequirements;
    @FXML private VBox detailRequirementsBox;

    private boolean isRamadanMode = false;
    private final ObservableList<Booking> todayEvents = FXCollections.observableArrayList();
    private List<Booking> allBookings = new ArrayList<>();
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final String todayStr = LocalDate.now().toString();

    // Facade
    private final com.aast.booking.admin.facade.AdminBookingFacade adminFacade = new com.aast.booking.admin.facade.AdminBookingFacade();
    private Booking selectedRequest;
    // Maps display label -> real Firestore docId for room selection
    private final Map<String, String> approveRoomDocIdMap = new HashMap<>();
    private final Map<String, String> rejectRoomDocIdMap  = new HashMap<>();

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
                              searchView, lectureSchedulingView, delegationView, settingsView, statsView};
        allNavBtns = new Button[]{btnDashboard, btnRequests, btnNewBooking, btnRoomMgmt,
                                  btnSearch, btnLectureScheduling, btnDelegation, btnSettings, btnStats};

        setupTodayEventsTable();
        fetchAllData();
        fetchRamadanMode();
 
        // Hide features based on granular permissions for Temporary Admins
        if ("temp_admin".equals(user.getRole())) {
            btnDelegation.setVisible(false);
            btnDelegation.setManaged(false);
            
            List<String> allowed = user.getAllowedFeatures();
            if (allowed != null) {
                if (!allowed.contains("requests")) { btnRequests.setVisible(false); btnRequests.setManaged(false); }
                if (!allowed.contains("rooms"))    { btnRoomMgmt.setVisible(false); btnRoomMgmt.setManaged(false); }
                if (!allowed.contains("stats"))    { btnStats.setVisible(false);    btnStats.setManaged(false); }
                if (!allowed.contains("search"))   { btnSearch.setVisible(false);   btnSearch.setManaged(false); }
                if (!allowed.contains("settings")) { btnSettings.setVisible(false); btnSettings.setManaged(false); }
                if (!allowed.contains("lectureScheduling")) { btnLectureScheduling.setVisible(false); btnLectureScheduling.setManaged(false); }
            }
        }
 
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
        fetchPendingRequestsOnly(); // Only fetch what's needed for this tab
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
        if (roomMgmtController != null) roomMgmtController.refreshData();
    }

    @FXML private void showSearch() {
        switchView(4);
        pageTitle.setText("البحث المتقدم");
        pageSubtitle.setText("البحث عن القاعات المتاحة");
    }
    
    @FXML private void showLectureScheduling() {
        switchView(5);
        pageTitle.setText("حجز المحاضرات");
        pageSubtitle.setText("أتمتة وحجز المحاضرات الأسبوعية عبر إكسل");
    }

    @FXML private void showDelegation() {
        switchView(6);
        pageTitle.setText("الصلاحيات والتفويض");
        pageSubtitle.setText("إدارة صلاحيات المستخدمين والتفويضات");
        if (delegationController != null) delegationController.refreshData();
    }

    @FXML private void showSettings() {
        switchView(7);
        pageTitle.setText("الإعدادات");
        pageSubtitle.setText("إعدادات النظام العامة");
    }

    @FXML private void showStatistics() {
        switchView(8);
        pageTitle.setText("الإحصائيات والتقارير");
        pageSubtitle.setText("تحليل شامل لاستخدام القاعات");
        if (statsController != null) statsController.refreshData();
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

    // Sub-controllers for lazy loading
    @FXML private RoomManagementController roomMgmtController;
    @FXML private AdminDelegationController delegationController;
    @FXML private AdminStatisticsController statsController;

    private void fetchAllData() {
        CompletableFuture.supplyAsync(() -> {
            try {
                Firestore db = com.aast.booking.core.FirebaseService.getInstance().getFirestore();

                // Get room count (using cache if available to save reads)
                int roomCount = 0;
                if (!com.aast.booking.services.GlobalDataService.getInstance().isRoomCacheStale()) {
                    roomCount = com.aast.booking.services.GlobalDataService.getInstance().getCachedRooms().size();
                } else {
                    QuerySnapshot roomsSnap = db.collection("rooms").get().get();
                    List<com.aast.booking.models.Room> rooms = new ArrayList<>();
                    for (DocumentSnapshot doc : roomsSnap.getDocuments()) {
                        rooms.add(com.aast.booking.models.Room.fromDocument(doc));
                    }
                    com.aast.booking.services.GlobalDataService.getInstance().setCachedRooms(rooms);
                    roomCount = rooms.size();
                }

                List<Booking> bookings = new ArrayList<>();
                if (!com.aast.booking.services.GlobalDataService.getInstance().isBookingCacheStale()) {
                    bookings = com.aast.booking.services.GlobalDataService.getInstance().getCachedBookings();
                } else {
                    // Fetch only last 300 bookings for the dashboard summary (reduced from 500)
                    ApiFuture<QuerySnapshot> bookingsFuture = db.collection("bookings")
                            .orderBy("createdAt", Query.Direction.DESCENDING)
                            .limit(300)
                            .get();
                    QuerySnapshot bookingsSnap = bookingsFuture.get();
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
                    com.aast.booking.services.GlobalDataService.getInstance().setCachedBookings(bookings);
                }

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

    // ─── Pending Requests Logic ──────────────────────────────────────────

    private void fetchPendingRequestsOnly() {
        adminFacade.listenToPendingRequests(bookings -> {
            lblPendingCount.setText(String.valueOf(bookings.size()));
            renderPendingRequests(bookings);
        }, e -> {
            System.err.println("Error listening to requests: " + e.getMessage());
            Platform.runLater(() -> {
                requestsContainer.getChildren().clear();
                Label errorLabel = new Label("حدث خطأ في تحميل الطلبات:\n" + e.getMessage());
                errorLabel.setStyle("-fx-text-fill: red; -fx-font-weight: bold; -fx-font-size: 14px;");
                requestsContainer.getChildren().add(errorLabel);
            });
        });
    }

    private void renderPendingRequests(List<Booking> bookings) {
        requestsContainer.getChildren().clear();
        if (bookings.isEmpty()) {
            Label empty = new Label("لا توجد طلبات معلقة حالياً.");
            empty.getStyleClass().add("admin-empty-label");
            empty.setStyle("-fx-font-size: 16px; -fx-text-fill: #555555; -fx-padding: 20px;");
            requestsContainer.getChildren().add(empty);
            return;
        }

        for (Booking b : bookings) {
            try {
                FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/admin/RequestCard.fxml"));
                VBox card = loader.load();
                RequestCardController controller = loader.getController();
                controller.setBooking(b, this::handleApproveClick, this::handleRejectClick);
                
                // Fixed width like branch manager (420px) — FlowPane will auto-wrap them
                card.setPrefWidth(420);
                // Click anywhere on the card to open detail popup
                card.setOnMouseClicked(evt -> showDetailOverlay(b));
                card.setStyle(card.getStyle() + " -fx-cursor: hand;");
                
                requestsContainer.getChildren().add(card);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    private void handleApproveClick(Booking req) {
        this.selectedRequest = req;
        boolean isMulti = "multi".equals(req.getRoomType());
        chkUrgent.setVisible(isMulti);
        chkUrgent.setManaged(isMulti);

        lblApproveDetails.setText("جاري البحث عن القاعات المتاحة لتاريخ " + req.getDate() + "...");
        cmbAvailableRooms.getItems().clear();
        approveRoomDocIdMap.clear();
        vboxAvailableRooms.setVisible(false);
        vboxAvailableRooms.setManaged(false);
        approveModalOverlay.setVisible(true);

        adminFacade.getAvailableRooms(req.getDate(), req.getTimeFrom(), req.getTimeTo(),
            req.getRoomType(), req.getRequiredCapacity(),
            roomMap -> {
                if (roomMap.isEmpty()) {
                    lblApproveDetails.setText("لا توجد قاعات متاحة بهذا التوقيت وهذه السعة.");
                } else {
                    lblApproveDetails.setText("تم العثور على قاعات متاحة، يرجى الاختيار:");
                    approveRoomDocIdMap.putAll(roomMap);  // display -> docId
                    cmbAvailableRooms.getItems().addAll(roomMap.keySet());
                    cmbAvailableRooms.getSelectionModel().selectFirst();
                    vboxAvailableRooms.setVisible(true);
                    vboxAvailableRooms.setManaged(true);
                }
            },
            e -> lblApproveDetails.setText("حدث خطأ أثناء البحث عن القاعات.")
        );
    }

    private void handleRejectClick(Booking req) {
        this.selectedRequest = req;
        txtRejectReason.clear();
        cmbSuggestedRoom.getItems().clear();
        rejectRoomDocIdMap.clear();
        cmbSuggestedRoom.getSelectionModel().clearSelection();
        dpSuggestedDate.setValue(null);

        // Build 12-hour time slots
        List<String> slots12h = new ArrayList<>();
        String[] hours = {"08:00 ص","09:00 ص","10:00 ص","11:00 ص","12:00 م",
                          "01:00 م","02:00 م","03:00 م","04:00 م","05:00 م","06:00 م"};
        slots12h.addAll(Arrays.asList(hours));
        cmbSuggestedSlot.getItems().setAll(slots12h);
        cmbSuggestedSlot.getSelectionModel().clearSelection();

        // Load available rooms (any type — show all available alternatives)
        adminFacade.getAvailableRooms(
            req.getDate(), req.getTimeFrom(), req.getTimeTo(), req.getRoomType(), 0,
            roomMap -> {
                rejectRoomDocIdMap.putAll(roomMap);  // display -> docId
                cmbSuggestedRoom.getItems().setAll(roomMap.keySet());
                if (!roomMap.isEmpty()) cmbSuggestedRoom.getSelectionModel().selectFirst();
            },
            e -> System.err.println("[Reject] getAvailableRooms error: " + e.getMessage())
        );

        rejectModalOverlay.setVisible(true);
    }

    @FXML private void confirmApprove() {
        if (selectedRequest == null) return;
        String displayName = cmbAvailableRooms.getValue();
        if (displayName == null || displayName.isEmpty()) {
            showAlert(Alert.AlertType.WARNING, "تنبيه", "يرجى اختيار قاعة أولاً.");
            return;
        }
        // Resolve display label to real Firestore document ID
        String roomDocId = approveRoomDocIdMap.getOrDefault(displayName, displayName);
        boolean isUrgent = chkUrgent.isSelected();
        adminFacade.approveRequest(selectedRequest, roomDocId, isUrgent,
            () -> {
                showAlert(Alert.AlertType.INFORMATION, "نجاح", "تم التعامل مع الطلب بنجاح.");
                closeModals();
                fetchPendingRequestsOnly();
            },
            e -> showAlert(Alert.AlertType.ERROR, "خطأ", "حدث خطأ أثناء حفظ التعديلات.")
        );
    }

    @FXML private void confirmReject() {
        if (selectedRequest == null) return;
        String reason = txtRejectReason.getText();
        if (reason == null || reason.trim().isEmpty()) {
            showAlert(Alert.AlertType.WARNING, "تنبيه", "يرجى إدخال سبب الرفض.");
            return;
        }
        String room = cmbSuggestedRoom.getValue();
        String date = dpSuggestedDate.getValue() != null ? dpSuggestedDate.getValue().toString() : null;
        // Time slot is already in 12h display — store as-is or convert back
        String slot = cmbSuggestedSlot.getValue();
        // Map 12h display back to 24h for storage
        String[] display12h = {"08:00 ص","09:00 ص","10:00 ص","11:00 ص","12:00 م",
                               "01:00 م","02:00 م","03:00 م","04:00 م","05:00 م","06:00 م"};
        String[] raw24h   = {"08:00","09:00","10:00","11:00","12:00",
                             "13:00","14:00","15:00","16:00","17:00","18:00"};
        String timeFrom = null, timeTo = null;
        if (slot != null) {
            for (int i = 0; i < display12h.length; i++) {
                if (display12h[i].equals(slot)) { timeFrom = raw24h[i]; break; }
            }
            // Set timeTo to one hour later
            if (timeFrom != null) {
                for (int i = 0; i < raw24h.length - 1; i++) {
                    if (raw24h[i].equals(timeFrom)) { timeTo = raw24h[i + 1]; break; }
                }
            }
        }

        adminFacade.rejectRequest(selectedRequest, reason, room, date, timeFrom, timeTo,
            () -> {
                showAlert(Alert.AlertType.INFORMATION, "نجاح", "تم رفض الطلب وإشعار الموظف بنجاح.");
                closeModals();
            },
            e -> showAlert(Alert.AlertType.ERROR, "خطأ", "حدث خطأ أثناء الرفض.")
        );
    }

    @FXML private void closeModals() {
        approveModalOverlay.setVisible(false);
        rejectModalOverlay.setVisible(false);
        selectedRequest = null;
    }

    // ─── Detail Overlay ──────────────────────────────────────────────────

    private void showDetailOverlay(Booking b) {
        boolean isMulti = "multi".equals(b.getRoomType());
        detailTitle.setText(isMulti ? "قاعة متعددة الأغراض" : "طلب قاعة استثنائية");
        detailStatusBadge.setText("awaiting_manager_final".equals(b.getStatus()) ? "بانتظار المدير" : "بانتظار الاعتماد");
        detailDate.setText(b.getDate() != null ? b.getDate() : "-");
        detailTime.setText((b.getTimeFrom() != null ? b.getTimeFrom() : "-") + "  ←  " + (b.getTimeTo() != null ? b.getTimeTo() : "-"));
        detailRequester.setText(b.getUserName() != null ? b.getUserName() : "-");
        detailResponsible.setText(b.getResponsibleName() != null && !b.getResponsibleName().isEmpty() ?
            b.getResponsibleJob() + " / " + b.getResponsibleName() : "لم يُحدد");
        detailCapacity.setText(b.getRequiredCapacity() > 0 ? b.getRequiredCapacity() + " شخص" : "لم تحدد");
        detailRoomType.setText(isMulti ? "قاعة متعددة الأغراض" : "قاعة محاضرات");
        detailPurpose.setText(b.getPurpose() != null ? b.getPurpose() : "-");

        // Requirements
        List<String> reqs = new ArrayList<>();
        if (b.isReqMic()) reqs.add("🎤 مايك × " + b.getReqMicQty());
        if (b.isReqLaptop()) reqs.add("💻 لاب توب");
        if (b.isReqVideoConf()) reqs.add("📹 فيديو كونفرنس");
        if (b.isReqOther() && b.getReqOtherDetails() != null) reqs.add("🔧 " + b.getReqOtherDetails());
        detailRequirements.setText(reqs.isEmpty() ? "لا توجد متطلبات إضافية" : String.join("  |  ", reqs));

        // Animate in
        detailOverlay.setVisible(true);
        detailCard.setScaleX(0.85); detailCard.setScaleY(0.85);
        detailCard.setOpacity(0);

        FadeTransition fade = new FadeTransition(Duration.millis(250), detailCard);
        fade.setFromValue(0); fade.setToValue(1);
        ScaleTransition scale = new ScaleTransition(Duration.millis(250), detailCard);
        scale.setFromX(0.85); scale.setToX(1.0);
        scale.setFromY(0.85); scale.setToY(1.0);
        new ParallelTransition(fade, scale).play();
    }

    @FXML private void closeDetailOverlay() {
        FadeTransition fade = new FadeTransition(Duration.millis(180), detailCard);
        fade.setFromValue(1); fade.setToValue(0);
        ScaleTransition scale = new ScaleTransition(Duration.millis(180), detailCard);
        scale.setFromX(1.0); scale.setToX(0.85);
        scale.setFromY(1.0); scale.setToY(0.85);
        ParallelTransition pt = new ParallelTransition(fade, scale);
        pt.setOnFinished(e -> detailOverlay.setVisible(false));
        pt.play();
    }

    private void showAlert(Alert.AlertType type, String title, String content) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        alert.showAndWait();
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
