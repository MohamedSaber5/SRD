package com.aast.booking;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.stage.Stage;
import com.aast.booking.core.FirebaseService;
import com.aast.booking.core.SessionManager;

import java.io.IOException;

/**
 * Main entry point for the AAST Room Booking Desktop Application.
 * Initializes Firebase and loads the Login screen.
 */
public class MainApp extends Application {

    @Override
    public void start(Stage primaryStage) throws IOException {
        // Initialize Firebase (Singleton Pattern)
        FirebaseService.getInstance().initialize();

        // Load Login FXML
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/Login.fxml"));
        Scene scene = new Scene(loader.load(), 1000, 680);
        scene.getStylesheets().add(getClass().getResource("/css/styles.css").toExternalForm());

        primaryStage.setTitle("نظام حجز القاعات - الأكاديمية العربية");
        primaryStage.setScene(scene);
        primaryStage.setMinWidth(900);
        primaryStage.setMinHeight(600);
        primaryStage.centerOnScreen();
        primaryStage.show();

        // Store stage reference in SessionManager (Singleton)
        SessionManager.getInstance().setPrimaryStage(primaryStage);
    }

    public static void main(String[] args) {
        launch(args);
    }
}
