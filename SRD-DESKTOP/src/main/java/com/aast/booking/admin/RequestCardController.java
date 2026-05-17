package com.aast.booking.admin;

import com.aast.booking.models.Booking;
import javafx.fxml.FXML;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.*;

import java.util.function.Consumer;

/**
 * Controller for the admin pending-request card.
 *
 * UI Style: mirrors BranchManagerDashboardController.buildCard() exactly.
 * All children are built programmatically in buildUI() — the FXML is just
 * a skeleton VBox.  No FXML @FXML field bindings needed.
 *
 * Logic unchanged: onApproveAction / onRejectAction callbacks are still
 * called the same way as before.
 */
public class RequestCardController {

    @FXML private VBox cardRoot;   // the root VBox from FXML

    private Booking booking;
    private Consumer<Booking> onApproveAction;
    private Consumer<Booking> onRejectAction;

    /**
     * Called by AdminDashboardController after FXML load.
     * Populates the card's children with the BranchManager-style UI.
     */
    public void setBooking(Booking booking, Consumer<Booking> onApprove, Consumer<Booking> onReject) {
        this.booking  = booking;
        this.onApproveAction = onApprove;
        this.onRejectAction  = onReject;

        if (cardRoot != null) {
            cardRoot.getChildren().clear();
            buildUI(cardRoot, booking);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UI Builder — identical structure to BranchManagerDashboardController.buildCard()
    // ─────────────────────────────────────────────────────────────────────────

    private void buildUI(VBox card, Booking b) {

        // ── Header row: room/type label + status badges ──────────────────────
        HBox header = new HBox(10);
        header.setAlignment(Pos.CENTER_LEFT);

        VBox roomSection = new VBox(4);
        boolean isMulti = "multi".equals(b.getRoomType());
        Label roomName = new Label(isMulti ? "قاعة متعددة الأغراض" : "طلب قاعة استثنائية");
        roomName.getStyleClass().add("bm-room-name");

        HBox metaBadges = new HBox(6);
        String typeLabel = isMulti ? "متعددة الأغراض" : "محاضرات";
        metaBadges.getChildren().add(badge(typeLabel, "bm-badge-building"));
        if (b.getRequiredCapacity() > 0)
            metaBadges.getChildren().add(badge("سعة " + b.getRequiredCapacity() + " فرداً", "bm-badge-capacity"));

        roomSection.getChildren().addAll(roomName, metaBadges);

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        VBox statusSection = new VBox(4);
        statusSection.setAlignment(Pos.TOP_RIGHT);
        if (b.isUrgent())
            statusSection.getChildren().add(badge("🚨 طلب عاجل", "bm-badge-urgent"));
        statusSection.getChildren().add(badge("بانتظار الاعتماد", "bm-badge-pending"));
        header.getChildren().addAll(roomSection, spacer, statusSection);

        // ── Info chips grid: Date | Time ─────────────────────────────────────
        GridPane info = new GridPane();
        info.setHgap(10);
        info.setVgap(10);

        VBox dateChip = infoChip("📅  التاريخ",
                b.getDate() != null ? b.getDate() : "-");
        VBox timeChip = infoChip("🕐  الوقت",
                (b.getTimeFrom() != null ? b.getTimeFrom() : "-")
                + "  →  "
                + (b.getTimeTo() != null ? b.getTimeTo() : "-"));
        VBox userChip = infoChip("👤  مقدم الطلب",
                (b.getResponsibleName() != null && !b.getResponsibleName().isEmpty()
                        ? b.getResponsibleName() : "")
                + (b.getUserName() != null ? "  (" + b.getUserName() + ")" : ""));

        ColumnConstraints c0 = new ColumnConstraints();
        c0.setPercentWidth(50);
        ColumnConstraints c1 = new ColumnConstraints();
        c1.setPercentWidth(50);
        info.getColumnConstraints().addAll(c0, c1);

        GridPane.setColumnIndex(dateChip, 0); GridPane.setRowIndex(dateChip, 0);
        GridPane.setColumnIndex(timeChip, 1); GridPane.setRowIndex(timeChip, 0);
        GridPane.setColumnSpan(userChip, 2);  GridPane.setRowIndex(userChip, 1);
        info.getChildren().addAll(dateChip, timeChip, userChip);

        // ── Purpose block ────────────────────────────────────────────────────
        VBox purposeBlock = new VBox(4);
        purposeBlock.getStyleClass().add("bm-purpose-block");
        Label purposeLbl = new Label("الغرض من الاستخدام:");
        purposeLbl.getStyleClass().add("bm-purpose-label");
        Label purposeTxt = new Label("\"" + (b.getPurpose() != null ? b.getPurpose() : "-") + "\"");
        purposeTxt.getStyleClass().add("bm-purpose-text");
        purposeTxt.setWrapText(true);
        purposeBlock.getChildren().addAll(purposeLbl, purposeTxt);

        // ── Special occasion badges ───────────────────────────────────────────
        HBox specialBadges = new HBox(8);
        if (b.isHolidayEvent())     specialBadges.getChildren().add(badge("🎉  عطلة",           "bm-badge-holiday"));
        if (b.isOfficialOccasion()) specialBadges.getChildren().add(badge("⭐  مناسبة رسمية",  "bm-badge-holiday"));

        // ── Requirements badges ───────────────────────────────────────────────
        HBox reqBadges = new HBox(6);
        if (b.isReqMic())       reqBadges.getChildren().add(badge("🎤 مايك × " + b.getReqMicQty(), "bm-badge-building"));
        if (b.isReqLaptop())    reqBadges.getChildren().add(badge("💻 لاب توب",                    "bm-badge-building"));
        if (b.isReqVideoConf()) reqBadges.getChildren().add(badge("📹 فيديو كونفرنس",              "bm-badge-building"));

        // ── Responsible person row ────────────────────────────────────────────
        VBox respChip = infoChip("👔  المسؤول عن الحدث",
                (b.getResponsibleJob() != null && !b.getResponsibleJob().isEmpty()
                        ? b.getResponsibleJob() + "  —  " : "")
                + (b.getResponsibleName() != null ? b.getResponsibleName() : "-"));

        // ── Action buttons ────────────────────────────────────────────────────
        HBox actions = new HBox(10);
        Button approveBtn = new Button("✓  اعتماد وتخصيص قاعة");
        approveBtn.getStyleClass().add("bm-approve-btn");
        approveBtn.setMaxWidth(Double.MAX_VALUE);
        HBox.setHgrow(approveBtn, Priority.ALWAYS);
        approveBtn.setOnAction(e -> {
            if (onApproveAction != null) onApproveAction.accept(booking);
        });
        // stop click from bubbling to the card's detail overlay handler
        approveBtn.setOnMouseClicked(evt -> evt.consume());

        Button rejectBtn = new Button("✕  رفض الطلب");
        rejectBtn.getStyleClass().add("bm-reject-btn");
        rejectBtn.setOnAction(e -> {
            if (onRejectAction != null) onRejectAction.accept(booking);
        });
        rejectBtn.setOnMouseClicked(evt -> evt.consume());

        actions.getChildren().addAll(approveBtn, rejectBtn);

        // ── Assemble card ─────────────────────────────────────────────────────
        card.getChildren().addAll(header, info, respChip, purposeBlock);
        if (!specialBadges.getChildren().isEmpty()) card.getChildren().add(specialBadges);
        if (!reqBadges.getChildren().isEmpty())     card.getChildren().add(reqBadges);
        card.getChildren().add(actions);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Label badge(String text, String styleClass) {
        Label l = new Label(text);
        l.getStyleClass().add(styleClass);
        return l;
    }

    private VBox infoChip(String labelText, String value) {
        VBox box = new VBox(3);
        box.getStyleClass().add("bm-info-chip");
        Label lbl = new Label(labelText);
        lbl.getStyleClass().add("bm-info-chip-label");
        Label val = new Label(value);
        val.getStyleClass().add("bm-info-chip-value");
        val.setWrapText(true);
        box.getChildren().addAll(lbl, val);
        return box;
    }

    // ── Legacy FXML handlers (kept so FXML is valid, delegating to callbacks) ─

    @FXML
    private void handleApprove() {
        if (onApproveAction != null && booking != null)
            onApproveAction.accept(booking);
    }

    @FXML
    private void handleReject() {
        if (onRejectAction != null && booking != null)
            onRejectAction.accept(booking);
    }

    @FXML
    private void consumeClick(javafx.scene.input.MouseEvent event) {
        event.consume();
    }
}
