package com.aast.booking.auth;

import com.aast.booking.core.DashboardFactory;
import com.aast.booking.core.SessionManager;
import com.aast.booking.models.User;
import javafx.application.Platform;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import javafx.stage.Stage;

import java.io.IOException;
import java.net.URL;
import java.util.ResourceBundle;

/**
 * Controller for Login.fxml
 *
 * Design Patterns used:
 *   - Singleton: SessionManager & FirebaseService accessed as singletons
 *   - Factory: DashboardFactory.openDashboard() opens the right screen per role
 *
 * Replicates the logic of LoginScreen.jsx's handleSubmit().
 */
public class LoginController implements Initializable {

    @FXML private TextField employeeIdField;
    @FXML private PasswordField passwordField;
    @FXML private Button loginButton;
    @FXML private Label errorLabel;
    @FXML private HBox loadingBox;
    @FXML private Label loadingLabel;
    @FXML private Hyperlink goToRegisterLink;

    @Override
    public void initialize(URL url, ResourceBundle resourceBundle) {
        // Hide error and loading by default
        errorLabel.setVisible(false);
        loadingBox.setVisible(false);

        // Allow Enter key to trigger login
        passwordField.setOnAction(e -> handleLogin());
        employeeIdField.setOnAction(e -> passwordField.requestFocus());

        // Clear error on typing
        employeeIdField.textProperty().addListener((o, old, v) -> hideError());
        passwordField.textProperty().addListener((o, old, v) -> hideError());
    }

    @FXML
    private void handleLogin() {
        String employeeId = employeeIdField.getText().trim();
        String password   = passwordField.getText();

        // ── Validation (mirrors LoginScreen.jsx handleSubmit) ──────────────
        if (employeeId.isEmpty() || password.isEmpty()) {
            showError("يرجى إدخال الرقم الوظيفي وكلمة المرور");
            return;
        }

        setLoading(true);

        // ── Run auth on background thread (don't block JavaFX thread) ──────
        Task<User> loginTask = new Task<>() {
            @Override
            protected User call() throws Exception {
                return AuthService.login(employeeId, password);
            }
        };

        loginTask.setOnSucceeded(e -> {
            setLoading(false);
            User user = loginTask.getValue();
            System.out.println("[LoginController] Login successful: " + user);

            // ── Factory Pattern: Open the correct dashboard ────────────────
            try {
                Stage stage = SessionManager.getInstance().getPrimaryStage();
                DashboardFactory.openDashboard(user, stage);
            } catch (IOException ex) {
                ex.printStackTrace();
                showDashboardLoadError(user, ex);
            }
        });

        loginTask.setOnFailed(e -> {
            setLoading(false);
            Throwable error = loginTask.getException();
            if (error instanceof AuthService.AuthException authEx) {
                showError(authEx.getMessage());
            } else {
                showError("حدث خطأ غير متوقع. حاول مرة أخرى.");
            }
        });

        Thread thread = new Thread(loginTask);
        thread.setDaemon(true);
        thread.start();
    }

    @FXML
    private void goToRegister() {
        try {
            Stage stage = SessionManager.getInstance().getPrimaryStage();
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/Register.fxml"));
            Scene scene = new Scene(loader.load(), 1000, 680);
            scene.getStylesheets().add(getClass().getResource("/css/styles.css").toExternalForm());
            stage.setScene(scene);
        } catch (IOException e) {
            showError("خطأ في تحميل شاشة التسجيل");
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private void showError(String message) {
        Platform.runLater(() -> {
            errorLabel.setText(message);
            errorLabel.setVisible(true);
        });
    }

    private void hideError() {
        errorLabel.setVisible(false);
    }

    private void setLoading(boolean loading) {
        Platform.runLater(() -> {
            loginButton.setDisable(loading);
            loginButton.setText(loading ? "جاري الدخول..." : "تسجيل الدخول");
            loadingBox.setVisible(loading);
        });
    }

    /**
     * Shows error when dashboard FXML fails to load.
     */
    private void showDashboardLoadError(User user, Exception ex) {
        Platform.runLater(() -> {
            Alert alert = new Alert(Alert.AlertType.ERROR);
            alert.setTitle("خطأ في التحميل");
            alert.setHeaderText("حدث خطأ أثناء تحميل لوحة التحكم");
            alert.setContentText(
                "لم نتمكن من تحميل شاشة لوحة التحكم الخاصة بك.\n\n" +
                "الدور: " + translateRole(user.getRole()) + "\n" +
                "الرقم الوظيفي: " + user.getEmployeeId() + "\n\n" +
                "تفاصيل الخطأ: " + ex.getMessage()
            );
            alert.showAndWait();
        });
    }

    private String translateRole(String role) {
        if (role == null) return "موظف";
        return switch (role) {
            case "admin", "temp_admin" -> "مسؤول عام";
            case "branch_manager"      -> "مدير فرع";
            case "secretary"           -> "سكرتير";
            default                    -> "موظف";
        };
    }
}
