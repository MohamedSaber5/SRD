package com.aast.booking.admin;

import com.aast.booking.core.SessionManager;
import com.aast.booking.models.Room;
import com.aast.booking.models.Booking;
import com.aast.booking.services.RoomService;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import java.net.URL;
import java.util.List;
import java.util.Optional;
import java.util.ResourceBundle;

public class RoomManagementController implements Initializable {

    @FXML private TextField searchField, capacityField;
    @FXML private ComboBox<String> typeFilter, statusFilter;
    @FXML private Button clearFilterBtn;
    @FXML private TableView<Room> roomTable;
    @FXML private TableColumn<Room, String> colName, colType, colBuilding, colCapacity, colStatus, colActions;

    // Form Modal
    @FXML private StackPane formModalOverlay;
    @FXML private Label formTitle;
    @FXML private TextField formName, formCapacity;
    @FXML private ComboBox<String> formType, formBuilding, formFloor, formStatus;
    @FXML private VBox formStatusContainer;
    @FXML private Button submitFormBtn;

    // Details Drawer
    @FXML private StackPane detailsModalOverlay;
    @FXML private Label detTitle, detSubtitle, detBuilding, detFloor, detCapacity, detStatus;
    @FXML private VBox detStatusContainer;
    @FXML private Label detActiveBookings, detHistoryBookings, detTotalBookings;

    private ObservableList<Room> allRooms = FXCollections.observableArrayList();
    private FilteredList<Room> filteredRooms;
    private Room editingRoom = null;
    private Room viewingRoom = null;
    // PROXY PATTERN (Prompt 8): role-based guard for room deletion and management
    private final com.aast.booking.patterns.permissions.SecurityProxy securityProxy =
        new com.aast.booking.patterns.permissions.SecurityProxy();

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        setupTable();
        setupFilters();
        setupForm();
        // Data is now loaded lazily via public refreshData()
    }

    public void refreshData() {
        loadRooms();
    }

    private void setupTable() {
        colName.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getRoomNumber()));
        colType.setCellValueFactory(d -> new SimpleStringProperty(
                d.getValue().isMultiPurpose() ? "متعددة الأغراض" : "محاضرات عادية"));
        colBuilding.setCellValueFactory(d -> new SimpleStringProperty(
                "مبنى " + d.getValue().getBuilding() + " - الدور " + d.getValue().getFloor()));
        colCapacity.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getCapacity() + " طالب"));
        colStatus.setCellValueFactory(d -> {
            String s = d.getValue().getStatus();
            return new SimpleStringProperty("available".equals(s) ? "متاحة للعمل" : "مغلقة");
        });
        
        colType.setCellFactory(param -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setGraphic(null);
                    setText(null);
                } else {
                    Label lbl = new Label(item);
                    lbl.setStyle("-fx-padding: 4 12; -fx-background-radius: 12; -fx-font-weight: bold; -fx-font-size: 11px;" +
                            ("متعددة الأغراض".equals(item) 
                                ? "-fx-background-color: #f3e8ff; -fx-text-fill: #9333ea;"
                                : "-fx-background-color: #dbeafe; -fx-text-fill: #2563eb;"));
                    setGraphic(lbl);
                    setAlignment(javafx.geometry.Pos.CENTER);
                }
            }
        });

        colStatus.setCellFactory(param -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setGraphic(null);
                    setText(null);
                } else {
                    boolean avail = "متاحة للعمل".equals(item);
                    String svg = avail ? "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" // Check
                                       : "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"; // Cross
                    String color = avail ? "#15803d" : "#b91c1c";
                    String bg = avail ? "#dcfce7" : "#fee2e2";
                    
                    Region icon = new Region();
                    icon.setStyle("-fx-shape: '" + svg + "'; -fx-background-color: " + color + "; -fx-min-width: 14px; -fx-min-height: 14px;");
                    
                    Label lbl = new Label(item, icon);
                    lbl.setGraphicTextGap(5);
                    lbl.setStyle("-fx-padding: 4 12; -fx-background-radius: 12; -fx-font-weight: bold; -fx-font-size: 11px; " +
                                 "-fx-background-color: " + bg + "; -fx-text-fill: " + color + ";");
                    setGraphic(lbl);
                    setAlignment(javafx.geometry.Pos.CENTER);
                }
            }
        });
        
        colActions.setCellFactory(param -> new TableCell<>() {
            private Button editBtn;
            private Button delBtn;
            private HBox pane;

            {
                editBtn = createIconButton("M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z", "#2563eb", "#dbeafe");
                delBtn = createIconButton("M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z", "#dc2626", "#fee2e2");
                
                editBtn.setStyle("-fx-background-color: #eff6ff; -fx-cursor: hand; -fx-padding: 6; -fx-background-radius: 50%;");
                delBtn.setStyle("-fx-background-color: #fef2f2; -fx-cursor: hand; -fx-padding: 6; -fx-background-radius: 50%;");

                editBtn.setOnAction(e -> {
                    Room r = getTableRow().getItem();
                    if (r != null) openForm(r);
                });
                
                delBtn.setOnAction(e -> {
                    Room r = getTableRow().getItem();
                    if (r != null) deleteRoom(r);
                });

                pane = new HBox(8, delBtn, editBtn);
                pane.setAlignment(javafx.geometry.Pos.CENTER);
            }

            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || getTableRow() == null || getTableRow().getItem() == null) {
                    setGraphic(null);
                } else {
                    setGraphic(pane);
                }
            }
        });

        roomTable.setRowFactory(tv -> {
            TableRow<Room> row = new TableRow<>();
            row.setOnMouseClicked(event -> {
                if (event.getClickCount() == 1 && (!row.isEmpty())) {
                    // Avoid opening details if clicked on graphic region (like our buttons)
                    if (event.getTarget() instanceof javafx.scene.layout.Region && 
                        ((javafx.scene.layout.Region)event.getTarget()).getParent() instanceof Button) {
                        return;
                    }
                    if (event.getTarget() instanceof Button) return;
                    
                    openDetails(row.getItem());
                }
            });
            return row;
        });
    }

    private Button createIconButton(String svgPath, String color, String hoverBg) {
        Region icon = new Region();
        icon.setStyle("-fx-shape: '" + svgPath + "'; -fx-background-color: " + color + "; -fx-min-width: 18px; -fx-min-height: 18px;");
        Button btn = new Button();
        btn.setGraphic(icon);
        btn.setStyle("-fx-background-color: transparent; -fx-cursor: hand; -fx-padding: 6; -fx-background-radius: 8;");
        btn.setOnMouseEntered(e -> btn.setStyle("-fx-background-color: " + hoverBg + "; -fx-cursor: hand; -fx-padding: 6; -fx-background-radius: 8;"));
        btn.setOnMouseExited(e -> btn.setStyle("-fx-background-color: transparent; -fx-cursor: hand; -fx-padding: 6; -fx-background-radius: 8;"));
        return btn;
    }

    private void setupFilters() {
        typeFilter.getItems().addAll("كل الأنواع", "قاعات محاضرات", "متعددة الأغراض");
        typeFilter.setValue("كل الأنواع");
        statusFilter.getItems().addAll("كل الحالات", "متاحة", "مغلقة للصيانة");
        statusFilter.setValue("كل الحالات");

        filteredRooms = new FilteredList<>(allRooms, p -> true);
        roomTable.setItems(filteredRooms);

        searchField.textProperty().addListener((obs, old, val) -> applyFilters());
        capacityField.textProperty().addListener((obs, old, val) -> applyFilters());
        typeFilter.valueProperty().addListener((obs, old, val) -> applyFilters());
        statusFilter.valueProperty().addListener((obs, old, val) -> applyFilters());
    }

    private void applyFilters() {
        String search = searchField.getText() == null ? "" : searchField.getText().toLowerCase();
        String capStr = capacityField.getText() == null ? "" : capacityField.getText();
        String type = typeFilter.getValue();
        String status = statusFilter.getValue();

        int minCap = 0;
        try { if (!capStr.isEmpty()) minCap = Integer.parseInt(capStr); } catch (Exception ignored) {}

        int finalMinCap = minCap;
        filteredRooms.setPredicate(room -> {
            boolean matchesSearch = room.getRoomNumber() != null && room.getRoomNumber().toLowerCase().contains(search);
            boolean matchesCap = room.getCapacity() >= finalMinCap;
            boolean matchesType = "كل الأنواع".equals(type) || 
                                 ("متعددة الأغراض".equals(type) && room.isMultiPurpose()) ||
                                 ("قاعات محاضرات".equals(type) && room.isFixedLecture());
            boolean matchesStatus = "كل الحالات".equals(status) ||
                                   ("متاحة".equals(status) && "available".equals(room.getStatus())) ||
                                   ("مغلقة للصيانة".equals(status) && "unavailable".equals(room.getStatus()));
            return matchesSearch && matchesCap && matchesType && matchesStatus;
        });

        clearFilterBtn.setVisible(!search.isEmpty() || !capStr.isEmpty() || !"كل الأنواع".equals(type) || !"كل الحالات".equals(status));
    }

    @FXML private void clearFilters() {
        searchField.clear();
        capacityField.clear();
        typeFilter.setValue("كل الأنواع");
        statusFilter.setValue("كل الحالات");
    }

    private void setupForm() {
        formType.getItems().addAll("محاضرات عادية", "متعددة الأغراض");
        formBuilding.getItems().addAll("A", "B");
        formFloor.getItems().addAll("0", "1", "2", "3", "4");
        formStatus.getItems().addAll("متاحة للعمل", "مغلقة للصيانة");

        formCapacity.textProperty().addListener((observable, oldValue, newValue) -> {
            if (!newValue.matches("\\d*")) {
                formCapacity.setText(newValue.replaceAll("[^\\d]", ""));
            }
        });
    }

    private void loadRooms() {
        RoomService.fetchRooms(rooms -> {
            allRooms.setAll(rooms);
            applyFilters();
        }, e -> showAlert("خطأ", "فشل تحميل القاعات: " + e.getMessage()));
    }

    @FXML private void showAddForm() {
        openForm(null);
    }

    private void openForm(Room room) {
        editingRoom = room;

        javafx.stage.Stage dialog = new javafx.stage.Stage();
        dialog.initModality(javafx.stage.Modality.APPLICATION_MODAL);
        dialog.initStyle(javafx.stage.StageStyle.UNDECORATED);
        dialog.setResizable(false);

        // ── Outer container with dark backdrop feel ────────────────────────
        VBox card = new VBox(20);
        card.setStyle(
            "-fx-background-color: white;" +
            "-fx-background-radius: 16;" +
            "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.35), 40, 0, 0, 8);" +
            "-fx-padding: 30;"
        );
        card.setPrefWidth(480);
        card.setNodeOrientation(javafx.geometry.NodeOrientation.RIGHT_TO_LEFT);

        // ── Title row ──────────────────────────────────────────────────────
        HBox titleRow = new HBox(10);
        titleRow.setAlignment(javafx.geometry.Pos.CENTER_LEFT);
        formTitle = new Label(room == null ? "إضافة قاعة جديدة" : "تعديل قاعة " + room.getRoomNumber());
        formTitle.setStyle("-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: #001e40;");
        HBox.setHgrow(formTitle, javafx.scene.layout.Priority.ALWAYS);
        javafx.scene.layout.Region spacer = new javafx.scene.layout.Region();
        HBox.setHgrow(spacer, javafx.scene.layout.Priority.ALWAYS);
        Button closeBtn = new Button("✖");
        closeBtn.setStyle("-fx-background-color: transparent; -fx-text-fill: #9ca3af; -fx-font-weight: bold; -fx-cursor: hand;");
        closeBtn.setOnAction(e -> dialog.close());
        titleRow.getChildren().addAll(formTitle, spacer, closeBtn);

        // ── Fields ─────────────────────────────────────────────────────────
        String fieldStyle = "-fx-background-color: #f8fafc; -fx-border-color: #e0e3e5; -fx-border-radius: 8; -fx-background-radius: 8; -fx-padding: 10;";
        String labelStyle = "-fx-font-weight: bold; -fx-text-fill: #5a7698; -fx-font-size: 13px;";
        String comboStyle = "-fx-background-color: #f8fafc; -fx-border-color: #e0e3e5; -fx-border-radius: 8; -fx-padding: 4;";

        // Name
        VBox nameBox = new VBox(5);
        Label nameLabel = new Label("الاسم / الرقم التعريفي");
        nameLabel.setStyle(labelStyle);
        formName = new TextField();
        formName.setPromptText("مثال: A-402");
        formName.setStyle(fieldStyle);
        nameBox.getChildren().addAll(nameLabel, formName);

        // Type + Building
        HBox row1 = new HBox(15);
        VBox typeBox = new VBox(5);
        Label typeLabel = new Label("نوع القاعة");
        typeLabel.setStyle(labelStyle);
        formType = new ComboBox<>();
        formType.getItems().addAll("محاضرات عادية", "متعددة الأغراض");
        formType.setMaxWidth(Double.MAX_VALUE);
        formType.setStyle(comboStyle);
        HBox.setHgrow(typeBox, javafx.scene.layout.Priority.ALWAYS);
        typeBox.getChildren().addAll(typeLabel, formType);

        VBox buildingBox = new VBox(5);
        Label buildingLabel = new Label("المبنى");
        buildingLabel.setStyle(labelStyle);
        formBuilding = new ComboBox<>();
        formBuilding.getItems().addAll("A", "B");
        formBuilding.setMaxWidth(Double.MAX_VALUE);
        formBuilding.setStyle(comboStyle);
        HBox.setHgrow(buildingBox, javafx.scene.layout.Priority.ALWAYS);
        buildingBox.getChildren().addAll(buildingLabel, formBuilding);
        row1.getChildren().addAll(typeBox, buildingBox);

        // Floor + Capacity
        HBox row2 = new HBox(15);
        VBox floorBox = new VBox(5);
        Label floorLabel = new Label("الدور");
        floorLabel.setStyle(labelStyle);
        formFloor = new ComboBox<>();
        formFloor.getItems().addAll("0", "1", "2", "3", "4");
        formFloor.setMaxWidth(Double.MAX_VALUE);
        formFloor.setStyle(comboStyle);
        HBox.setHgrow(floorBox, javafx.scene.layout.Priority.ALWAYS);
        floorBox.getChildren().addAll(floorLabel, formFloor);

        VBox capBox = new VBox(5);
        Label capLabel = new Label("سعة القاعة (أفراد)");
        capLabel.setStyle(labelStyle);
        formCapacity = new TextField();
        formCapacity.setPromptText("20");
        formCapacity.setStyle(fieldStyle);
        formCapacity.textProperty().addListener((obs, old, val) -> {
            if (!val.matches("\\d*")) formCapacity.setText(val.replaceAll("[^\\d]", ""));
        });
        HBox.setHgrow(capBox, javafx.scene.layout.Priority.ALWAYS);
        capBox.getChildren().addAll(capLabel, formCapacity);
        row2.getChildren().addAll(floorBox, capBox);

        // Status (edit only)
        formStatusContainer = new VBox(5);
        Label statusLabel = new Label("الحالة");
        statusLabel.setStyle(labelStyle);
        formStatus = new ComboBox<>();
        formStatus.getItems().addAll("متاحة للعمل", "مغلقة للصيانة");
        formStatus.setMaxWidth(Double.MAX_VALUE);
        formStatus.setStyle(comboStyle);
        formStatusContainer.getChildren().addAll(statusLabel, formStatus);

        VBox fields = new VBox(15);
        fields.getChildren().addAll(nameBox, row1, row2);

        // ── Pre-fill for edit ──────────────────────────────────────────────
        if (room == null) {
            formStatusContainer.setVisible(false);
            formStatusContainer.setManaged(false);
        } else {
            formName.setText(room.getRoomNumber());
            formCapacity.setText(String.valueOf(room.getCapacity()));
            formType.setValue(room.isMultiPurpose() ? "متعددة الأغراض" : "محاضرات عادية");
            formBuilding.setValue(room.getBuilding());
            formFloor.setValue(String.valueOf(room.getFloor()));
            formStatus.setValue("available".equals(room.getStatus()) ? "متاحة للعمل" : "مغلقة للصيانة");
            formStatusContainer.setVisible(true);
            formStatusContainer.setManaged(true);
            fields.getChildren().add(formStatusContainer);
        }

        // ── Action buttons ─────────────────────────────────────────────────
        HBox btnRow = new HBox(15);
        btnRow.setAlignment(javafx.geometry.Pos.CENTER_LEFT);
        btnRow.setStyle("-fx-padding: 10 0 0 0;");

        Button cancelBtn = new Button("إلغاء");
        cancelBtn.setPrefWidth(120);
        cancelBtn.setStyle("-fx-background-color: #f2f4f6; -fx-text-fill: #43474f; -fx-font-weight: bold; -fx-padding: 10; -fx-background-radius: 8; -fx-cursor: hand;");
        cancelBtn.setOnAction(e -> dialog.close());

        submitFormBtn = new Button(room == null ? "➕  إضافة القاعة" : "💾  حفظ التعديلات");
        submitFormBtn.setPrefWidth(160);
        submitFormBtn.setStyle("-fx-background-color: #10b981; -fx-text-fill: white; -fx-font-weight: bold; -fx-padding: 10; -fx-background-radius: 8; -fx-cursor: hand;");
        submitFormBtn.setOnAction(e -> {
            submitFormFromDialog();
            if (!submitFormBtn.isDisable()) {
                // will close after success in submitFormFromDialog
            }
        });

        btnRow.getChildren().addAll(cancelBtn, submitFormBtn);

        card.getChildren().addAll(titleRow, fields, btnRow);

        // ── Scene & Stage setup ────────────────────────────────────────────
        StackPane root = new StackPane(card);
        root.setStyle("-fx-background-color: transparent;");
        javafx.scene.Scene scene = new javafx.scene.Scene(root);
        scene.setFill(javafx.scene.paint.Color.TRANSPARENT);
        dialog.setScene(scene);

        // Center on owner window
        if (roomTable.getScene() != null && roomTable.getScene().getWindow() != null) {
            javafx.stage.Window owner = roomTable.getScene().getWindow();
            dialog.setX(owner.getX() + (owner.getWidth() - 480) / 2);
            dialog.setY(owner.getY() + (owner.getHeight() - 520) / 2);
            dialog.initOwner(owner);
        }

        // Store reference for submitFormFromDialog to close
        this.activeDialog = dialog;
        dialog.showAndWait();
    }

    private javafx.stage.Stage activeDialog = null;

    @FXML private void closeForm() {
        if (activeDialog != null) activeDialog.close();
        formModalOverlay.setVisible(false);
        editingRoom = null;
    }

    private void submitFormFromDialog() {
        String name = formName != null ? formName.getText() : null;
        String capStr = formCapacity != null ? formCapacity.getText() : null;
        String type = formType != null ? formType.getValue() : null;
        String building = formBuilding != null ? formBuilding.getValue() : null;
        String floorStr = formFloor != null ? formFloor.getValue() : null;

        if (name == null || name.isEmpty() || capStr == null || capStr.isEmpty() ||
            type == null || building == null || floorStr == null) {
            Alert a = new Alert(Alert.AlertType.WARNING);
            a.setHeaderText(null);
            a.setContentText("يرجى تعبئة جميع الحقول المطلوبة.");
            a.showAndWait();
            return;
        }

        Room r = editingRoom != null ? editingRoom : new Room();
        r.setRoomNumber(name.trim());
        try { r.setCapacity(Integer.parseInt(capStr.trim())); } catch (Exception e) { r.setCapacity(0); }
        r.setType("متعددة الأغراض".equals(type) ? "multi" : "fixed");
        r.setBuilding(building);
        try { r.setFloor(Integer.parseInt(floorStr)); } catch (Exception e) { r.setFloor(1); }

        if (editingRoom != null) {
            r.setStatus("مغلقة للصيانة".equals(formStatus.getValue()) ? "unavailable" : "available");
        }

        submitFormBtn.setDisable(true);
        if (editingRoom == null) {
            RoomService.addRoom(r, v -> Platform.runLater(() -> {
                if (activeDialog != null) activeDialog.close();
                editingRoom = null;
                loadRooms();
            }), e -> Platform.runLater(() -> {
                submitFormBtn.setDisable(false);
                if (e.getMessage() != null && e.getMessage().contains("مستخدم بالفعل")) {
                    showDuplicateRoomAlert(r.getRoomNumber());
                } else {
                    showAlert("خطأ", e.getMessage());
                }
            }));
        } else {
            new com.aast.booking.patterns.command.UpdateRoomCommand(r, () -> Platform.runLater(() -> {
                if (activeDialog != null) activeDialog.close();
                editingRoom = null;
                loadRooms();
            }), e -> Platform.runLater(() -> {
                submitFormBtn.setDisable(false);
                if (e.getMessage() != null && e.getMessage().contains("مستخدم بالفعل")) {
                    showDuplicateRoomAlert(r.getRoomNumber());
                } else {
                    showAlert("خطأ", e.getMessage());
                }
            })).execute();
        }
    }

    /** Required by FXML onAction="#submitForm" — delegates to programmatic form logic */
    @FXML private void submitForm() { submitFormFromDialog(); }

    private void deleteRoom(Room room) {
        // PROXY PATTERN (Prompt 8): only admin / authorised roles can delete rooms
        if (!securityProxy.canAccess("manage_rooms")) return;

        RoomService.fetchRoomBookings(room.getId(), bookings -> {
            List<Booking> active = bookings.stream().filter(b ->
                "pending".equals(b.getStatus()) || "approved".equals(b.getStatus()) ||
                "awaiting_manager_final".equals(b.getStatus()) || "approved_by_branch".equals(b.getStatus())
            ).toList();

            Platform.runLater(() -> {
                if (!active.isEmpty()) {
                    // ── Styled "cannot delete" popup ──────────────────────────
                    showBookedRoomAlert(room.getRoomNumber(), active.size());
                } else {
                    Alert alert = new Alert(Alert.AlertType.CONFIRMATION,
                        "هل أنت متأكد من حذف القاعة " + room.getRoomNumber() + "؟");
                    alert.showAndWait().ifPresent(res -> {
                        if (res == ButtonType.OK) {
                            RoomService.deleteRoom(room.getId(), null, v -> loadRooms(), e -> showAlert("خطأ", e.getMessage()));
                        }
                    });
                }
            });
        }, e -> showAlert("خطأ", "فشل التحقق من حجوزات القاعة: " + e.getMessage()));
    }

    /**
     * Shows a premium styled alert informing the admin that a booked room cannot be deleted.
     */
    private void showBookedRoomAlert(String roomNumber, int bookingCount) {
        javafx.stage.Stage popup = new javafx.stage.Stage();
        popup.initModality(javafx.stage.Modality.APPLICATION_MODAL);
        popup.initStyle(javafx.stage.StageStyle.UNDECORATED);
        popup.setResizable(false);

        // ── Layout ──────────────────────────────────────────────
        VBox root = new VBox(0);
        root.setAlignment(javafx.geometry.Pos.TOP_CENTER);
        root.setStyle(
            "-fx-background-color: #ffffff;" +
            "-fx-background-radius: 18;" +
            "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.35), 40, 0, 0, 8);"
        );
        root.setPrefWidth(420);

        // Header bar (red)
        VBox header = new VBox(10);
        header.setAlignment(javafx.geometry.Pos.CENTER);
        header.setStyle(
            "-fx-background-color: #b91c1c;" +
            "-fx-background-radius: 18 18 0 0;" +
            "-fx-padding: 22 24 18 24;"
        );
        Label iconLbl = new Label("🚫");
        iconLbl.setStyle("-fx-font-size: 40px;");
        Label titleLbl = new Label("لا يمكن حذف قاعة محجوزة");
        titleLbl.setStyle(
            "-fx-font-size: 18px; -fx-font-weight: bold;" +
            "-fx-text-fill: #ffffff; -fx-font-family: 'Arial';"
        );
        titleLbl.setWrapText(true);
        header.getChildren().addAll(iconLbl, titleLbl);

        // Body
        VBox body = new VBox(14);
        body.setAlignment(javafx.geometry.Pos.CENTER);
        body.setStyle("-fx-padding: 24 28 10 28;");

        Label roomLbl = new Label("القاعة:  " + roomNumber);
        roomLbl.setStyle(
            "-fx-font-size: 15px; -fx-font-weight: bold;" +
            "-fx-text-fill: #1e293b; -fx-background-color: #fee2e2;" +
            "-fx-background-radius: 8; -fx-padding: 8 16;"
        );

        Label msgLbl = new Label(
            "هذه القاعة لديها " + bookingCount + " حجز" + (bookingCount > 1 ? "ات" : "") +
            " نشطة.\nيجب إلغاء أو إنهاء جميع الحجوزات النشطة\nقبل حذف هذه القاعة."
        );
        msgLbl.setStyle(
            "-fx-font-size: 14px; -fx-text-fill: #475569;" +
            "-fx-line-spacing: 4; -fx-text-alignment: center;"
        );
        msgLbl.setTextAlignment(javafx.scene.text.TextAlignment.CENTER);
        msgLbl.setWrapText(true);

        // Divider
        javafx.scene.layout.Region divider = new javafx.scene.layout.Region();
        divider.setStyle("-fx-background-color: #fee2e2; -fx-min-height: 1; -fx-max-height: 1;");
        divider.setMaxWidth(Double.MAX_VALUE);

        body.getChildren().addAll(roomLbl, msgLbl, divider);

        // Footer with close button
        HBox footer = new HBox();
        footer.setAlignment(javafx.geometry.Pos.CENTER);
        footer.setStyle("-fx-padding: 16 28 24 28;");
        Button closeBtn = new Button("حسناً، فهمت");
        closeBtn.setStyle(
            "-fx-background-color: #b91c1c; -fx-text-fill: white;" +
            "-fx-font-size: 14px; -fx-font-weight: bold;" +
            "-fx-background-radius: 10; -fx-padding: 10 40;" +
            "-fx-cursor: hand;"
        );
        closeBtn.setOnMouseEntered(e -> closeBtn.setStyle(
            "-fx-background-color: #991b1b; -fx-text-fill: white;" +
            "-fx-font-size: 14px; -fx-font-weight: bold;" +
            "-fx-background-radius: 10; -fx-padding: 10 40;" +
            "-fx-cursor: hand;"
        ));
        closeBtn.setOnMouseExited(e -> closeBtn.setStyle(
            "-fx-background-color: #b91c1c; -fx-text-fill: white;" +
            "-fx-font-size: 14px; -fx-font-weight: bold;" +
            "-fx-background-radius: 10; -fx-padding: 10 40;" +
            "-fx-cursor: hand;"
        ));
        closeBtn.setOnAction(e -> popup.close());
        footer.getChildren().add(closeBtn);

        root.getChildren().addAll(header, body, footer);

        javafx.scene.Scene scene = new javafx.scene.Scene(root);
        scene.setFill(javafx.scene.paint.Color.TRANSPARENT);
        popup.setScene(scene);
        popup.showAndWait();
    }

    /**
     * Shows a premium styled red warning informing the user that the room number already exists.
     */
    private void showDuplicateRoomAlert(String roomNumber) {
        javafx.stage.Stage popup = new javafx.stage.Stage();
        popup.initModality(javafx.stage.Modality.APPLICATION_MODAL);
        popup.initStyle(javafx.stage.StageStyle.UNDECORATED);
        popup.setResizable(false);

        // ── Layout ──────────────────────────────────────────────
        VBox root = new VBox(0);
        root.setAlignment(javafx.geometry.Pos.TOP_CENTER);
        root.setStyle(
            "-fx-background-color: #ffffff;" +
            "-fx-background-radius: 18;" +
            "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.35), 40, 0, 0, 8);"
        );
        root.setPrefWidth(420);

        // Header bar (red)
        VBox header = new VBox(10);
        header.setAlignment(javafx.geometry.Pos.CENTER);
        header.setStyle(
            "-fx-background-color: #b91c1c;" +
            "-fx-background-radius: 18 18 0 0;" +
            "-fx-padding: 22 24 18 24;"
        );
        Label iconLbl = new Label("🚫");
        iconLbl.setStyle("-fx-font-size: 40px;");
        Label titleLbl = new Label("اسم القاعة مستخدم بالفعل");
        titleLbl.setStyle(
            "-fx-font-size: 18px; -fx-font-weight: bold;" +
            "-fx-text-fill: #ffffff; -fx-font-family: 'Arial';"
        );
        titleLbl.setWrapText(true);
        header.getChildren().addAll(iconLbl, titleLbl);

        // Body
        VBox body = new VBox(14);
        body.setAlignment(javafx.geometry.Pos.CENTER);
        body.setStyle("-fx-padding: 24 28 10 28;");

        Label roomLbl = new Label("القاعة:  " + roomNumber);
        roomLbl.setStyle(
            "-fx-font-size: 15px; -fx-font-weight: bold;" +
            "-fx-text-fill: #b91c1c; -fx-background-color: #fee2e2;" +
            "-fx-background-radius: 8; -fx-padding: 8 16;"
        );

        Label msgLbl = new Label(
            "رقم أو اسم هذه القاعة مسجل بالفعل في النظام.\n" +
            "يرجى كتابة رقم قاعة آخر غير مكرر لإتمام عملية الإضافة بنجاح."
        );
        msgLbl.setStyle(
            "-fx-font-size: 14px; -fx-text-fill: #475569;" +
            "-fx-line-spacing: 4; -fx-text-alignment: center; -fx-font-family: 'Arial';"
        );
        msgLbl.setTextAlignment(javafx.scene.text.TextAlignment.CENTER);
        msgLbl.setWrapText(true);

        // Divider
        javafx.scene.layout.Region divider = new javafx.scene.layout.Region();
        divider.setStyle("-fx-background-color: #fee2e2; -fx-min-height: 1; -fx-max-height: 1;");
        divider.setMaxWidth(Double.MAX_VALUE);

        body.getChildren().addAll(roomLbl, msgLbl, divider);

        // Footer with close button
        HBox footer = new HBox();
        footer.setAlignment(javafx.geometry.Pos.CENTER);
        footer.setStyle("-fx-padding: 16 28 24 28;");
        Button closeBtn = new Button("حسناً، فهمت");
        closeBtn.setStyle(
            "-fx-background-color: #b91c1c; -fx-text-fill: white;" +
            "-fx-font-size: 14px; -fx-font-weight: bold; -fx-font-family: 'Arial';" +
            "-fx-background-radius: 10; -fx-padding: 10 40;" +
            "-fx-cursor: hand;"
        );
        closeBtn.setOnMouseEntered(e -> closeBtn.setStyle(
            "-fx-background-color: #991b1b; -fx-text-fill: white;" +
            "-fx-font-size: 14px; -fx-font-weight: bold; -fx-font-family: 'Arial';" +
            "-fx-background-radius: 10; -fx-padding: 10 40;" +
            "-fx-cursor: hand;"
        ));
        closeBtn.setOnMouseExited(e -> closeBtn.setStyle(
            "-fx-background-color: #b91c1c; -fx-text-fill: white;" +
            "-fx-font-size: 14px; -fx-font-weight: bold; -fx-font-family: 'Arial';" +
            "-fx-background-radius: 10; -fx-padding: 10 40;" +
            "-fx-cursor: hand;"
        ));
        closeBtn.setOnAction(e -> popup.close());
        footer.getChildren().add(closeBtn);

        root.getChildren().addAll(header, body, footer);

        javafx.scene.Scene scene = new javafx.scene.Scene(root);
        scene.setFill(javafx.scene.paint.Color.TRANSPARENT);
        popup.setScene(scene);
        
        // Center relative to parent window if available
        if (roomTable.getScene() != null && roomTable.getScene().getWindow() != null) {
            javafx.stage.Window owner = roomTable.getScene().getWindow();
            popup.setX(owner.getX() + (owner.getWidth() - 420) / 2);
            popup.setY(owner.getY() + (owner.getHeight() - 400) / 2);
            popup.initOwner(owner);
        }
        
        popup.showAndWait();
    }


    private void openDetails(Room room) {
        viewingRoom = room;

        javafx.stage.Stage dialog = new javafx.stage.Stage();
        dialog.initModality(javafx.stage.Modality.APPLICATION_MODAL);
        dialog.initStyle(javafx.stage.StageStyle.UNDECORATED);
        dialog.setResizable(false);

        boolean isAvail = "available".equals(room.getStatus());
        String accentColor = isAvail ? "#15803d" : "#b91c1c";
        String bgColor     = isAvail ? "#f0fdf4" : "#fef2f2";
        String borderColor = isAvail ? "#bbf7d0" : "#fecaca";

        // ── Card root ──────────────────────────────────────────────────────
        VBox card = new VBox(0);
        card.setNodeOrientation(javafx.geometry.NodeOrientation.RIGHT_TO_LEFT);
        card.setStyle(
            "-fx-background-color: white;" +
            "-fx-background-radius: 16;" +
            "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.35), 40, 0, 0, 8);"
        );
        card.setPrefWidth(540);

        // ── Header ─────────────────────────────────────────────────────────
        HBox header = new HBox(10);
        header.setAlignment(javafx.geometry.Pos.CENTER_LEFT);
        header.setStyle(
            "-fx-padding: 20 24; " +
            "-fx-background-color: #f8fafc; " +
            "-fx-background-radius: 16 16 0 0; " +
            "-fx-border-color: #e0e3e5; -fx-border-width: 0 0 1 0;"
        );
        VBox titleBox = new VBox(3);
        HBox.setHgrow(titleBox, javafx.scene.layout.Priority.ALWAYS);
        Label titleLbl = new Label("قاعة " + room.getRoomNumber());
        titleLbl.setStyle("-fx-font-size: 20px; -fx-font-weight: bold; -fx-text-fill: #001e40;");
        Label subtitleLbl = new Label(room.isMultiPurpose() ? "متعددة الأغراض" : "محاضرات عادية");
        subtitleLbl.setStyle("-fx-font-size: 13px; -fx-font-weight: bold; -fx-text-fill: #6b7280;");
        titleBox.getChildren().addAll(titleLbl, subtitleLbl);
        Button xBtn = new Button("✖");
        xBtn.setStyle("-fx-background-color: white; -fx-border-color: #e0e3e5; -fx-border-radius: 20; -fx-background-radius: 20; -fx-text-fill: #9ca3af; -fx-padding: 6 10; -fx-cursor: hand;");
        xBtn.setOnAction(e -> dialog.close());
        header.getChildren().addAll(titleBox, xBtn);

        // ── Stat tiles ─────────────────────────────────────────────────────
        HBox statsRow = new HBox(12);
        statsRow.setStyle("-fx-padding: 20 24 0 24;");

        VBox buildTile = makeTile("المبنى",   room.getBuilding() != null ? room.getBuilding() : "-", "#eff6ff", "#bfdbfe");
        VBox floorTile = makeTile("الدور",    String.valueOf(room.getFloor()), "#faf5ff", "#e9d5ff");
        VBox capTile   = makeTile("السعة",    room.getCapacity() + " فرد", "#fff7ed", "#fed7aa");
        VBox statTile  = makeTile("الحالة",   isAvail ? "متاحة" : "مغلقة", bgColor, borderColor);
        // colour the status value
        ((Label) statTile.getChildren().get(1)).setStyle(
            "-fx-font-size: 18px; -fx-font-weight: bold; -fx-text-fill: " + accentColor + ";"
        );
        HBox.setHgrow(buildTile, javafx.scene.layout.Priority.ALWAYS);
        HBox.setHgrow(floorTile, javafx.scene.layout.Priority.ALWAYS);
        HBox.setHgrow(capTile,   javafx.scene.layout.Priority.ALWAYS);
        HBox.setHgrow(statTile,  javafx.scene.layout.Priority.ALWAYS);
        statsRow.getChildren().addAll(buildTile, floorTile, capTile, statTile);

        // ── Booking stats ──────────────────────────────────────────────────
        VBox bookingBox = new VBox(10);
        bookingBox.setStyle(
            "-fx-padding: 20 24; " +
            "-fx-border-color: #e0e3e5; -fx-border-radius: 12; -fx-margin: 16;"
        );
        Label bookHeader = new Label("📊  إحصائيات الحجوزات");
        bookHeader.setStyle("-fx-font-size: 15px; -fx-font-weight: bold; -fx-text-fill: #001e40;");

        detActiveBookings   = new Label("جاري التحميل...");
        detHistoryBookings  = new Label("جاري التحميل...");
        detTotalBookings    = new Label("جاري التحميل...");

        HBox activeRow  = makeStatRow("حجوزات نشطة (قادمة أو معلقة)", detActiveBookings,  "#dbeafe", "#1e40af", "#f8fafc");
        HBox histRow    = makeStatRow("حجوزات سابقة (أرشيف)",          detHistoryBookings, "#e5e7eb", "#374151", "#f8fafc");
        HBox totalRow   = makeStatRow("إجمالي الحركات على القاعة",       detTotalBookings,   "#001e40", "white",   "#f1f5f9");

        bookingBox.getChildren().addAll(bookHeader, activeRow, histRow, totalRow);

        VBox body = new VBox(16);
        body.setStyle("-fx-padding: 16 24;");
        body.getChildren().addAll(statsRow, bookingBox);

        // ── Footer ─────────────────────────────────────────────────────────
        VBox footer = new VBox();
        footer.setStyle("-fx-padding: 16 24; -fx-border-color: #e0e3e5; -fx-border-width: 1 0 0 0;");
        Button pdfBtn = new Button("📄  تحميل تقرير القاعة (PDF)");
        pdfBtn.setMaxWidth(Double.MAX_VALUE);
        pdfBtn.setStyle("-fx-background-color: #001e40; -fx-text-fill: white; -fx-font-weight: bold; -fx-padding: 12; -fx-background-radius: 8; -fx-cursor: hand;");
        pdfBtn.setOnAction(e -> downloadPDF());
        footer.getChildren().add(pdfBtn);

        card.getChildren().addAll(header, body, footer);

        // ── Scene ──────────────────────────────────────────────────────────
        StackPane root = new StackPane(card);
        root.setStyle("-fx-background-color: transparent;");
        javafx.scene.Scene scene = new javafx.scene.Scene(root);
        scene.setFill(javafx.scene.paint.Color.TRANSPARENT);
        dialog.setScene(scene);

        if (roomTable.getScene() != null && roomTable.getScene().getWindow() != null) {
            javafx.stage.Window owner = roomTable.getScene().getWindow();
            dialog.setX(owner.getX() + (owner.getWidth() - 540) / 2);
            dialog.setY(owner.getY() + (owner.getHeight() - 480) / 2);
            dialog.initOwner(owner);
        }

        // Load booking stats async
        RoomService.fetchRoomBookings(room.getId(), bookings -> {
            long active = bookings.stream().filter(b ->
                "pending".equals(b.getStatus()) || "approved".equals(b.getStatus()) ||
                "awaiting_manager_final".equals(b.getStatus()) || "approved_by_branch".equals(b.getStatus())
            ).count();
            Platform.runLater(() -> {
                detActiveBookings.setText(String.valueOf(active));
                detHistoryBookings.setText(String.valueOf(bookings.size() - active));
                detTotalBookings.setText(String.valueOf(bookings.size()));
            });
        }, e -> System.err.println("Failed to fetch room bookings: " + e.getMessage()));

        dialog.showAndWait();
        viewingRoom = null;
    }

    private VBox makeTile(String label, String value, String bg, String border) {
        VBox tile = new VBox(4);
        tile.setAlignment(javafx.geometry.Pos.CENTER);
        tile.setStyle(
            "-fx-background-color: " + bg + "; " +
            "-fx-border-color: " + border + "; " +
            "-fx-border-radius: 12; -fx-background-radius: 12; -fx-padding: 14;"
        );
        Label lbl = new Label(label);
        lbl.setStyle("-fx-font-size: 12px; -fx-font-weight: bold; -fx-text-fill: #6b7280;");
        Label val = new Label(value);
        val.setStyle("-fx-font-size: 18px; -fx-font-weight: bold; -fx-text-fill: #001e40;");
        tile.getChildren().addAll(lbl, val);
        return tile;
    }

    private HBox makeStatRow(String labelText, Label valueLabel, String badgeBg, String badgeFg, String rowBg) {
        HBox row = new HBox();
        row.setAlignment(javafx.geometry.Pos.CENTER_LEFT);
        row.setStyle("-fx-background-color: " + rowBg + "; -fx-padding: 10; -fx-background-radius: 8;");
        Label lbl = new Label(labelText);
        lbl.setStyle("-fx-font-size: 13px; -fx-font-weight: bold; -fx-text-fill: #4b5563;");
        HBox.setHgrow(lbl, javafx.scene.layout.Priority.ALWAYS);
        lbl.setMaxWidth(Double.MAX_VALUE);
        valueLabel.setStyle(
            "-fx-background-color: " + badgeBg + "; -fx-text-fill: " + badgeFg + "; " +
            "-fx-padding: 4 12; -fx-background-radius: 12; -fx-font-weight: bold;"
        );
        row.getChildren().addAll(lbl, valueLabel);
        return row;
    }

    @FXML private void closeDetails() {
        detailsModalOverlay.setVisible(false);
        viewingRoom = null;
    }

    @FXML private void downloadPDF() {
        if (viewingRoom == null) return;

        RoomService.fetchRoomBookings(viewingRoom.getId(), bookings -> {
            Platform.runLater(() -> buildAndShowReport(bookings));
        }, e -> Platform.runLater(() -> showAlert("خطأ", "فشل جلب الحجوزات: " + e.getMessage())));
    }

    private void buildAndShowReport(List<Booking> bookings) {
        Room room = viewingRoom;
        if (room == null) return;

        // ── Stage (preview window) ─────────────────────────────────────────
        javafx.stage.Stage printStage = new javafx.stage.Stage();
        printStage.setTitle("معاينة التقرير - قاعة " + room.getRoomNumber());
        printStage.initModality(javafx.stage.Modality.APPLICATION_MODAL);

        // ── Helpers ────────────────────────────────────────────────────────
        final String F = "-fx-font-family: 'Arial'; ";

        // ── Page root (Fixed width 570px to match standard paper aspect ratio) 
        VBox page = new VBox(0);
        page.setPrefWidth(570);
        page.setMinWidth(570);
        page.setMaxWidth(570);
        page.setStyle("-fx-background-color: white; -fx-padding: 0;");
        page.setNodeOrientation(javafx.geometry.NodeOrientation.LEFT_TO_RIGHT); // Explicit LTR parent to bypass snapshot-mirroring bug

        // ═══ HEADER ════════════════════════════════════════════════════════
        VBox banner = new VBox(6);
        banner.setAlignment(javafx.geometry.Pos.CENTER);
        banner.setStyle("-fx-background-color: #001e40; -fx-padding: 24 40;");
        Label titleLbl = new Label("تقرير تفصيلي — قاعة " + room.getRoomNumber());
        titleLbl.setStyle(F + "-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: white;");
        titleLbl.setNodeOrientation(javafx.geometry.NodeOrientation.RIGHT_TO_LEFT);
        Label dateLbl = new Label("تاريخ الإصدار:  " +
            new java.text.SimpleDateFormat("yyyy-MM-dd   HH:mm:ss").format(new java.util.Date()));
        dateLbl.setStyle(F + "-fx-font-size: 12px; -fx-text-fill: #93c5fd;");
        dateLbl.setNodeOrientation(javafx.geometry.NodeOrientation.RIGHT_TO_LEFT);
        banner.getChildren().addAll(titleLbl, dateLbl);

        // ═══ INFO ROW ══════════════════════════════════════════════════════
        boolean avail = "available".equals(room.getStatus());
        HBox infoRow = new HBox(10);
        infoRow.setStyle("-fx-padding: 18 20 10 20; -fx-background-color: #f8fafc;");
        infoRow.setNodeOrientation(javafx.geometry.NodeOrientation.LEFT_TO_RIGHT);

        // Loop in reverse order so "نوع القاعة" is added last (appearing on the far right in standard LTR)
        for (String[] pair : new String[][]{
            {"الحالة",       avail ? "متاحة" : "مغلقة"},
            {"السعة",        room.getCapacity() + " فرد"},
            {"الدور",        String.valueOf(room.getFloor())},
            {"المبنى",       room.getBuilding() != null ? room.getBuilding() : "-"},
            {"نوع القاعة",  room.isMultiPurpose() ? "متعددة" : "عادية"}
        }) {
            VBox tile = new VBox(3);
            tile.setAlignment(javafx.geometry.Pos.CENTER);
            tile.setStyle("-fx-background-color: #eff6ff; -fx-background-radius: 8; -fx-padding: 8 6; -fx-border-color: #bfdbfe; -fx-border-radius: 8;");
            Label k = new Label(pair[0]);
            k.setStyle(F + "-fx-font-size: 11px; -fx-font-weight: bold; -fx-text-fill: #6b7280;");
            k.setNodeOrientation(javafx.geometry.NodeOrientation.RIGHT_TO_LEFT);
            Label v = new Label(pair[1]);
            v.setStyle(F + "-fx-font-size: 13px; -fx-font-weight: bold; -fx-text-fill: #1e3a5f;");
            v.setNodeOrientation(javafx.geometry.NodeOrientation.RIGHT_TO_LEFT);
            tile.getChildren().addAll(k, v);
            HBox.setHgrow(tile, javafx.scene.layout.Priority.ALWAYS);
            tile.setMaxWidth(Double.MAX_VALUE);
            infoRow.getChildren().add(tile);
        }

        // ═══ STATS ═════════════════════════════════════════════════════════
        long activeCount = bookings.stream().filter(b ->
            "pending".equals(b.getStatus()) || "approved".equals(b.getStatus()) ||
            "awaiting_manager_final".equals(b.getStatus()) || "approved_by_branch".equals(b.getStatus())
        ).count();
        long histCount = bookings.size() - activeCount;

        HBox statsRow = new HBox(0);
        statsRow.setStyle("-fx-padding: 0 0 10 0;");
        statsRow.setNodeOrientation(javafx.geometry.NodeOrientation.LEFT_TO_RIGHT);

        // Loop in reverse order to place "إجمالي الحركات" on the far right in LTR
        for (String[] s : new String[][]{
            {"حجوزات سابقة",  String.valueOf(histCount),         "#374151", "#e5e7eb"},
            {"حجوزات نشطة",   String.valueOf(activeCount),      "#1e40af", "#dbeafe"},
            {"إجمالي الحركات", String.valueOf(bookings.size()), "#001e40", "white"}
        }) {
            VBox b = new VBox(2);
            b.setAlignment(javafx.geometry.Pos.CENTER);
            b.setStyle("-fx-background-color: " + s[2] + "; -fx-padding: 12;");
            Label lk = new Label(s[0]); 
            lk.setStyle(F + "-fx-font-size: 11px; -fx-text-fill: " + s[3] + "99; -fx-font-weight: bold;");
            lk.setNodeOrientation(javafx.geometry.NodeOrientation.RIGHT_TO_LEFT);
            Label lv = new Label(s[1]); 
            lv.setStyle(F + "-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: " + s[3] + ";");
            lv.setNodeOrientation(javafx.geometry.NodeOrientation.RIGHT_TO_LEFT);
            b.getChildren().addAll(lk, lv);
            HBox.setHgrow(b, javafx.scene.layout.Priority.ALWAYS);
            b.setMaxWidth(Double.MAX_VALUE);
            statsRow.getChildren().add(b);
        }

        // ═══ TABLE ═════════════════════════════════════════════════════════
        VBox tableBox = new VBox(0);
        tableBox.setStyle("-fx-padding: 20;");
        tableBox.setNodeOrientation(javafx.geometry.NodeOrientation.LEFT_TO_RIGHT);

        Label tTitle = new Label("سجل الحجوزات");
        tTitle.setStyle(F + "-fx-font-size: 16px; -fx-font-weight: bold; -fx-text-fill: #001e40; -fx-padding: 0 0 10 0;");
        tTitle.setMaxWidth(Double.MAX_VALUE);
        tTitle.setAlignment(javafx.geometry.Pos.CENTER_RIGHT); // Align right in LTR context
        tTitle.setNodeOrientation(javafx.geometry.NodeOrientation.RIGHT_TO_LEFT);
        tableBox.getChildren().add(tTitle);

        // Define headers and widths reversed (so History columns read Right to Left naturally)
        String[] heads  = {"الحالة", "الغرض / المادة", "المسؤول", "الوقت", "التاريخ"};
        double[] widths = {90, 140, 110, 105, 85};
        tableBox.getChildren().add(makeReportRow(heads, widths, "#001e40", "white", true, F));

        if (bookings.isEmpty()) {
            Label empty = new Label("لا توجد حجوزات مسجلة لهذه القاعة.");
            empty.setStyle(F + "-fx-font-size: 13px; -fx-text-fill: #6b7280; -fx-padding: 20;");
            empty.setMaxWidth(Double.MAX_VALUE);
            empty.setAlignment(javafx.geometry.Pos.CENTER);
            empty.setNodeOrientation(javafx.geometry.NodeOrientation.RIGHT_TO_LEFT);
            tableBox.getChildren().add(empty);
        } else {
            for (int i = 0; i < bookings.size(); i++) {
                Booking bk = bookings.get(i);
                String[] vals = {
                    translateStatus(bk.getStatus()),
                    bk.getPurpose() != null ? bk.getPurpose() : "—",
                    bk.getResponsibleName() != null ? bk.getResponsibleName() : "—",
                    (bk.getTimeFrom() != null ? bk.getTimeFrom() : "") + " - " + (bk.getTimeTo() != null ? bk.getTimeTo() : ""),
                    bk.getDate() != null ? bk.getDate() : "—"
                };
                String bg = i % 2 == 0 ? "#f8fafc" : "white";
                tableBox.getChildren().add(makeReportRow(vals, widths, bg, "#374151", false, F));
            }
        }

        page.getChildren().addAll(banner, infoRow, statsRow, tableBox);

        // ── ScrollPane / Container setup to look like real paper sheet ─────
        javafx.scene.layout.StackPane paperContainer = new javafx.scene.layout.StackPane(page);
        paperContainer.setStyle("-fx-background-color: #f1f5f9; -fx-padding: 24;");
        paperContainer.setNodeOrientation(javafx.geometry.NodeOrientation.LEFT_TO_RIGHT);
        
        // Add shadow effect to the white page for a neat print preview aesthetic
        page.setStyle("-fx-background-color: white; -fx-effect: dropshadow(three-pass-box, rgba(0,0,0,0.15), 10, 0, 0, 4);");

        javafx.scene.control.ScrollPane scroll = new javafx.scene.control.ScrollPane(paperContainer);
        scroll.setFitToWidth(true);
        scroll.setStyle("-fx-background-color: #f1f5f9;");
        scroll.setNodeOrientation(javafx.geometry.NodeOrientation.LEFT_TO_RIGHT);

        // ── Footer print button ────────────────────────────────────────────
        HBox footerBar = new HBox(12);
        footerBar.setAlignment(javafx.geometry.Pos.CENTER_RIGHT); // Align to the right in LTR
        footerBar.setStyle("-fx-padding: 14 30; -fx-background-color: white; -fx-border-color: #e2e8f0; -fx-border-width: 1 0 0 0;");
        footerBar.setNodeOrientation(javafx.geometry.NodeOrientation.LEFT_TO_RIGHT);
        Button printBtn = new Button("🖨  طباعة التقرير");
        printBtn.setStyle("-fx-background-color: #001e40; -fx-text-fill: white; -fx-font-weight: bold; -fx-padding: 10 28; -fx-background-radius: 8; -fx-cursor: hand;");
        Button closeBtn = new Button("إغلاق");
        closeBtn.setStyle("-fx-background-color: #f2f4f6; -fx-text-fill: #43474f; -fx-font-weight: bold; -fx-padding: 10 20; -fx-background-radius: 8; -fx-cursor: hand;");
        closeBtn.setOnAction(e -> printStage.close());
        
        printBtn.setOnAction(e -> {
            javafx.print.PrinterJob job = javafx.print.PrinterJob.createPrinterJob();
            if (job == null) { showAlert("خطأ", "لا توجد طابعة متاحة."); return; }
            if (job.showPrintDialog(printStage)) {
                // Get printable width/height
                javafx.print.PageLayout layout = job.getJobSettings().getPageLayout();
                double printableWidth = layout.getPrintableWidth();
                double printableHeight = layout.getPrintableHeight();

                // Capture high-res snapshot of the visual report page node
                double scaleVal = 3.0; // High resolution scaling to keep text sharp
                javafx.scene.SnapshotParameters params = new javafx.scene.SnapshotParameters();
                params.setTransform(javafx.scene.transform.Transform.scale(scaleVal, scaleVal));
                params.setFill(javafx.scene.paint.Color.WHITE);
                
                javafx.scene.image.WritableImage snapshot = page.snapshot(params, null);
                
                // Create an ImageView to render this crisp snapshot image
                javafx.scene.image.ImageView printView = new javafx.scene.image.ImageView(snapshot);
                printView.setFitWidth(printableWidth);
                printView.setPreserveRatio(true);
                
                // Wrap in Group to guarantee alignment inside the print page
                javafx.scene.Group printGroup = new javafx.scene.Group(printView);
                
                boolean ok = job.printPage(printGroup);
                if (ok) job.endJob();
            }
        });
        footerBar.getChildren().addAll(printBtn, closeBtn);

        VBox root = new VBox(0, scroll, footerBar);
        root.setNodeOrientation(javafx.geometry.NodeOrientation.LEFT_TO_RIGHT);

        javafx.scene.Scene scene = new javafx.scene.Scene(root, 650, 750);
        scene.setFill(javafx.scene.paint.Color.WHITE);
        scene.setNodeOrientation(javafx.geometry.NodeOrientation.LEFT_TO_RIGHT); // Strictly LTR scene orientation to defeat high-DPI mirroring bug
        printStage.setScene(scene);
        if (roomTable.getScene() != null && roomTable.getScene().getWindow() != null) {
            javafx.stage.Window owner = roomTable.getScene().getWindow();
            printStage.setX(owner.getX() + (owner.getWidth() - 650) / 2);
            printStage.setY(owner.getY() + 30);
            printStage.initOwner(owner);
        }
        printStage.show();
    }

    private HBox makeReportRow(String[] values, double[] widths, String bg, String fg, boolean bold, String F) {
        HBox row = new HBox(0);
        row.setStyle("-fx-background-color: " + bg + ";");
        row.setNodeOrientation(javafx.geometry.NodeOrientation.LEFT_TO_RIGHT);
        for (int i = 0; i < values.length; i++) {
            Label cell = new Label(values[i]);
            cell.setPrefWidth(widths[i]);
            cell.setMinWidth(widths[i]);
            cell.setMaxWidth(widths[i]);
            cell.setWrapText(true);
            cell.setAlignment(javafx.geometry.Pos.CENTER);
            cell.setNodeOrientation(javafx.geometry.NodeOrientation.RIGHT_TO_LEFT); // Arabic rendering handles perfectly on LTR grid
            cell.setStyle(
                F + "-fx-font-size: 11px; " +
                "-fx-text-fill: " + fg + "; " +
                "-fx-font-weight: " + (bold ? "bold" : "normal") + "; " +
                "-fx-padding: 8 4; " +
                "-fx-border-color: #e2e8f0; -fx-border-width: 0 0 1 0;"
            );
            row.getChildren().add(cell);
        }
        return row;
    }

    private String translateStatus(String status) {
        if (status == null) return "—";
        switch (status) {
            case "approved": return "معتمد";
            case "pending": return "قيد الانتظار";
            case "awaiting_manager_final": return "انتظار المدير";
            case "rejected": return "مرفوض";
            case "approved_by_branch": return "معتمد فرعياً";
            default: return status;
        }
    }

    private void showAlert(String title, String content) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        alert.show();
    }
}
