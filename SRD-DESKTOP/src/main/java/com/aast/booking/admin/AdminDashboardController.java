package com.aast.booking.admin;

import com.aast.booking.auth.AuthService;
import com.aast.booking.core.SessionManager;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.stage.Stage;

import java.io.IOException;
import java.net.URL;
import java.util.ResourceBundle;

/** Placeholder controller — will be fully implemented later. */
public class AdminDashboardController implements Initializable {
    @FXML private Label welcomeLabel;

    @Override
    public void initialize(URL url, ResourceBundle rb) {
        var user = SessionManager.getInstance().getCurrentUser();
        if (user != null && welcomeLabel != null)
            welcomeLabel.setText("مرحباً " + user.getDisplayName() + " - المسؤول العام");
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
