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
        formModalOverlay.setVisible(true);
        if (room == null) {
            formTitle.setText("إضافة قاعة جديدة");
            submitFormBtn.setText("➕  إضافة القاعة");
            formName.clear();
            formCapacity.clear();
            formType.setValue(null);
            formBuilding.setValue(null);
            formFloor.setValue(null);
            formStatusContainer.setVisible(false);
            formStatusContainer.setManaged(false);
        } else {
            formTitle.setText("تعديل قاعة " + room.getRoomNumber());
            submitFormBtn.setText("💾  حفظ التعديلات");
            formName.setText(room.getRoomNumber());
            formCapacity.setText(String.valueOf(room.getCapacity()));
            formType.setValue(room.isMultiPurpose() ? "متعددة الأغراض" : "محاضرات عادية");
            formBuilding.setValue(room.getBuilding());
            formFloor.setValue(String.valueOf(room.getFloor()));
            formStatus.setValue("available".equals(room.getStatus()) ? "متاحة للعمل" : "مغلقة للصيانة");
            formStatusContainer.setVisible(true);
            formStatusContainer.setManaged(true);
        }
    }

    @FXML private void closeForm() {
        formModalOverlay.setVisible(false);
        editingRoom = null;
    }

    @FXML private void submitForm() {
        String name = formName.getText();
        String capStr = formCapacity.getText();
        String type = formType.getValue();
        String building = formBuilding.getValue();
        String floorStr = formFloor.getValue();

        if (name == null || name.isEmpty() || capStr == null || capStr.isEmpty() ||
            type == null || building == null || floorStr == null) {
            showAlert("تنبيه", "يرجى تعبئة جميع الحقول المطلوبة.");
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
            RoomService.addRoom(r, v -> {
                Platform.runLater(() -> {
                    submitFormBtn.setDisable(false);
                    closeForm();
                    loadRooms();
                });
            }, e -> {
                Platform.runLater(() -> {
                    submitFormBtn.setDisable(false);
                    showAlert("خطأ", e.getMessage());
                });
            });
        } else {
            RoomService.updateRoom(r, v -> {
                Platform.runLater(() -> {
                    submitFormBtn.setDisable(false);
                    closeForm();
                    loadRooms();
                });
            }, e -> {
                Platform.runLater(() -> {
                    submitFormBtn.setDisable(false);
                    showAlert("خطأ", e.getMessage());
                });
            });
        }
    }

    private void deleteRoom(Room room) {
        RoomService.fetchRoomBookings(room.getId(), bookings -> {
            List<Booking> active = bookings.stream().filter(b -> 
                "pending".equals(b.getStatus()) || "approved".equals(b.getStatus()) || 
                "awaiting_manager_final".equals(b.getStatus()) || "approved_by_branch".equals(b.getStatus())
            ).toList();

            Platform.runLater(() -> {
                if (!active.isEmpty()) {
                    com.aast.booking.services.RoomReplacementService.getEligibleReplacementRooms(room, active, allRooms, validRooms -> {
                        if (validRooms.isEmpty()) {
                            showAlert("لا يمكن الحذف", "القاعة بها " + active.size() + " حجوزات نشطة، ولا توجد قاعة بديلة متاحة حالياً تلبي السعة المطلوبة ولا تتعارض في المواعيد.");
                            return;
                        }

                        ChoiceDialog<Room> dialog = new ChoiceDialog<>(validRooms.get(0), validRooms);
                        dialog.setTitle("ترحيل الحجوزات");
                        dialog.setHeaderText("القاعة " + room.getRoomNumber() + " بها " + active.size() + " حجوزات نشطة.");
                        dialog.setContentText("اختر قاعة بديلة (متاحة وتلبي نفس السعة وبدون تعارض):");
                        
                        // Custom formatting for choice items
                        dialog.setResultConverter(dialogButton -> {
                            if (dialogButton == ButtonType.OK) return dialog.getSelectedItem();
                            return null;
                        });

                        Optional<Room> res = dialog.showAndWait();
                        if (res.isPresent()) {
                            Room altRoom = res.get();
                            RoomService.deleteRoom(room.getId(), altRoom.getId(), v -> loadRooms(), err -> showAlert("خطأ", err.getMessage()));
                        }
                    }, err -> showAlert("خطأ", "فشل جلب القاعات البديلة: " + err.getMessage()));
                } else {
                    Alert alert = new Alert(Alert.AlertType.CONFIRMATION, "هل أنت متأكد من حذف القاعة " + room.getRoomNumber() + "؟");
                    alert.showAndWait().ifPresent(res -> {
                        if (res == ButtonType.OK) {
                            RoomService.deleteRoom(room.getId(), null, v -> loadRooms(), e -> showAlert("خطأ", e.getMessage()));
                        }
                    });
                }
            });
        }, e -> showAlert("خطأ", "فشل التحقق من حجوزات القاعة: " + e.getMessage()));
    }

    private void openDetails(Room room) {
        viewingRoom = room;
        detTitle.setText("قاعة " + room.getRoomNumber());
        detSubtitle.setText(room.isMultiPurpose() ? "متعددة الأغراض" : "محاضرات عادية");
        detBuilding.setText(room.getBuilding() != null ? room.getBuilding() : "-");
        detFloor.setText(String.valueOf(room.getFloor()));
        detCapacity.setText(room.getCapacity() + " فرد");
        
        boolean isAvail = "available".equals(room.getStatus());
        detStatus.setText(isAvail ? "متاحة" : "مغلقة");
        detStatus.setStyle(isAvail ? "-fx-font-size: 20px; -fx-font-weight: bold; -fx-text-fill: #15803d;" 
                                   : "-fx-font-size: 20px; -fx-font-weight: bold; -fx-text-fill: #b91c1c;");
        detStatusContainer.setStyle(isAvail ? "-fx-background-color: #f0fdf4; -fx-border-color: #bbf7d0; -fx-border-radius: 12; -fx-background-radius: 12; -fx-padding: 15;"
                                            : "-fx-background-color: #fef2f2; -fx-border-color: #fecaca; -fx-border-radius: 12; -fx-background-radius: 12; -fx-padding: 15;");

        detActiveBookings.setText("...");
        detHistoryBookings.setText("...");
        detTotalBookings.setText("...");
        
        detailsModalOverlay.setVisible(true);

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
    }

    @FXML private void closeDetails() {
        detailsModalOverlay.setVisible(false);
        viewingRoom = null;
    }

    @FXML private void downloadPDF() {
        if (viewingRoom == null) return;
        
        RoomService.fetchRoomBookings(viewingRoom.getId(), bookings -> {
            Platform.runLater(() -> {
                VBox reportBox = new VBox(20);
                reportBox.setPadding(new javafx.geometry.Insets(40));
                reportBox.setStyle("-fx-background-color: white;");
                reportBox.setAlignment(javafx.geometry.Pos.TOP_CENTER);
                
                Label header = new Label("تقرير تفصيلي - قاعة " + viewingRoom.getRoomNumber());
                header.setStyle("-fx-font-size: 24px; -fx-font-weight: bold; -fx-text-fill: #001e40;");
                
                Label dateLabel = new Label("تاريخ استخراج التقرير: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()));
                dateLabel.setStyle("-fx-font-size: 14px;");
                
                // Info Grid
                HBox infoBox = new HBox(15);
                infoBox.setAlignment(javafx.geometry.Pos.CENTER);
                infoBox.getChildren().addAll(
                    createInfoItem("نوع القاعة", viewingRoom.isMultiPurpose() ? "متعددة الأغراض" : "محاضرات عادية"),
                    createInfoItem("المبنى", viewingRoom.getBuilding() != null ? viewingRoom.getBuilding() : "-"),
                    createInfoItem("الدور", String.valueOf(viewingRoom.getFloor())),
                    createInfoItem("السعة", viewingRoom.getCapacity() + " فرد"),
                    createInfoItem("الحالة", "available".equals(viewingRoom.getStatus()) ? "متاحة" : "مغلقة للصيانة")
                );
                
                // Stats
                HBox statsBox = new HBox(30);
                statsBox.setAlignment(javafx.geometry.Pos.CENTER);
                statsBox.setStyle("-fx-background-color: #eef2f6; -fx-padding: 15; -fx-background-radius: 8;");
                statsBox.getChildren().addAll(
                    new Label("إجمالي الحركات: " + detTotalBookings.getText()),
                    new Label("نشطة: " + detActiveBookings.getText()),
                    new Label("سابقة: " + detHistoryBookings.getText())
                );
                statsBox.getChildren().forEach(n -> n.setStyle("-fx-font-weight: bold; -fx-font-size: 14px;"));
                
                Label historyHeader = new Label("سجل الحجوزات");
                historyHeader.setStyle("-fx-font-size: 18px; -fx-font-weight: bold;");
                
                // Table
                VBox table = new VBox(5);
                HBox tableHeader = new HBox(10);
                tableHeader.setStyle("-fx-background-color: #001e40; -fx-padding: 10;");
                String[] cols = {"التاريخ", "الوقت", "المسؤول", "الغرض / المادة", "الحالة"};
                for (String c : cols) {
                    Label l = new Label(c);
                    l.setStyle("-fx-text-fill: white; -fx-font-weight: bold; -fx-alignment: center;");
                    l.setPrefWidth(100);
                    tableHeader.getChildren().add(l);
                }
                table.getChildren().add(tableHeader);
                
                if (bookings.isEmpty()) {
                    Label empty = new Label("لا توجد حجوزات مسجلة لهذه القاعة.");
                    empty.setStyle("-fx-padding: 20; -fx-text-fill: #5a7698;");
                    table.getChildren().add(empty);
                } else {
                    for (int i=0; i<bookings.size(); i++) {
                        Booking b = bookings.get(i);
                        HBox row = new HBox(10);
                        row.setStyle(i % 2 == 0 ? "-fx-background-color: #f8fafc; -fx-padding: 10;" : "-fx-padding: 10;");
                        
                        Label c1 = new Label(b.getDate() != null ? b.getDate() : "—"); c1.setPrefWidth(100); c1.setStyle("-fx-alignment: center;");
                        Label c2 = new Label(b.getTimeFrom() + " - " + b.getTimeTo()); c2.setPrefWidth(100); c2.setStyle("-fx-alignment: center;");
                        Label c3 = new Label(b.getResponsibleName() != null ? b.getResponsibleName() : "—"); c3.setPrefWidth(100); c3.setStyle("-fx-alignment: center;");
                        Label c4 = new Label(b.getPurpose() != null ? b.getPurpose() : "—"); c4.setPrefWidth(100); c4.setStyle("-fx-alignment: center;");
                        Label c5 = new Label(translateStatus(b.getStatus())); c5.setPrefWidth(100); c5.setStyle("-fx-alignment: center;");
                        
                        row.getChildren().addAll(c1, c2, c3, c4, c5);
                        table.getChildren().add(row);
                    }
                }
                
                reportBox.getChildren().addAll(header, dateLabel, infoBox, statsBox, historyHeader, table);
                
                // Print
                javafx.print.PrinterJob job = javafx.print.PrinterJob.createPrinterJob();
                if (job != null && job.showPrintDialog(roomTable.getScene().getWindow())) {
                    boolean success = job.printPage(reportBox);
                    if (success) {
                        job.endJob();
                    }
                }
            });
        }, e -> Platform.runLater(() -> showAlert("خطأ", "فشل جلب الحجوزات للتقرير")));
    }

    private VBox createInfoItem(String title, String value) {
        VBox box = new VBox(5);
        box.setAlignment(javafx.geometry.Pos.CENTER);
        box.setStyle("-fx-background-color: #f8fafc; -fx-padding: 15; -fx-background-radius: 8; -fx-border-color: #e2e8f0; -fx-border-radius: 8;");
        Label tLabel = new Label(title);
        tLabel.setStyle("-fx-text-fill: #5a7698; -fx-font-size: 12px; -fx-font-weight: bold;");
        Label vLabel = new Label(value);
        vLabel.setStyle("-fx-font-size: 16px; -fx-font-weight: bold; -fx-text-fill: #001e40;");
        box.getChildren().addAll(tLabel, vLabel);
        return box;
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
