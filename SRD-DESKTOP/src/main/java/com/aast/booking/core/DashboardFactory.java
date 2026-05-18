package com.aast.booking.core;

import com.aast.booking.models.User;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;

/**
 * DESIGN PATTERN: Factory
 *
 * Problem Solved: After login, we need to open different dashboards based on the user's role.
 *                 Without Factory, we'd have a huge if-else block in the LoginController.
 *                 Factory isolates this decision and makes adding new roles trivial.
 *
 * Creates and navigates to the appropriate dashboard based on the user's role.
 */
public class DashboardFactory {

    /**
     * Opens the correct dashboard for the logged-in user.
     * Mirrors the role-based routing in LoginScreen.jsx useEffect:
     *   if (role === 'admin') navigate('/admin')
     *   else if (role === 'branch_manager') navigate('/branch_manager')
     *   else navigate('/dashboard')
     *
     * @param user The authenticated user with their role set
     * @param stage The primary JavaFX stage
     */
    public static void openDashboard(User user, Stage stage) throws IOException {
        String fxmlPath = resolveFxmlPath(user.getRole());
        String title    = resolveTitle(user.getRole());

        FXMLLoader loader = new FXMLLoader(
            DashboardFactory.class.getResource(fxmlPath)
        );

        Scene scene = new Scene(loader.load());
        scene.getStylesheets().add(
            DashboardFactory.class.getResource("/css/styles.css").toExternalForm()
        );

        // Load role-specific stylesheet
        String cssRole = switch (user.getRole() != null ? user.getRole() : "") {
            case "admin", "temp_admin" -> "/css/admin.css";
            case "branch_manager"      -> "/css/branchmanager.css";
            case "secretary"           -> "/css/secretary.css";
            default                    -> "/css/employee.css";
        };
        var roleUrl = DashboardFactory.class.getResource(cssRole);
        if (roleUrl != null) scene.getStylesheets().add(roleUrl.toExternalForm());

        // Real-time Ramadan Theme toggler
        var ramadanUrl = DashboardFactory.class.getResource("/css/ramadan.css");
        if (ramadanUrl != null) {
            String ramadanCss = ramadanUrl.toExternalForm();
            com.google.cloud.firestore.ListenerRegistration reg = 
                com.aast.booking.services.RoomService.listenToRamadanMode(isRamadan -> {
                    javafx.application.Platform.runLater(() -> {
                        if (isRamadan) {
                            if (!scene.getStylesheets().contains(ramadanCss)) {
                                scene.getStylesheets().add(ramadanCss);
                            }
                            // Swap logo to Gold
                            javafx.scene.Node logoNode = scene.getRoot().lookup("#sidebarLogo");
                            if (logoNode instanceof javafx.scene.image.ImageView imgView) {
                                imgView.setImage(new javafx.scene.image.Image(
                                    DashboardFactory.class.getResourceAsStream("/images/logo_gold.png")
                                ));
                            }
                        } else {
                            scene.getStylesheets().remove(ramadanCss);
                            // Swap logo back to original
                            javafx.scene.Node logoNode = scene.getRoot().lookup("#sidebarLogo");
                            if (logoNode instanceof javafx.scene.image.ImageView imgView) {
                                imgView.setImage(new javafx.scene.image.Image(
                                    DashboardFactory.class.getResourceAsStream("/images/logo_aast.jpg")
                                ));
                            }
                        }
                    });
                });
            
            stage.setOnCloseRequest(event -> {
                if (reg != null) {
                    reg.remove();
                }
            });
        }

        stage.setTitle(title + " - " + user.getDisplayName());
        stage.setScene(scene);
        stage.setMaximized(true);
    }

    /**
     * Maps user role to the correct FXML file path.
     */
    private static String resolveFxmlPath(String role) {
        if (role == null) role = "employee";
        return switch (role) {
            case "admin", "temp_admin" -> "/fxml/admin/AdminDashboard.fxml";
            case "branch_manager"      -> "/fxml/branchmanager/BranchManagerDashboard.fxml";
            case "secretary"           -> "/fxml/secretary/SecretaryDashboard.fxml";
            default                    -> "/fxml/employee/EmployeeDashboard.fxml";
        };
    }

    /**
     * Maps user role to a human-readable Arabic window title.
     */
    private static String resolveTitle(String role) {
        if (role == null) role = "employee";
        return switch (role) {
            case "admin", "temp_admin" -> "لوحة تحكم المسؤول";
            case "branch_manager"      -> "لوحة مدير الفرع";
            case "secretary"           -> "لوحة السكرتير";
            default                    -> "لوحة الموظف";
        };
    }
}
