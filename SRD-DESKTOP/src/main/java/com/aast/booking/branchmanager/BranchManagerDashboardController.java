package com.aast.booking.branchmanager;

import com.aast.booking.auth.AuthService;
import com.aast.booking.core.SessionManager;
import com.aast.booking.models.Booking;
import com.aast.booking.services.BookingService;
import com.aast.booking.services.BranchManagerService;
import com.aast.booking.patterns.command.*;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.Stage;

import java.io.IOException;
import java.net.URL;
import java.util.*;
import java.util.stream.Collectors;

public class BranchManagerDashboardController implements Initializable {

    // Sidebar nav buttons
    @FXML private Button btnDashboard, btnRequests, btnInstantBook, btnHistory;
    @FXML private Label welcomeLabel, roleLabel;

    // Header
    @FXML private Label pageTitle, pageSubtitle;
    @FXML private Button ramadanBtn;

    // Views
    @FXML private VBox dashboardView, pendingView, instantBookingView, historyView;

    // Stats
    @FXML private Label statPending, statApproved, statRejected, statTotal, statEmergency;
    @FXML private Label pendingCountBadge, pendingCountBadge2;

    // Cards containers
    @FXML private FlowPane cardsContainer, pendingCardsContainer;

    // Instant Booking
    @FXML private DatePicker bookDatePicker;
    @FXML private ComboBox<String> bookHallCombo, bookStartTimeCombo, bookEndTimeCombo;
    @FXML private TextField bookPurposeField, bookResponsibleField;
    @FXML private Label bookingStatusLabel;

    // History
    @FXML private ComboBox<String> historyFilter;
    @FXML private DatePicker historyDatePicker;
    @FXML private TableView<Booking> historyTable;
    @FXML private TableColumn<Booking, String> hColDate, hColTime, hColRoom, hColUser, hColPurpose, hColStatus;

    private boolean isRamadanMode = false;
    private List<Booking> allPendingBookings = new ArrayList<>();
    private ObservableList<Booking> historyBookings = FXCollections.observableArrayList();
    private Map<String, Map<String, Object>> roomsCache = new HashMap<>();

    private static final List<String> REGULAR_TIMES = Arrays.asList(
        "08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"
    );
    private static final List<String> RAMADAN_TIMES = Arrays.asList(
        "08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","17:25"
    );

    @Override
    public void initialize(URL url, ResourceBundle rb) {
        var user = SessionManager.getInstance().getCurrentUser();
        if (user != null) welcomeLabel.setText("مرحباً، " + user.getDisplayName());

        setupHistoryTable();
        setupInstantBookingForm();
        historyFilter.getItems().addAll("الكل", "approved", "rejected");
        historyFilter.setValue("الكل");
        historyFilter.setOnAction(e -> applyHistoryFilter());
        if (historyDatePicker != null) historyDatePicker.setOnAction(e -> applyHistoryFilter());

        fetchRoomsAndBookings();
        fetchRamadanMode();
        showDashboard();
    }

    // ─── Navigation ───────────────────────────────────────────────────────

    @FXML private void showDashboard() {
        setView(dashboardView);
        setActiveNav(btnDashboard);
        pageTitle.setText("لوحة التحكم");
        pageSubtitle.setText("نظرة عامة على طلبات القاعات متعددة الأغراض");
    }

    @FXML private void showPendingRequests() {
        setView(pendingView);
        setActiveNav(btnRequests);
        pageTitle.setText("الطلبات المعلقة");
        pageSubtitle.setText("طلبات بانتظار اعتماد مدير الفرع");
        renderCards(pendingCardsContainer, allPendingBookings);
    }

    @FXML private void showInstantBooking() {
        setView(instantBookingView);
        setActiveNav(btnInstantBook);
        pageTitle.setText("حجز فوري");
        pageSubtitle.setText("حجز قاعات متعددة الأغراض مع اعتماد فوري");
        bookingStatusLabel.setText("");
    }

    @FXML private void showHistory() {
        setView(historyView);
        setActiveNav(btnHistory);
        pageTitle.setText("سجل الطلبات");
        pageSubtitle.setText("سجل الطلبات المعتمدة والمرفوضة");
        refreshHistory();
    }

    private void setView(VBox active) {
        if(dashboardView != null) dashboardView.setVisible(false);
        if(pendingView != null) pendingView.setVisible(false);
        if(instantBookingView != null) instantBookingView.setVisible(false);
        if(historyView != null) historyView.setVisible(false);
        if(active != null) active.setVisible(true);
    }

    private void setActiveNav(Button active) {
        String inactive = "bm-nav-btn", activeStyle = "bm-nav-btn-active";
        for (Button b : new Button[]{btnDashboard, btnRequests, btnInstantBook, btnHistory}) {
            if (b != null) {
                b.getStyleClass().removeAll(inactive, activeStyle);
                b.getStyleClass().add(b == active ? activeStyle : inactive);
            }
        }
    }

    // ─── Data Fetching ────────────────────────────────────────────────────

    private final BranchManagerService managerService = BranchManagerService.getInstance();

    private void fetchRoomsAndBookings() {
        managerService.fetchMultiPurposeRooms()
            .thenCombine(managerService.fetchPendingBookings(), (rooms, pending) -> {
                Map<String, Map<String, Object>> roomMap = new HashMap<>();
                for (Map<String, Object> r : rooms) {
                    roomMap.put((String) r.get("id"), r);
                }
                
                // Sort pending
                pending.sort((a, b) -> {
                    boolean aUrgent = a.isUrgent();
                    boolean bUrgent = b.isUrgent();
                    if (aUrgent && !bUrgent) return -1;
                    if (!aUrgent && bUrgent) return 1;
                    Date da = a.getCreatedAt(), db2 = b.getCreatedAt();
                    if (da == null || db2 == null) return 0;
                    return db2.compareTo(da);
                });

                Platform.runLater(() -> {
                    roomsCache.clear();
                    roomsCache.putAll(roomMap);
                    allPendingBookings.clear();
                    allPendingBookings.addAll(pending);
                });
                return rooms;
            })
            .thenCombine(managerService.fetchHistoryBookings(), (rooms, history) -> {
                Platform.runLater(() -> {
                    historyBookings.setAll(history);
                    updateStats();
                    renderCards(pendingCardsContainer, allPendingBookings);
                    updateRoomCombo(rooms);
                });
                return null;
            })
            .exceptionally(ex -> {
                ex.printStackTrace();
                return null;
            });
    }

    private void updateStats() {
        int pending = allPendingBookings.size();
        int approved = (int) historyBookings.stream().filter(b -> "approved".equals(b.getStatus())).count();
        int rejected = (int) historyBookings.stream().filter(b -> "rejected".equals(b.getStatus())).count();

        // Emergency calculation (same logic as web: booked < 48h before event)
        int emergency = 0;
        for (Booking b : historyBookings) {
            if (b.getCreatedAt() != null && b.getDate() != null) {
                try {
                    java.time.LocalDate eventDate = java.time.LocalDate.parse(b.getDate());
                    java.time.LocalDate createdDate = b.getCreatedAt().toInstant()
                        .atZone(java.time.ZoneId.systemDefault()).toLocalDate();
                    long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(createdDate, eventDate);
                    if (daysBetween <= 2) emergency++;
                } catch (Exception ignored) {}
            }
        }

        if (statPending != null) statPending.setText(String.valueOf(pending));
        if (statApproved != null) statApproved.setText(String.valueOf(approved));
        if (statRejected != null) statRejected.setText(String.valueOf(rejected));
        if (statTotal != null) statTotal.setText(String.valueOf(pending + approved + rejected));
        if (statEmergency != null) statEmergency.setText(String.valueOf(emergency));

        String countStr = String.valueOf(pending);
        if (pendingCountBadge != null) pendingCountBadge.setText(countStr);
        if (pendingCountBadge2 != null) pendingCountBadge2.setText(countStr);
    }

    private void updateRoomCombo(List<Map<String, Object>> rooms) {
        if (bookHallCombo != null) {
            bookHallCombo.getItems().clear();
            for (Map<String, Object> r : rooms) {
                String name = r.get("roomNumber") != null ? (String) r.get("roomNumber") : (String) r.get("id");
                bookHallCombo.getItems().add(name + " | " + r.get("id"));
            }
        }
    }

    private void fetchRamadanMode() {
        managerService.fetchRamadanMode().thenAccept(mode -> {
            Platform.runLater(() -> applyRamadanState(mode));
        });
    }

    // ─── Card Builder ───────────────────────────────────────────────────

    private void renderCards(FlowPane container, List<Booking> bookings) {
        if (container == null) return;
        container.getChildren().clear();
        if (bookings.isEmpty()) {
            VBox empty = new VBox(10);
            empty.setAlignment(Pos.CENTER);
            empty.setPadding(new Insets(60));
            Label t = new Label("✅ جميع المهام مكتملة!");
            t.getStyleClass().add("bm-empty-title");
            Label s = new Label("لا توجد طلبات قاعات متعددة الأغراض بانتظارك حالياً.");
            s.getStyleClass().add("bm-empty-subtitle");
            empty.getChildren().addAll(t, s);
            container.getChildren().add(empty);
            return;
        }
        for (Booking b : bookings) container.getChildren().add(buildCard(b));
    }

    private VBox buildCard(Booking b) {
        Map<String, Object> roomInfo = roomsCache.get(b.getRoomId());

        VBox card = new VBox(12);
        card.getStyleClass().add("bm-request-card");
        card.setPrefWidth(420);

        HBox header = new HBox(10);
        header.setAlignment(Pos.CENTER_LEFT);

        VBox roomSection = new VBox(4);
        Label roomName = new Label(roomInfo != null ? safeStr(roomInfo.get("roomNumber")) : b.getRoomId());
        roomName.getStyleClass().add("bm-room-name");

        HBox metaBadges = new HBox(6);
        if (roomInfo != null) {
            if (roomInfo.get("building") != null)
                metaBadges.getChildren().add(badge("مبنى " + roomInfo.get("building"), "bm-badge-building"));
            if (roomInfo.get("floor") != null)
                metaBadges.getChildren().add(badge("الدور " + roomInfo.get("floor"), "bm-badge-building"));
            if (roomInfo.get("capacity") != null)
                metaBadges.getChildren().add(badge("سعة " + roomInfo.get("capacity") + " فرداً", "bm-badge-capacity"));
        }
        roomSection.getChildren().addAll(roomName, metaBadges);

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        VBox statusSection = new VBox(4);
        statusSection.setAlignment(Pos.TOP_RIGHT);
        if (b.isUrgent()) {
            statusSection.getChildren().add(badge("🚨 طلب عاجل", "bm-badge-urgent"));
        }
        statusSection.getChildren().add(badge("بانتظار الاعتماد النهائي", "bm-badge-pending"));
        header.getChildren().addAll(roomSection, spacer, statusSection);

        GridPane info = new GridPane();
        info.setHgap(10); info.setVgap(10);

        VBox dateChip = infoChip("📅  التاريخ", b.getDate() != null ? b.getDate() : "-");
        VBox timeChip = infoChip("🕐  الوقت", (b.getTimeFrom() != null ? b.getTimeFrom() : "-") + "  →  " + (b.getTimeTo() != null ? b.getTimeTo() : "-"));
        VBox userChip = infoChip("👤  مقدم الطلب",
            (b.getResponsibleName() != null ? b.getResponsibleName() : "") +
            (b.getUserName() != null ? "  (" + b.getUserName() + ")" : ""));

        ColumnConstraints c0 = new ColumnConstraints(); c0.setPercentWidth(50);
        ColumnConstraints c1 = new ColumnConstraints(); c1.setPercentWidth(50);
        info.getColumnConstraints().addAll(c0, c1);

        GridPane.setColumnIndex(dateChip, 0); GridPane.setRowIndex(dateChip, 0);
        GridPane.setColumnIndex(timeChip, 1); GridPane.setRowIndex(timeChip, 0);
        GridPane.setColumnSpan(userChip, 2); GridPane.setRowIndex(userChip, 1);
        info.getChildren().addAll(dateChip, timeChip, userChip);

        VBox purposeBlock = new VBox(4);
        purposeBlock.getStyleClass().add("bm-purpose-block");
        Label purposeLbl = new Label("الغرض من الاستخدام:");
        purposeLbl.getStyleClass().add("bm-purpose-label");
        Label purposeTxt = new Label("\"" + (b.getPurpose() != null ? b.getPurpose() : "-") + "\"");
        purposeTxt.getStyleClass().add("bm-purpose-text");
        purposeTxt.setWrapText(true);
        purposeBlock.getChildren().addAll(purposeLbl, purposeTxt);

        HBox specialBadges = new HBox(8);
        if (b.isHolidayEvent()) specialBadges.getChildren().add(badge("🎉  عطلة", "bm-badge-holiday"));
        if (b.isOfficialOccasion()) specialBadges.getChildren().add(badge("⭐  مناسبة رسمية", "bm-badge-holiday"));

        HBox reqBadges = new HBox(6);
        if (b.isReqMic()) reqBadges.getChildren().add(badge("🎤 مايك × " + b.getReqMicQty(), "bm-badge-building"));
        if (b.isReqLaptop()) reqBadges.getChildren().add(badge("💻 لاب توب", "bm-badge-building"));
        if (b.isReqVideoConf()) reqBadges.getChildren().add(badge("📹 فيديو كونفرنس", "bm-badge-building"));

        HBox actions = new HBox(10);
        Button approveBtn = new Button("✓  اعتماد الطلب");
        approveBtn.getStyleClass().add("bm-approve-btn");
        approveBtn.setMaxWidth(Double.MAX_VALUE);
        HBox.setHgrow(approveBtn, Priority.ALWAYS);
        approveBtn.setOnAction(e -> handleApprove(b));

        Button rejectBtn = new Button("✕  رفض");
        rejectBtn.getStyleClass().add("bm-reject-btn");
        rejectBtn.setOnAction(e -> handleReject(b));

        actions.getChildren().addAll(approveBtn, rejectBtn);

        card.getChildren().addAll(header, info, purposeBlock);
        if (!specialBadges.getChildren().isEmpty()) card.getChildren().add(specialBadges);
        if (!reqBadges.getChildren().isEmpty()) card.getChildren().add(reqBadges);
        card.getChildren().add(actions);

        return card;
    }

    private Label badge(String text, String styleClass) {
        Label l = new Label(text); l.getStyleClass().add(styleClass); return l;
    }

    private VBox infoChip(String labelText, String value) {
        VBox box = new VBox(3); box.getStyleClass().add("bm-info-chip");
        Label lbl = new Label(labelText); lbl.getStyleClass().add("bm-info-chip-label");
        Label val = new Label(value); val.getStyleClass().add("bm-info-chip-value");
        val.setWrapText(true); box.getChildren().addAll(lbl, val); return box;
    }

    private String safeStr(Object o) { return o != null ? o.toString() : ""; }

    // ─── Actions ──────────────────────────────────────────────────────────

    private void handleApprove(Booking b) {
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION, "تأكيد اعتماد الحجز؟", ButtonType.YES, ButtonType.NO);
        confirm.showAndWait().ifPresent(btn -> { 
            if (btn == ButtonType.YES) {
                new ApproveBookingCommand(b.getId(), this::fetchRoomsAndBookings).execute();
            }
        });
    }

    private void handleReject(Booking b) {
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION, "تأكيد رفض الحجز؟", ButtonType.YES, ButtonType.NO);
        confirm.showAndWait().ifPresent(btn -> { 
            if (btn == ButtonType.YES) {
                new RejectBookingCommand(b.getId(), this::fetchRoomsAndBookings).execute();
            }
        });
    }

    @FXML private void refreshAll() { fetchRoomsAndBookings(); }

    // ─── Instant Booking ──────────────────────────────────────────────────

    private void setupInstantBookingForm() {
        if(bookStartTimeCombo != null) bookStartTimeCombo.getItems().addAll(REGULAR_TIMES);
        if(bookEndTimeCombo != null) bookEndTimeCombo.getItems().addAll(REGULAR_TIMES);
    }

    @FXML private void handleInstantBooking() {
        if (bookDatePicker.getValue() == null || bookHallCombo.getValue() == null
            || bookStartTimeCombo.getValue() == null || bookEndTimeCombo.getValue() == null) return;

        String hallEntry = bookHallCombo.getValue();
        String roomId = hallEntry.contains("|") ? hallEntry.split("\\|")[1].trim() : hallEntry;

        Booking b = new Booking();
        b.setRoomId(roomId);
        b.setRoomType("multi");
        b.setDate(bookDatePicker.getValue().toString());
        b.setTimeFrom(bookStartTimeCombo.getValue());
        b.setTimeTo(bookEndTimeCombo.getValue());
        b.setPurpose(bookPurposeField.getText().trim());
        b.setResponsibleName(bookResponsibleField.getText().trim());
        b.setStatus("approved");
        b.setUserId(SessionManager.getInstance().getCurrentUser().getUid());
        b.setUserName(SessionManager.getInstance().getCurrentUser().getDisplayName());

        BookingService.submitBooking(b, () -> {
            bookDatePicker.setValue(null); bookHallCombo.setValue(null);
            bookStartTimeCombo.setValue(null); bookEndTimeCombo.setValue(null);
            bookPurposeField.clear(); bookResponsibleField.clear();
            fetchRoomsAndBookings();
            showHistory();
        }, ex -> ex.printStackTrace());
    }

    // ─── Ramadan Mode ─────────────────────────────────────────────────────

    @FXML private void toggleRamadanMode() {
        boolean newMode = !isRamadanMode;
        managerService.setRamadanMode(newMode).thenRun(() -> {
            Platform.runLater(() -> applyRamadanState(newMode));
        });
    }

    private void applyRamadanState(boolean on) {
        isRamadanMode = on;
        if (ramadanBtn != null) {
            if (on) {
                ramadanBtn.setText("🌙  وضع رمضان: مفعّل");
                ramadanBtn.getStyleClass().removeAll("bm-ramadan-off");
                ramadanBtn.getStyleClass().add("bm-ramadan-on");
                if(bookEndTimeCombo != null) bookEndTimeCombo.getItems().setAll(RAMADAN_TIMES);
            } else {
                ramadanBtn.setText("🌙  تفعيل وضع رمضان");
                ramadanBtn.getStyleClass().removeAll("bm-ramadan-on");
                ramadanBtn.getStyleClass().add("bm-ramadan-off");
                if(bookEndTimeCombo != null) bookEndTimeCombo.getItems().setAll(REGULAR_TIMES);
            }
        }
    }

    // ─── History ──────────────────────────────────────────────────────────

    private void setupHistoryTable() {
        if(hColDate == null) return;
        hColDate.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getDate()));
        hColTime.setCellValueFactory(d -> new SimpleStringProperty(
            d.getValue().getTimeFrom() + " - " + d.getValue().getTimeTo()));
        hColRoom.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getRoomId()));
        hColUser.setCellValueFactory(d -> {
            Booking b = d.getValue();
            String name = b.getResponsibleName() != null ? b.getResponsibleName() : b.getUserName();
            return new SimpleStringProperty(name != null ? name : "-");
        });
        hColPurpose.setCellValueFactory(d -> new SimpleStringProperty(
            d.getValue().getPurpose() != null ? d.getValue().getPurpose() : "-"));
        hColStatus.setCellValueFactory(d -> {
            String s = d.getValue().getStatus();
            return new SimpleStringProperty("approved".equals(s) ? "✓ معتمد" : "✗ مرفوض");
        });

        historyTable.setItems(historyBookings);
    }

    @FXML private void refreshHistory() {
        managerService.fetchHistoryBookings().thenAccept(list -> {
            Platform.runLater(() -> {
                historyBookings.setAll(list);
                applyHistoryFilter();
            });
        }).exceptionally(ex -> {
            ex.printStackTrace();
            return null;
        });
    }

    private void applyHistoryFilter() {
        if (historyFilter == null) return;
        String filter = historyFilter.getValue();
        java.time.LocalDate dateFilter = (historyDatePicker != null) ? historyDatePicker.getValue() : null;

        List<Booking> filtered = historyBookings.stream().filter(b -> {
            boolean statusMatch = (filter == null || "الكل".equals(filter) || filter.equals(b.getStatus()));
            boolean dateMatch = (dateFilter == null || dateFilter.toString().equals(b.getDate()));
            return statusMatch && dateMatch;
        }).collect(Collectors.toList());

        historyTable.setItems(FXCollections.observableArrayList(filtered));
    }

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
