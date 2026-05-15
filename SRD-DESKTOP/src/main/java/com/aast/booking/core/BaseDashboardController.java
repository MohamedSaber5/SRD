package com.aast.booking.core;

import javafx.fxml.Initializable;
import java.net.URL;
import java.util.ResourceBundle;

/**
 * DESIGN PATTERN: Template Method
 * Provides the skeleton for dashboard initialization.
 */
public abstract class BaseDashboardController implements Initializable {

    @Override
    public final void initialize(URL location, ResourceBundle resources) {
        setupObservers();
        initUI();
        loadData();
    }

    /**
     * Hook for setting up event listeners and observers.
     */
    protected abstract void setupObservers();

    /**
     * Hook for initializing UI components (tables, columns, factories).
     */
    protected abstract void initUI();

    /**
     * Hook for loading data from the database.
     */
    protected abstract void loadData();
}
