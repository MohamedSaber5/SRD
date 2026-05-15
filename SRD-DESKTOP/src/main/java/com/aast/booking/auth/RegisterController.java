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
import javafx.stage.Stage;

import java.io.IOException;
import java.net.URL;
import java.util.ResourceBundle;

/**
 * Controller for Register.fxml
 * Mirrors the RegisterScreen.jsx register() logic.
 */
public class RegisterController implements Initializable {

    @FXML private TextField nameField;
    @FXML private TextField employeeIdField;
    @FXML private PasswordField passwordField;
    @FXML private PasswordField confirmPasswordField;
    @FXML private ComboBox<String> roleComboBox;
    @FXML private Button registerButton;
    @FXML private Label errorLabel;
    @FXML private Hyperlink goToLoginLink;

    @Override
    public void initialize(URL url, ResourceBundle resourceBundle) {
        errorLabel.setVisible(false);

        // Populate role options (employee & secretary available for self-registration)
        roleComboBox.getItems().addAll("موظف / أكاديمي", "سكرتير الكلية");
        roleComboBox.getSelectionModel().selectFirst();

        // Clear error on typing
        nameField.textProperty().addListener((o, old, v) -> hideError());
        employeeIdField.textProperty().addListener((o, old, v) -> hideError());
        passwordField.textProperty().addListener((o, old, v) -> hideError());
        confirmPasswordField.textProperty().addListener((o, old, v) -> hideError());
    }

    @FXML
    private void handleRegister() {
        String name      = nameField.getText().trim();
        String empId     = employeeIdField.getText().trim();
        String password  = passwordField.getText();
        String confirm   = confirmPasswordField.getText();
        String roleAr    = roleComboBox.getValue();

        // ── Validation ─────────────────────────────────────────────────────
        if (name.isEmpty() || empId.isEmpty() || password.isEmpty() || confirm.isEmpty()) {
            showError("يرجى تعبئة جميع الحقول");
            return;
        }
        if (!password.equals(confirm)) {
            showError("كلمتا المرور غير متطابقتين");
            return;
        }
        if (password.length() < 6) {
            showError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            return;
        }

        String role = mapRoleArabicToEnglish(roleAr);
        setLoading(true);

        Task<User> registerTask = new Task<>() {
            @Override
            protected User call() throws Exception {
                return AuthService.register(name, empId, role, password);
            }
        };

        registerTask.setOnSucceeded(e -> {
            setLoading(false);
            User user = registerTask.getValue();
            System.out.println("[RegisterController] Registration successful: " + user);

            try {
                Stage stage = SessionManager.getInstance().getPrimaryStage();
                DashboardFactory.openDashboard(user, stage);
            } catch (IOException ex) {
                ex.printStackTrace();
                showDashboardLoadError(user, ex);
            }
        });

        registerTask.setOnFailed(e -> {
            setLoading(false);
            Throwable error = registerTask.getException();
            if (error instanceof AuthService.AuthException authEx) {
                showError(authEx.getMessage());
            } else {
                showError("حدث خطأ غير متوقع. حاول مرة أخرى.");
            }
        });

        Thread thread = new Thread(registerTask);
        thread.setDaemon(true);
        thread.start();
    }

    @FXML
    private void goToLogin() {
        try {
            Stage stage = SessionManager.getInstance().getPrimaryStage();
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/Login.fxml"));
            Scene scene = new Scene(loader.load(), 1000, 680);
            scene.getStylesheets().add(getClass().getResource("/css/styles.css").toExternalForm());
            stage.setScene(scene);
        } catch (IOException e) {
            showError("خطأ في تحميل شاشة الدخول");
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private String mapRoleArabicToEnglish(String arabicRole) {
        return switch (arabicRole) {
            case "سكرتير الكلية"   -> "secretary";
            default                -> "employee";
        };
    }

    private void showError(String msg) {
        Platform.runLater(() -> {
            errorLabel.setText(msg);
            errorLabel.setVisible(true);
        });
    }

    private void hideError() {
        errorLabel.setVisible(false);
    }

    private void setLoading(boolean loading) {
        Platform.runLater(() -> {
            registerButton.setDisable(loading);
            registerButton.setText(loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب");
        });
    }

    private void showDashboardLoadError(User user, Exception ex) {
        Platform.runLater(() -> {
            Alert alert = new Alert(Alert.AlertType.ERROR);
            alert.setTitle("خطأ في التحميل");
            alert.setHeaderText("حدث خطأ أثناء تحميل لوحة التحكم");
            alert.setContentText(
                "تم إنشاء حسابك بنجاح، ولكن لم نتمكن من تحميل شاشة لوحة التحكم.\n\n" +
                "تفاصيل الخطأ: " + ex.getMessage()
            );
            alert.showAndWait();
        });
    }
}
