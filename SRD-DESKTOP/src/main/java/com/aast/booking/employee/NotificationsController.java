package com.aast.booking.employee;

import com.aast.booking.models.BookingNotification;
import com.aast.booking.services.NotificationService;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressIndicator;
import javafx.scene.layout.*;

import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.ResourceBundle;

/**
 * Controller for Notifications.fxml.
 * Mirrors NotificationsPage.jsx logic exactly:
 *   - Real-time listener via onSnapshot
 *   - Mark single notification as read on click
 *   - "تحديد الكل كمقروء" button
 *   - Unread = highlighted blue border, read = grey
 */
public class NotificationsController implements Initializable {

    @FXML private VBox notificationsContainer;
    @FXML private Button markAllReadButton;
    @FXML private VBox emptyStateLabel;
    @FXML private ProgressIndicator loadingIndicator;

    private List<BookingNotification> currentNotifications;

    @Override
    public void initialize(URL url, ResourceBundle rb) {
        if (markAllReadButton != null) markAllReadButton.setVisible(false);
        if (loadingIndicator != null) {
            loadingIndicator.setVisible(true);
            loadingIndicator.setManaged(true);
        }
        if (emptyStateLabel != null) {
            emptyStateLabel.setVisible(false);
            emptyStateLabel.setManaged(false);
        }

        NotificationService.listenToMyNotifications(
            this::renderNotifications,
            err -> System.err.println("[Notifications] Error: " + err.getMessage())
        );
    }

    private void renderNotifications(List<BookingNotification> notifications) {
        this.currentNotifications = notifications;
        if (loadingIndicator != null) {
            loadingIndicator.setVisible(false);
            loadingIndicator.setManaged(false);
        }

        boolean hasUnread = notifications.stream().anyMatch(n -> !n.isRead());
        if (markAllReadButton != null) markAllReadButton.setVisible(hasUnread);

        if (notificationsContainer != null) notificationsContainer.getChildren().clear();

        if (notifications.isEmpty()) {
            if (emptyStateLabel != null) {
                emptyStateLabel.setVisible(true);
                emptyStateLabel.setManaged(true);
            }
            return;
        }
        if (emptyStateLabel != null) {
            emptyStateLabel.setVisible(false);
            emptyStateLabel.setManaged(false);
        }

        for (BookingNotification notif : notifications) {
            if (notificationsContainer != null) {
                notificationsContainer.getChildren().add(buildNotificationCard(notif));
            }
        }
    }

    private VBox buildNotificationCard(BookingNotification notif) {
        VBox card = new VBox(8);
        card.setPadding(new Insets(16));
        card.setStyle(notif.isRead()
            ? "-fx-background-color: #F9FAFB; -fx-background-radius: 14px; " +
              "-fx-border-color: #E5E7EB; -fx-border-radius: 14px; -fx-border-width: 1;"
            : "-fx-background-color: #EFF6FF; -fx-background-radius: 14px; " +
              "-fx-border-color: #BFDBFE; -fx-border-radius: 14px; -fx-border-width: 1; " +
              "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.06), 8, 0, 0, 2);");

        if (!notif.isRead()) {
            card.setCursor(javafx.scene.Cursor.HAND);
            card.setOnMouseClicked(e -> markAsRead(notif));
        }

        HBox topRow = new HBox(12);
        topRow.setAlignment(Pos.CENTER_LEFT);

        // Icon
        Label icon = new Label(notif.isModification() ? "✏️" : "ℹ️");
        icon.setStyle("-fx-font-size: 22px;");
        icon.setPadding(new Insets(8));
        icon.setStyle(icon.getStyle() + (notif.isModification()
            ? "-fx-background-color: #FEF3C7; -fx-background-radius: 50%;"
            : "-fx-background-color: #EFF6FF; -fx-background-radius: 50%;"));

        // Text content
        VBox textBox = new VBox(4);
        HBox.setHgrow(textBox, Priority.ALWAYS);

        Label message = new Label(notif.getMessage() != null ? notif.getMessage() : "—");
        message.setStyle((notif.isRead()
            ? "-fx-text-fill: #374151; "
            : "-fx-text-fill: #003087; -fx-font-weight: bold; ") + "-fx-font-size: 14px;");
        message.setWrapText(true);

        Label body = new Label("تم تحديث بيانات الحجز الخاص بك. يرجى مراجعة لوحة التحكم.");
        body.setStyle("-fx-text-fill: #6B7280; -fx-font-size: 12px;");
        body.setWrapText(true);

        textBox.getChildren().addAll(message, body);

        // Date
        Label dateLabel = new Label(notif.getCreatedAt() != null
            ? new SimpleDateFormat("yyyy/MM/dd HH:mm").format(notif.getCreatedAt())
            : "");
        dateLabel.setStyle("-fx-text-fill: #9CA3AF; -fx-font-size: 11px;");

        VBox rightBox = new VBox(4);
        rightBox.setAlignment(Pos.TOP_RIGHT);
        rightBox.getChildren().add(dateLabel);

        if (!notif.isRead()) {
            Label newBadge = new Label("● جديد");
            newBadge.setStyle("-fx-text-fill: #D4AF37; -fx-font-size: 10px; -fx-font-weight: bold;");
            rightBox.getChildren().add(newBadge);
        }

        topRow.getChildren().addAll(icon, textBox, rightBox);
        card.getChildren().add(topRow);

        return card;
    }

    private void markAsRead(BookingNotification notif) {
        NotificationService.markAsRead(notif.getId(), null, null);
    }

    @FXML
    private void handleMarkAllRead() {
        if (currentNotifications == null) return;
        NotificationService.markAllRead(currentNotifications, null, null);
    }
}
