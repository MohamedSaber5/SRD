package com.aast.booking.employee;

import com.aast.booking.core.SessionManager;
import com.aast.booking.models.Booking;
import com.aast.booking.services.BookingService;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.shape.Rectangle;

import java.net.URL;
import java.util.List;
import java.util.ResourceBundle;

/**
 * Controller for BookingList.fxml (the main dashboard view).
 * Mirrors UserDashboard.jsx logic exactly:
 *   - Loads bookings via onSnapshot (real-time)
 *   - Shows stats: approved, pending, rejected counts
 *   - Renders booking cards with status badges
 *   - For rejected: shows rejectReason + suggested alternative + re-submit button (Prototype)
 */
public class BookingListController implements Initializable {

    @FXML private Label welcomeLabel;
    @FXML private Label subtitleLabel;
    @FXML private Label approvedCountLabel;
    @FXML private Label pendingCountLabel;
    @FXML private Label rejectedCountLabel;
    @FXML private VBox bookingsContainer;
    @FXML private VBox emptyStateLabel;
    @FXML private ProgressIndicator loadingIndicator;

    private EmployeeDashboardController shellController;

    @Override
    public void initialize(URL url, ResourceBundle rb) {
        var user = SessionManager.getInstance().getCurrentUser();
        if (user != null) {
            String name = user.getDisplayName() != null ? user.getDisplayName() : "زميلنا الأكاديمي";
            welcomeLabel.setText("مرحباً " + name);
            subtitleLabel.setText("نظرة عامة على سجل طلبات الحجز الخاصة بك.");
        }

        fetchBookings();
    }

    public void fetchBookings() {
        // Start real-time listener (mirrors useEffect + onSnapshot in UserDashboard.jsx)
        loadingIndicator.setVisible(true);
        loadingIndicator.setManaged(true);
        emptyStateLabel.setVisible(false);
        emptyStateLabel.setManaged(false);

        BookingService.listenToMyBookings(
            this::renderBookings,
            err -> Platform.runLater(() -> {
                loadingIndicator.setVisible(false);
                loadingIndicator.setManaged(false);
                showError("تعذر تحميل الطلبات: " + err.getMessage());
            })
        );
    }

    public void setShellController(EmployeeDashboardController shell) {
        this.shellController = shell;
    }

    // ── Render all bookings (called on every Firestore snapshot update) ────
    private void renderBookings(List<Booking> bookings) {
        loadingIndicator.setVisible(false);
        loadingIndicator.setManaged(false);

        // Count stats (mirrors activeCount, pendingCount, rejectedCount in web)
        long approved = bookings.stream().filter(Booking::isApproved).count();
        long pending  = bookings.stream().filter(Booking::isPending).count();
        long rejected = bookings.stream().filter(Booking::isRejected).count();

        approvedCountLabel.setText(String.valueOf(approved));
        pendingCountLabel.setText(String.valueOf(pending));
        rejectedCountLabel.setText(String.valueOf(rejected));

        bookingsContainer.getChildren().clear();

        if (bookings.isEmpty()) {
            emptyStateLabel.setVisible(true);
            emptyStateLabel.setManaged(true);
            return;
        }
        emptyStateLabel.setVisible(false);
        emptyStateLabel.setManaged(false);

        for (Booking booking : bookings) {
            bookingsContainer.getChildren().add(buildBookingCard(booking));
        }
    }

    // ── Build a single booking card (mirrors the booking card in UserDashboard.jsx) ──
    private VBox buildBookingCard(Booking booking) {
        VBox card = new VBox(8);
        card.getStyleClass().add("booking-card");
        card.setPadding(new Insets(16));

        // Status color stripe on the LEFT (RTL → visual left = logical right)
        String stripeColor = switch (booking.getStatus() != null ? booking.getStatus() : "") {
            case "approved" -> "#22C55E";
            case "rejected" -> "#EF4444";
            default         -> "#D4AF37";
        };
        card.setStyle("-fx-background-color: white; -fx-background-radius: 14px; " +
                      "-fx-border-color: #E5E7EB; -fx-border-radius: 14px; -fx-border-width: 1; " +
                      "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.06), 8, 0, 0, 2);" +
                      "-fx-border-left-width: 0;");

        // Top row: room name + status badge
        HBox topRow = new HBox(10);
        topRow.setAlignment(Pos.CENTER_LEFT);

        // Room icon
        Label icon = new Label("🏛");
        icon.setStyle("-fx-font-size: 22px;");

        // Room ID label
        Label roomLabel = new Label(booking.getRoomId() != null ? booking.getRoomId() : "—");
        roomLabel.setStyle("-fx-font-size: 16px; -fx-font-weight: bold; -fx-text-fill: #111827;");

        // Status badge
        Label badge = buildStatusBadge(booking.getStatus());

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);
        topRow.getChildren().addAll(icon, roomLabel, badge);

        // Info row: date | time | purpose
        HBox infoRow = new HBox(16);
        infoRow.setAlignment(Pos.CENTER_LEFT);
        infoRow.getChildren().addAll(
            buildInfoChip("📅", booking.getDate()),
            buildInfoChip("🕐", booking.getTimeFrom() + " - " + booking.getTimeTo()),
            buildInfoChip("📝", booking.getPurpose() != null
                    ? booking.getPurpose().substring(0, Math.min(30, booking.getPurpose().length()))
                    : "—")
        );

        card.getChildren().addAll(topRow, infoRow);

        // ── REJECTED card extras ──────────────────────────────────────────
        if (booking.isRejected()) {
            // Reject reason
            if (booking.getRejectReason() != null && !booking.getRejectReason().isEmpty()) {
                HBox reasonBox = new HBox(6);
                reasonBox.setAlignment(Pos.CENTER_LEFT);
                reasonBox.setStyle("-fx-background-color: #FEF2F2; -fx-background-radius: 8px; -fx-padding: 8 10;");
                Label warnIcon = new Label("⚠️");
                Label reason = new Label("السبب: " + booking.getRejectReason());
                reason.setStyle("-fx-text-fill: #991B1B; -fx-font-weight: bold; -fx-font-size: 12px;");
                reason.setWrapText(true);
                reasonBox.getChildren().addAll(warnIcon, reason);
                card.getChildren().add(reasonBox);
            }

            // Suggested alternative + Re-submit button (PROTOTYPE PATTERN trigger)
            if (booking.hasSuggestedAlternative()) {
                HBox suggestionBox = new HBox(12);
                suggestionBox.setAlignment(Pos.CENTER_LEFT);
                suggestionBox.setStyle("-fx-background-color: #EFF6FF; -fx-background-radius: 10px; " +
                                       "-fx-border-color: #BFDBFE; -fx-border-radius: 10px; " +
                                       "-fx-border-width: 1; -fx-padding: 10 14;");

                // Suggestion details (chips)
                VBox suggestionDetails = new VBox(4);
                Label suggTitle = new Label("💡 تفاصيل البديل المقترح:");
                suggTitle.setStyle("-fx-font-weight: bold; -fx-text-fill: #1D4ED8; -fx-font-size: 12px;");
                HBox chips = new HBox(6);
                if (booking.getSuggestedRoomId() != null)
                    chips.getChildren().add(buildSuggestionChip("القاعة: " + booking.getSuggestedRoomId()));
                if (booking.getSuggestedDate() != null)
                    chips.getChildren().add(buildSuggestionChip("التاريخ: " + booking.getSuggestedDate()));
                if (booking.getSuggestedTimeFrom() != null)
                    chips.getChildren().add(buildSuggestionChip("الوقت: " + booking.getSuggestedTimeFrom() + " - " + booking.getSuggestedTimeTo()));
                suggestionDetails.getChildren().addAll(suggTitle, chips);

                Region suggSpacer = new Region();
                HBox.setHgrow(suggSpacer, Priority.ALWAYS);

                // Re-submit button → triggers PROTOTYPE PATTERN
                Button resubmitBtn = new Button("🔄 تقديم الطلب بالبديل");
                resubmitBtn.setStyle("-fx-background-color: #2563EB; -fx-text-fill: white; " +
                                      "-fx-font-weight: bold; -fx-font-size: 12px; " +
                                      "-fx-background-radius: 8px; -fx-padding: 8 14; -fx-cursor: hand;");
                resubmitBtn.setOnAction(e -> handleResubmitWithSuggestion(booking));

                suggestionBox.getChildren().addAll(suggestionDetails, suggSpacer, resubmitBtn);
                card.getChildren().add(suggestionBox);
            }
        }

        return card;
    }

    /**
     * Handles "تقديم الطلب بالبديل" button click.
     *
     * PROTOTYPE PATTERN:
     *   1. Calls BookingService.cloneWithSuggestions(booking) → deep clone + apply suggestions
     *   2. Passes the clone to BookingFormController for pre-filling
     *   3. User reviews and submits as a new booking
     */
    private void handleResubmitWithSuggestion(Booking rejectedBooking) {
        // Step 1: Clone the rejected booking and apply suggested values (Prototype)
        Booking clonedBooking = BookingService.cloneWithSuggestions(rejectedBooking);

        // Step 2: Open form with pre-filled data
        if (shellController != null) {
            shellController.showBookingFormWithPrefill(clonedBooking);
        }
    }

    // ── UI Helpers ─────────────────────────────────────────────────────────

    private Label buildStatusBadge(String status) {
        Label badge = new Label();
        badge.setPadding(new Insets(3, 10, 3, 10));
        badge.setStyle("-fx-background-radius: 20px; -fx-font-weight: bold; -fx-font-size: 11px;");

        switch (status != null ? status : "") {
            case "approved" -> {
                badge.setText("مقبول ✓");
                badge.setStyle(badge.getStyle() + "-fx-background-color: #DCFCE7; -fx-text-fill: #166534;");
            }
            case "awaiting_manager_final" -> {
                badge.setText("اعتماد نهائي");
                badge.setStyle(badge.getStyle() + "-fx-background-color: #FEF3C7; -fx-text-fill: #92400E;");
            }
            case "rejected" -> {
                badge.setText("مرفوض ✗");
                badge.setStyle(badge.getStyle() + "-fx-background-color: #FEE2E2; -fx-text-fill: #991B1B;");
            }
            default -> {
                badge.setText("قيد الانتظار");
                badge.setStyle(badge.getStyle() + "-fx-background-color: #F3F4F6; -fx-text-fill: #374151;");
            }
        }
        return badge;
    }

    private HBox buildInfoChip(String icon, String text) {
        HBox chip = new HBox(4);
        chip.setAlignment(Pos.CENTER_LEFT);
        Label iconLabel = new Label(icon);
        iconLabel.setStyle("-fx-font-size: 13px;");
        Label textLabel = new Label(text != null ? text : "—");
        textLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: #6B7280;");
        chip.getChildren().addAll(iconLabel, textLabel);
        return chip;
    }

    private Label buildSuggestionChip(String text) {
        Label chip = new Label(text);
        chip.setStyle("-fx-background-color: white; -fx-border-color: #BFDBFE; -fx-border-radius: 4px; " +
                      "-fx-border-width: 1; -fx-padding: 2 8; -fx-font-size: 11px; -fx-text-fill: #1E40AF;");
        return chip;
    }

    private void showError(String message) {
        bookingsContainer.getChildren().clear();
        Label err = new Label("⚠️ " + message);
        err.setStyle("-fx-text-fill: #991B1B; -fx-font-size: 14px;");
        bookingsContainer.getChildren().add(err);
    }
}
