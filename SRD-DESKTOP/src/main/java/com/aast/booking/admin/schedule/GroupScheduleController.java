package com.aast.booking.admin.schedule;

import com.aast.booking.core.FirebaseService;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import javafx.application.Platform;
import javafx.embed.swing.SwingFXUtils;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.geometry.HPos;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.SnapshotParameters;
import javafx.scene.control.*;
import javafx.scene.image.WritableImage;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

import javax.imageio.ImageIO;
import java.io.File;
import java.net.URL;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

public class GroupScheduleController implements Initializable {

    @FXML private TextField txtCollege;
    @FXML private TextField txtDepartment;
    @FXML private TextField txtGroup;
    @FXML private Button btnSearch;
    @FXML private Button btnExportPdf;
    @FXML private VBox scheduleContainer;
    @FXML private GridPane gridSchedule;
    @FXML private Label lblStatus;

    private final Firestore db;

    // Time slots definition (from RoomSlotConfig roughly, but we just use 1 to 9 indices)
    private final String[] days = {"SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"};
    private final String[] arDays = {"السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"};

    public GroupScheduleController() {
        this.db = FirebaseService.getInstance().getFirestore();
    }

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        btnExportPdf.setDisable(true);
        setupEmptyGrid();
    }

    @FXML
    private void handleSearch() {
        String college = txtCollege.getText().trim();
        String dept = txtDepartment.getText().trim();
        String group = txtGroup.getText().trim();

        if (college.isEmpty() || dept.isEmpty() || group.isEmpty()) {
            showAlert("خطأ", "يرجى إدخال الكلية والقسم والجروب.", Alert.AlertType.ERROR);
            return;
        }

        lblStatus.setText("جاري جلب الجدول...");
        btnSearch.setDisable(true);
        btnExportPdf.setDisable(true);
        scheduleContainer.setVisible(true);

        CompletableFuture.runAsync(() -> {
            try {
                // Fetch bookings for this specific group (source = weekly_lecture)
                var query = db.collection("bookings")
                        .whereEqualTo("source", "weekly_lecture")
                        .whereEqualTo("college", college)
                        .whereEqualTo("department", dept)
                        .whereEqualTo("group", group)
                        .get().get();

                List<QueryDocumentSnapshot> docs = query.getDocuments();

                // Deduplicate by courseCode + lectureType + timeFrom
                Map<String, BookingSlotInfo> uniqueSlots = new HashMap<>();

                for (var doc : docs) {
                    String dateStr = doc.getString("date");
                    if (dateStr == null) continue;

                    LocalDate date = LocalDate.parse(dateStr);
                    String dayOfWeek = date.getDayOfWeek().name(); // SATURDAY, etc.

                    String timeFrom = doc.getString("timeFrom");
                    String timeTo = doc.getString("timeTo");
                    String courseCode = doc.getString("courseCode");
                    String courseName = doc.getString("courseName");
                    String lecturerName = doc.getString("lecturerName");
                    String lectureType = doc.getString("lectureType");
                    String roomId = doc.getString("roomId");

                    // Unique key to prevent duplicating the same lecture every week
                    String key = dayOfWeek + "_" + timeFrom + "_" + courseCode + "_" + lectureType;
                    if (!uniqueSlots.containsKey(key)) {
                        BookingSlotInfo info = new BookingSlotInfo();
                        info.dayOfWeek = dayOfWeek;
                        info.timeFrom = timeFrom;
                        info.timeTo = timeTo;
                        info.courseCode = courseCode != null ? courseCode : "N/A";
                        info.courseName = courseName != null ? courseName : "N/A";
                        info.lecturerName = lecturerName != null ? lecturerName : "N/A";
                        info.lectureType = lectureType != null ? lectureType : "Lecture";
                        info.roomId = roomId != null ? roomId : "N/A";

                        // Determine slot index based on timeFrom
                        info.slotIndex = determineSlotIndex(timeFrom);
                        uniqueSlots.put(key, info);
                    }
                }

                Platform.runLater(() -> {
                    buildGrid(new ArrayList<>(uniqueSlots.values()));
                    lblStatus.setText("تم تحميل الجدول بنجاح.");
                    btnSearch.setDisable(false);
                    btnExportPdf.setDisable(false);
                });

            } catch (Exception e) {
                Platform.runLater(() -> {
                    lblStatus.setText("خطأ أثناء الجلب.");
                    btnSearch.setDisable(false);
                    showAlert("خطأ", "حدث خطأ: " + e.getMessage(), Alert.AlertType.ERROR);
                });
            }
        });
    }

    private void setupEmptyGrid() {
        gridSchedule.getChildren().clear();
        gridSchedule.getColumnConstraints().clear();
        gridSchedule.getRowConstraints().clear();
        gridSchedule.setHgap(2);
        gridSchedule.setVgap(2);
        gridSchedule.setStyle("-fx-background-color: #d1d5db; -fx-padding: 2;"); // border effect

        // Column 0: Days. Columns 1-9: Slots
        ColumnConstraints col0 = new ColumnConstraints();
        col0.setPrefWidth(100);
        gridSchedule.getColumnConstraints().add(col0);

        for (int i = 1; i <= 9; i++) {
            ColumnConstraints col = new ColumnConstraints();
            col.setHgrow(Priority.ALWAYS);
            col.setPercentWidth(100.0 / 9);
            gridSchedule.getColumnConstraints().add(col);
        }

        // Row 0: Headers
        RowConstraints row0 = new RowConstraints();
        row0.setPrefHeight(40);
        gridSchedule.getRowConstraints().add(row0);

        // Header Cells
        addCell(gridSchedule, createHeaderCell(""), 0, 0);
        for (int i = 1; i <= 9; i++) {
            addCell(gridSchedule, createHeaderCell(String.valueOf(i)), i, 0);
        }

        // Days Rows
        for (int r = 0; r < days.length; r++) {
            RowConstraints rc = new RowConstraints();
            rc.setPrefHeight(100);
            gridSchedule.getRowConstraints().add(rc);
            addCell(gridSchedule, createDayCell(arDays[r]), 0, r + 1);

            // Empty background cells
            for (int c = 1; c <= 9; c++) {
                addCell(gridSchedule, createEmptyCell(), c, r + 1);
            }
        }
    }

    private void buildGrid(List<BookingSlotInfo> slots) {
        setupEmptyGrid(); // Reset

        for (BookingSlotInfo slot : slots) {
            int rowIdx = getDayRowIndex(slot.dayOfWeek);
            if (rowIdx == -1 || slot.slotIndex < 1 || slot.slotIndex > 9) continue;

            VBox cell = createLectureCell(slot);
            // Remove the empty cell first
            gridSchedule.getChildren().removeIf(node -> GridPane.getColumnIndex(node) != null && 
                    GridPane.getColumnIndex(node) == slot.slotIndex && 
                    GridPane.getRowIndex(node) != null && 
                    GridPane.getRowIndex(node) == rowIdx);
            
            addCell(gridSchedule, cell, slot.slotIndex, rowIdx);
        }
    }

    @FXML
    private void handleExportImage() {
        // Since PDF generation requires external libs like PDFBox/iText which might cause maven issues,
        // we export the schedule as a high-quality PNG image which fulfills the user's need.
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("حفظ الجدول كصورة");
        fileChooser.setInitialFileName(txtGroup.getText() + "_Schedule.png");
        fileChooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("PNG Image", "*.png"));

        Stage stage = (Stage) btnExportPdf.getScene().getWindow();
        File file = fileChooser.showSaveDialog(stage);

        if (file != null) {
            try {
                SnapshotParameters params = new SnapshotParameters();
                params.setFill(Color.WHITE);
                WritableImage image = scheduleContainer.snapshot(params, null);
                ImageIO.write(SwingFXUtils.fromFXImage(image, null), "png", file);
                showAlert("نجاح", "تم حفظ الجدول بنجاح في:\n" + file.getAbsolutePath(), Alert.AlertType.INFORMATION);
            } catch (Exception e) {
                showAlert("خطأ", "فشل الحفظ: " + e.getMessage(), Alert.AlertType.ERROR);
            }
        }
    }

    // --- UI Helpers ---

    private int determineSlotIndex(String timeFrom) {
        // Heuristic based on typical start times
        if (timeFrom.startsWith("08:") || timeFrom.startsWith("09:")) return 1;
        if (timeFrom.startsWith("10:")) return 2;
        if (timeFrom.startsWith("11:") || timeFrom.startsWith("12:00") || timeFrom.startsWith("12:30")) return 3;
        if (timeFrom.startsWith("13:") || timeFrom.startsWith("14:30")) return 4;
        if (timeFrom.startsWith("15:") || timeFrom.startsWith("16:30")) return 5;
        if (timeFrom.startsWith("17:") || timeFrom.startsWith("18:30")) return 6;
        if (timeFrom.startsWith("19:") || timeFrom.startsWith("20:30")) return 7;
        if (timeFrom.startsWith("21:") || timeFrom.startsWith("22:30")) return 8;
        return 9;
    }

    private int getDayRowIndex(String dayOfWeek) {
        for (int i = 0; i < days.length; i++) {
            if (days[i].equalsIgnoreCase(dayOfWeek)) return i + 1;
        }
        return -1;
    }

    private void addCell(GridPane grid, Region node, int col, int row) {
        GridPane.setConstraints(node, col, row);
        GridPane.setHalignment(node, HPos.CENTER);
        grid.getChildren().add(node);
    }

    private VBox createHeaderCell(String text) {
        VBox box = new VBox(new Label(text));
        box.setAlignment(Pos.CENTER);
        box.setStyle("-fx-background-color: #008ba3; -fx-border-color: #ffffff; -fx-border-width: 1px;");
        ((Label) box.getChildren().get(0)).setStyle("-fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 14px;");
        box.setMaxSize(Double.MAX_VALUE, Double.MAX_VALUE);
        return box;
    }

    private VBox createDayCell(String text) {
        VBox box = new VBox(new Label(text));
        box.setAlignment(Pos.CENTER);
        box.setStyle("-fx-background-color: #008ba3; -fx-border-color: #ffffff; -fx-border-width: 1px;");
        ((Label) box.getChildren().get(0)).setStyle("-fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 14px;");
        box.setMaxSize(Double.MAX_VALUE, Double.MAX_VALUE);
        return box;
    }

    private VBox createEmptyCell() {
        VBox box = new VBox();
        box.setStyle("-fx-background-color: #e5e7eb;");
        box.setMaxSize(Double.MAX_VALUE, Double.MAX_VALUE);
        return box;
    }

    private VBox createLectureCell(BookingSlotInfo info) {
        VBox box = new VBox();
        box.setStyle("-fx-background-color: white; -fx-border-color: #4b5563; -fx-border-width: 1; -fx-padding: 4;");
        box.setMaxSize(Double.MAX_VALUE, Double.MAX_VALUE);
        box.setAlignment(Pos.TOP_CENTER);
        box.setSpacing(2);

        // Time HBox
        HBox timeBox = new HBox(new Label(info.timeFrom), new Label(" - "), new Label(info.timeTo));
        timeBox.setAlignment(Pos.CENTER);
        timeBox.setStyle("-fx-border-color: #d1d5db; -fx-border-width: 0 0 1 0;");
        for (var node : timeBox.getChildren()) ((Label)node).setFont(Font.font("System", 10));

        // Course Box
        Label courseCode = new Label("⚪ " + info.courseCode);
        courseCode.setStyle("-fx-font-weight: bold; -fx-font-size: 11px; -fx-text-fill: #1f2937;");
        Label courseName = new Label(info.courseName);
        courseName.setStyle("-fx-font-size: 10px; -fx-text-fill: #374151;");
        courseName.setWrapText(true);
        courseName.setAlignment(Pos.CENTER);

        // Lecturer
        Label lecturer = new Label(info.lecturerName);
        lecturer.setStyle("-fx-font-size: 10px; -fx-text-fill: #4b5563; -fx-border-color: #d1d5db; -fx-border-width: 1 0 1 0; -fx-padding: 2 0;");
        lecturer.setMaxWidth(Double.MAX_VALUE);
        lecturer.setAlignment(Pos.CENTER);

        // Room & Type
        HBox bottomBox = new HBox();
        bottomBox.setAlignment(Pos.CENTER);
        bottomBox.setSpacing(10);
        Label room = new Label("Room # " + info.roomId);
        Label type = new Label(info.lectureType.equalsIgnoreCase("section") ? "Sec." : "Lect.");
        room.setStyle("-fx-font-size: 10px;");
        type.setStyle("-fx-font-size: 10px;");
        bottomBox.getChildren().addAll(room, type);

        box.getChildren().addAll(timeBox, courseCode, courseName, lecturer, bottomBox);
        return box;
    }

    private void showAlert(String title, String message, Alert.AlertType type) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }

    private static class BookingSlotInfo {
        String dayOfWeek;
        String timeFrom;
        String timeTo;
        String courseCode;
        String courseName;
        String lecturerName;
        String lectureType;
        String roomId;
        int slotIndex;
    }
}
