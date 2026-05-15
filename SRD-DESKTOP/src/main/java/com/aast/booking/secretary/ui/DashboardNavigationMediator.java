package com.aast.booking.secretary.ui;

import javafx.scene.Node;
import javafx.scene.layout.StackPane;

/**
 * DESIGN PATTERN: Mediator
 * Manages the transition between different views in the main content area (e.g., Dashboard overview vs New Booking form).
 */
public class DashboardNavigationMediator {
    private final StackPane contentArea;

    public DashboardNavigationMediator(StackPane contentArea) {
        this.contentArea = contentArea;
    }

    public void navigateTo(Node view) {
        contentArea.getChildren().clear();
        view.setVisible(true);
        contentArea.getChildren().add(view);
    }
}
