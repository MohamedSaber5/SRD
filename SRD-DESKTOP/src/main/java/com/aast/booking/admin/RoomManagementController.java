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
        
        String htmlContent = "<html dir='rtl' lang='ar'><head><meta charset='UTF-8'><style>" +
            "body { font-family: Tahoma, Arial, sans-serif; padding: 40px; color: #001e40; direction: rtl; text-align: right; }" +
            ".header { text-align: center; border-bottom: 2px solid #001e40; padding-bottom: 20px; margin-bottom: 30px; }" +
            ".header h1 { margin: 0 0 10px 0; font-size: 28px; }" +
            ".info-grid { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 40px; }" +
            ".info-item { background: #f8fafc; padding: 15px; border-radius: 8px; flex: 1; min-width: 150px; border: 1px solid #e2e8f0; text-align: center; }" +
            ".info-item b { display: block; color: #5a7698; font-size: 12px; margin-bottom: 5px; }" +
            ".info-item span { font-size: 18px; font-weight: bold; color: #001e40; }" +
            ".stats { display: flex; justify-content: space-between; background: #eef2f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; }" +
            "table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }" +
            "th, td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; }" +
            "th { background-color: #001e40; color: white; font-weight: bold; }" +
            "tr:nth-child(even) { background-color: #f8fafc; }" +
            "</style></head><body>" +
            "<div class='header'><h1>تقرير تفصيلي - قاعة " + viewingRoom.getRoomNumber() + "</h1>" +
            "<p>تاريخ استخراج التقرير: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()) + "</p></div>" +
            "<div class='info-grid'>" +
            "<div class='info-item'><b>نوع القاعة</b><span>" + (viewingRoom.isMultiPurpose() ? "متعددة الأغراض" : "محاضرات عادية") + "</span></div>" +
            "<div class='info-item'><b>المبنى</b><span>" + viewingRoom.getBuilding() + "</span></div>" +
            "<div class='info-item'><b>الدور</b><span>" + viewingRoom.getFloor() + "</span></div>" +
            "<div class='info-item'><b>السعة</b><span>" + viewingRoom.getCapacity() + " فرد</span></div>" +
            "<div class='info-item'><b>الحالة</b><span>" + ("available".equals(viewingRoom.getStatus()) ? "متاحة" : "مغلقة للصيانة") + "</span></div>" +
            "</div>" +
            "<div class='stats'>" +
            "<span>إجمالي الحركات: " + detTotalBookings.getText() + "</span>" +
            "<span>نشطة: " + detActiveBookings.getText() + "</span>" +
            "<span>سابقة: " + detHistoryBookings.getText() + "</span>" +
            "</div>" +
            "<h2>سجل الحجوزات</h2>" +
            "<table><thead><tr><th>التاريخ</th><th>الوقت</th><th>المسؤول</th><th>الغرض / المادة</th><th>الحالة</th></tr></thead><tbody>";

        // Fetch bookings to append to HTML
        RoomService.fetchRoomBookings(viewingRoom.getId(), bookings -> {
            StringBuilder rows = new StringBuilder();
            if (bookings.isEmpty()) {
                rows.append("<tr><td colspan='5' style='text-align: center; color: #5a7698;'>لا توجد حجوزات مسجلة لهذه القاعة.</td></tr>");
            } else {
                for (Booking b : bookings) {
                    rows.append("<tr>")
                        .append("<td>").append(b.getDate() != null ? b.getDate() : "—").append("</td>")
                        .append("<td dir='ltr' style='text-align: left;'>").append(b.getTimeFrom()).append(" - ").append(b.getTimeTo()).append("</td>")
                        .append("<td>").append(b.getResponsibleName() != null ? b.getResponsibleName() : "—").append("</td>")
                        .append("<td>").append(b.getPurpose() != null ? b.getPurpose() : "—").append("</td>")
                        .append("<td>").append(translateStatus(b.getStatus())).append("</td>")
                        .append("</tr>");
                }
            }
            
            String fullHtml = htmlContent + rows.toString() + "</tbody></table></body></html>";
            
            Platform.runLater(() -> {
                javafx.scene.web.WebView webView = new javafx.scene.web.WebView();
                webView.getEngine().loadContent(fullHtml);
                webView.getEngine().getLoadWorker().stateProperty().addListener((obs, oldState, newState) -> {
                    if (newState == javafx.concurrent.Worker.State.SUCCEEDED) {
                        javafx.print.PrinterJob job = javafx.print.PrinterJob.createPrinterJob();
                        if (job != null && job.showPrintDialog(roomTable.getScene().getWindow())) {
                            webView.getEngine().print(job);
                            job.endJob();
                        }
                    }
                });
            });
        }, e -> Platform.runLater(() -> showAlert("خطأ", "فشل جلب الحجوزات للتقرير")));
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
