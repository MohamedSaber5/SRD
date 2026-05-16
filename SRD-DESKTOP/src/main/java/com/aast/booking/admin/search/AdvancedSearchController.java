package com.aast.booking.admin.search;

import com.aast.booking.models.Room;
import com.aast.booking.services.BranchManagerService;
import javafx.animation.FadeTransition;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.util.Duration;

import java.net.URL;
import java.time.LocalDate;
import java.util.List;
import java.util.ResourceBundle;

/**
 * DESIGN PATTERN: MVC Controller + Facade + Strategy (via RoomSearchService)
 * SOLID:
 *   - SRP:  Only handles UI interactions for the Advanced Search view.
 *   - DIP:  Delegates all business logic to RoomSearchService (strategy is resolved there).
 *   - OCP:  Adding a new room type only requires a new Strategy — this controller stays unchanged.
 *
 * Mirrors the AdvancedRoomSearch.jsx React component 1-to-1:
 *   - Room type selector  → changes time-picker panel (multi) vs. slot selector (fixed)
 *   - Date picker         → standard JavaFX DatePicker
 *   - Capacity field      → optional numeric filter
 *   - Ramadan Mode badge  → read from Firestore settings (same as web)
 *   - Results grid        → FlowPane of green room cards (matches web's CSS grid)
 */
public class AdvancedSearchController implements Initializable {

    // ── FXML Bindings ─────────────────────────────────────────────────────

    @FXML private ComboBox<String>      cmbRoomType;
    @FXML private DatePicker            dpSearchDate;
    @FXML private TextField             txtCapacity;

    // Multi-purpose time panel
    @FXML private HBox                  paneMultiTime;
    @FXML private ComboBox<LectureSlot> cmbTimeFrom;
    @FXML private ComboBox<LectureSlot> cmbTimeTo;
    @FXML private Label                 lblRamadanToHint;

    // Fixed room slot panel
    @FXML private VBox                  paneFixedSlot;
    @FXML private ComboBox<LectureSlot> cmbSlot;
    @FXML private Label                 lblSlotRamadanHint;

    // Ramadan banner
    @FXML private HBox                  ramadanBanner;

    // Results area
    @FXML private VBox                  resultsSection;
    @FXML private Label                 lblResultCount;
    @FXML private FlowPane              resultsGrid;
    @FXML private VBox                  emptyState;

    // Search button
    @FXML private Button                btnSearch;

    // ── State ─────────────────────────────────────────────────────────────

    private boolean isRamadanMode = false;
    private final RoomSearchService searchService = new RoomSearchService();

    // ── Initializable ─────────────────────────────────────────────────────

    @Override
    public void initialize(URL url, ResourceBundle rb) {
        setupRoomTypeComboBox();
        dpSearchDate.setValue(LocalDate.now());
        fetchRamadanMode();
        // Initial panel setup for default selection (multi)
        onRoomTypeChanged();
    }

    // ── Setup ─────────────────────────────────────────────────────────────

    private void setupRoomTypeComboBox() {
        cmbRoomType.getItems().addAll("متعددة الأغراض", "قاعات السكاشن (عادية)");
        cmbRoomType.getSelectionModel().selectFirst();
        cmbRoomType.setOnAction(e -> onRoomTypeChanged());
    }

    private void populateHourOptions() {
        int maxHour = RoomSlotConfig.getMultiMaxHour(isRamadanMode);
        List<LectureSlot> hours = RoomSlotConfig.getHourOptions(maxHour);

        cmbTimeFrom.getItems().setAll(hours);
        cmbTimeTo.getItems().setAll(hours);
        cmbTimeFrom.getSelectionModel().clearSelection();
        cmbTimeTo.getSelectionModel().clearSelection();
        cmbTimeFrom.setPromptText("اختر وقت البداية...");
        cmbTimeTo.setPromptText("اختر وقت النهاية...");

        // Update Ramadan hint on "to" label
        if (isRamadanMode) {
            lblRamadanToHint.setText("(حد رمضان: " + RoomSlotConfig.formatTime(String.format("%02d:00", maxHour)) + ")");
            lblRamadanToHint.setVisible(true);
            lblRamadanToHint.setManaged(true);
        } else {
            lblRamadanToHint.setVisible(false);
            lblRamadanToHint.setManaged(false);
        }
    }

    private void populateLectureSlots() {
        List<LectureSlot> slots = RoomSlotConfig.getActiveSlots(isRamadanMode);
        cmbSlot.getItems().setAll(slots);
        cmbSlot.getSelectionModel().clearSelection();
        cmbSlot.setPromptText("اختر فترة المحاضرة...");

        if (isRamadanMode) {
            lblSlotRamadanHint.setText("(جدول رمضان)");
            lblSlotRamadanHint.setVisible(true);
            lblSlotRamadanHint.setManaged(true);
        } else {
            lblSlotRamadanHint.setVisible(false);
            lblSlotRamadanHint.setManaged(false);
        }
    }

    // ── Event Handlers ────────────────────────────────────────────────────

    /** Called when room type ComboBox changes. Switches between time panels. */
    @FXML
    private void onRoomTypeChanged() {
        boolean isMulti = isMultiSelected();
        paneMultiTime.setVisible(isMulti);
        paneMultiTime.setManaged(isMulti);
        paneFixedSlot.setVisible(!isMulti);
        paneFixedSlot.setManaged(!isMulti);

        // Reset results on type change (mirrors web behavior)
        clearResults();

        if (isMulti) {
            populateHourOptions();
        } else {
            populateLectureSlots();
        }
    }

    /** Search button handler. Validates → builds SearchCriteria → delegates to service. */
    @FXML
    private void handleSearch() {
        String roomType  = isMultiSelected() ? "multi" : "fixed";
        LocalDate date   = dpSearchDate.getValue();
        String dateStr   = date != null ? date.toString() : LocalDate.now().toString();
        int capacity     = parseCapacity();

        SearchCriteria criteria;

        if ("multi".equals(roomType)) {
            LectureSlot from = cmbTimeFrom.getValue();
            LectureSlot to   = cmbTimeTo.getValue();
            criteria = new SearchCriteria(roomType, dateStr, capacity,
                    from != null ? from.getFrom() : "",
                    to   != null ? to.getFrom()   : "");
        } else {
            LectureSlot slot = cmbSlot.getValue();
            criteria = new SearchCriteria(roomType, dateStr, capacity, slot);
        }

        // Validate via strategy before network call
        RoomSearchStrategy strategy = SearchStrategyFactory.createStrategy(roomType);
        String validationError = strategy.validateInput(criteria);
        if (validationError != null) {
            showValidationAlert(validationError);
            return;
        }

        setSearching(true);
        clearResults();

        searchService.searchAvailableRooms(criteria,
                this::renderResults,
                ex -> {
                    setSearching(false);
                    showValidationAlert("حدث خطأ أثناء البحث: " + ex.getMessage());
                }
        );
    }

    // ── Results Rendering ─────────────────────────────────────────────────

    private void renderResults(List<Room> available) {
        setSearching(false);

        lblResultCount.setText(available.size() + " قاعة متاحة");
        resultsGrid.getChildren().clear();

        if (available.isEmpty()) {
            emptyState.setVisible(true);
            emptyState.setManaged(true);
            resultsGrid.setVisible(false);
            resultsGrid.setManaged(false);
        } else {
            emptyState.setVisible(false);
            emptyState.setManaged(false);
            resultsGrid.setVisible(true);
            resultsGrid.setManaged(true);

            for (Room r : available) {
                resultsGrid.getChildren().add(buildRoomCard(r));
            }
        }

        // Animate results section in (mirrors web fade-in slide-in)
        resultsSection.setVisible(true);
        resultsSection.setManaged(true);
        resultsSection.setOpacity(0);
        FadeTransition fade = new FadeTransition(Duration.millis(300), resultsSection);
        fade.setFromValue(0);
        fade.setToValue(1);
        fade.play();
    }

    /**
     * Builds a single room card matching the web's green card design:
     * - Room number (bold, large)
     * - Type label
     * - Capacity badge
     */
    private VBox buildRoomCard(Room room) {
        VBox card = new VBox(6);
        card.getStyleClass().add("search-result-card");
        card.setAlignment(Pos.CENTER);
        card.setPrefWidth(140);
        card.setMinWidth(120);

        Label lblNumber = new Label(room.getRoomNumber() != null ? room.getRoomNumber() : room.getId());
        lblNumber.getStyleClass().add("search-card-room-number");

        Label lblType = new Label(room.isMultiPurpose() ? "متعددة الأغراض" : "محاضرات عادية");
        lblType.getStyleClass().add("search-card-type");

        Label lblCap = new Label("سعة: " + room.getCapacity());
        lblCap.getStyleClass().add("search-card-capacity");

        card.getChildren().addAll(lblNumber, lblType, lblCap);
        return card;
    }

    // ── Ramadan Mode ──────────────────────────────────────────────────────

    private void fetchRamadanMode() {
        BranchManagerService.getInstance().fetchRamadanMode().thenAccept(mode -> {
            Platform.runLater(() -> applyRamadanMode(mode));
        });
    }

    private void applyRamadanMode(boolean on) {
        this.isRamadanMode = on;

        // Show/hide Ramadan banner (read-only indicator, same as web)
        if (ramadanBanner != null) {
            ramadanBanner.setVisible(on);
            ramadanBanner.setManaged(on);
        }

        // Refresh slot/hour options with new mode
        if (isMultiSelected()) {
            populateHourOptions();
        } else {
            populateLectureSlots();
        }

        clearResults();
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private boolean isMultiSelected() {
        return cmbRoomType.getSelectionModel().getSelectedIndex() == 0;
    }

    private int parseCapacity() {
        try {
            String text = txtCapacity.getText().trim();
            return text.isEmpty() ? 0 : Integer.parseInt(text);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private void clearResults() {
        if (resultsSection != null) {
            resultsSection.setVisible(false);
            resultsSection.setManaged(false);
        }
        if (resultsGrid != null) resultsGrid.getChildren().clear();
    }

    private void setSearching(boolean searching) {
        if (btnSearch != null) {
            btnSearch.setDisable(searching);
            btnSearch.setText(searching ? "⏳  جاري البحث..." : "🔍  بحث عن القاعات المتاحة");
        }
    }

    private void showValidationAlert(String message) {
        Alert alert = new Alert(Alert.AlertType.WARNING);
        alert.setTitle("تنبيه");
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
