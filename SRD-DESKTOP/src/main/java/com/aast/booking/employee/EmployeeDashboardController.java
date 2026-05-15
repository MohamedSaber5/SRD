package com.aast.booking.employee;

import com.aast.booking.auth.AuthService;
import com.aast.booking.core.SessionManager;
import com.aast.booking.models.BookingNotification;
import com.aast.booking.services.NotificationService;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.StackPane;
import javafx.stage.Stage;
import javafx.scene.Scene;

import java.io.IOException;
import java.net.URL;
import java.util.List;
import java.util.ResourceBundle;

/**
 * Shell controller for the Employee Dashboard.
 * Manages sidebar navigation and content area switching.
 * Holds the notification badge counter.
 */
public class EmployeeDashboardController implements Initializable {

    @FXML private Label userNameLabel;
    @FXML private Label userRoleLabel;
    @FXML private StackPane contentArea;

    // Header
    @FXML private Label pageTitle;
    @FXML private Label pageSubtitle;

    // Nav buttons (unified BM style)
    @FXML private Button btnDashboard;
    @FXML private Button btnNewBooking;
    @FXML private Button btnNotifications;

    private Node dashboardNode;
    private Node bookingFormNode;
    private Node notificationsNode;

    private BookingListController bookingListController;
    private BookingFormController bookingFormController;
    private NotificationsController notificationsController;

    @Override
    public void initialize(URL url, ResourceBundle rb) {
        var user = SessionManager.getInstance().getCurrentUser();
        if (user != null) {
            userNameLabel.setText("مرحباً، " + (user.getDisplayName() != null ? user.getDisplayName() : "مستخدم"));
            userRoleLabel.setText(translateRole(user.getRole()));
        }

        // Load all content nodes eagerly so we can switch without reload
        loadAllContent();

        // Subscribe to notifications for badge count
        NotificationService.listenToMyNotifications(
            this::updateNotifBadge,
            err -> System.err.println("[Dashboard] Notification error: " + err.getMessage())
        );

        // Show dashboard by default
        showDashboard();
    }

    private void loadAllContent() {
        try {
            // Load Booking List (main dashboard view)
            FXMLLoader dashLoader = new FXMLLoader(getClass().getResource("/fxml/employee/BookingList.fxml"));
            dashboardNode = dashLoader.load();
            // Store reference to BookingListController for data refresh
            bookingListController = dashLoader.getController();
            bookingListController.setShellController(this);

            // Load Booking Form
            FXMLLoader formLoader = new FXMLLoader(getClass().getResource("/fxml/employee/BookingForm.fxml"));
            bookingFormNode = formLoader.load();
            bookingFormController = formLoader.getController();
            bookingFormController.setShellController(this);

            // Load Notifications
            FXMLLoader notifLoader = new FXMLLoader(getClass().getResource("/fxml/employee/Notifications.fxml"));
            notificationsNode = notifLoader.load();
            notificationsController = notifLoader.getController();

        } catch (IOException e) {
            System.err.println("[EmployeeDashboard] Failed to load content: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ── Navigation ─────────────────────────────────────────────────────────

    @FXML
    public void showDashboard() {
        if (bookingListController != null) bookingListController.fetchBookings();
        setActiveNav(btnDashboard);
        setContent(dashboardNode);
        if (pageTitle != null) pageTitle.setText("لوحة التحكم");
        if (pageSubtitle != null) pageSubtitle.setText("نظرة عامة على طلبات الحجز");
    }

    @FXML
    public void showNewBooking() {
        bookingFormController.resetForm(null); // fresh form
        setActiveNav(btnNewBooking);
        setContent(bookingFormNode);
        if (pageTitle != null) pageTitle.setText("طلب حجز جديد");
        if (pageSubtitle != null) pageSubtitle.setText("تعبئة بيانات حجز قاعة");
    }

    /**
     * Opens booking form pre-filled with a prototype-cloned booking.
     * Called by BookingListController when "تقديم الطلب بالبديل" is clicked.
     */
    public void showBookingFormWithPrefill(com.aast.booking.models.Booking prefilled) {
        bookingFormController.resetForm(prefilled);
        setActiveNav(btnNewBooking);
        setContent(bookingFormNode);
        if (pageTitle != null) pageTitle.setText("طلب حجز جديد");
        if (pageSubtitle != null) pageSubtitle.setText("تعبئة بيانات حجز قاعة");
    }

    @FXML
    public void showNotifications() {
        setActiveNav(btnNotifications);
        setContent(notificationsNode);
        if (pageTitle != null) pageTitle.setText("الإشعارات");
        if (pageSubtitle != null) pageSubtitle.setText("متابعة تحديثات طلبات الحجز");
    }

    @FXML
    public void handleLogout() throws IOException {
        NotificationService.stopListening();
        com.aast.booking.services.BookingService.stopListening();
        AuthService.logout();

        Stage stage = SessionManager.getInstance().getPrimaryStage();
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/Login.fxml"));
        Scene scene = new Scene(loader.load(), 1000, 680);
        scene.getStylesheets().add(getClass().getResource("/css/styles.css").toExternalForm());
        stage.setScene(scene);
        stage.setMaximized(false);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private void setContent(Node node) {
        if (node == null) return;
        contentArea.getChildren().setAll(node);
    }

    private void setActiveNav(Button active) {
        for (Button btn : new Button[]{btnDashboard, btnNewBooking, btnNotifications}) {
            if (btn != null) {
                btn.getStyleClass().removeAll("bm-nav-btn-active");
                if (!btn.getStyleClass().contains("bm-nav-btn")) btn.getStyleClass().add("bm-nav-btn");
            }
        }
        if (active != null) {
            active.getStyleClass().removeAll("bm-nav-btn");
            if (!active.getStyleClass().contains("bm-nav-btn-active")) active.getStyleClass().add("bm-nav-btn-active");
        }
    }

    private void updateNotifBadge(List<BookingNotification> notifications) {
        long unreadCount = notifications.stream().filter(n -> !n.isRead()).count();
        Platform.runLater(() -> {
            // Update the notifications button text to show badge count
            if (btnNotifications != null && unreadCount > 0) {
                btnNotifications.setText("🔔  الإشعارات (" + unreadCount + ")");
            } else if (btnNotifications != null) {
                btnNotifications.setText("🔔  الإشعارات");
            }
        });
    }

    private String translateRole(String role) {
        if (role == null) return "موظف";
        return switch (role) {
            case "admin", "temp_admin" -> "مسؤول عام";
            case "branch_manager"      -> "مدير فرع";
            case "secretary"           -> "سكرتير";
            default                    -> "موظف / أكاديمي";
        };
    }
}
