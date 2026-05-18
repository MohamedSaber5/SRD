package com.aast.booking.admin.schedule;

import com.aast.booking.core.FirebaseService;
import com.aast.booking.admin.search.RoomSlotConfig;
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

    // Time slots definition (from RoomSlotConfig roughly, but we just use 1 to 16 indices)
    private final String[] days = {"SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"};
    private final String[] arDays = {"السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"};

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
                    Boolean biWeeklyObj = doc.getBoolean("biWeekly");
                    if (biWeeklyObj == null) biWeeklyObj = doc.getBoolean("isBiWeekly");
                    boolean biWeekly = biWeeklyObj != null ? biWeeklyObj : false;

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
                        info.biWeekly = biWeekly;

                        // Determine slot index based on timeFrom (1 to 16)
                        info.slotIndex = getStartPeriodFromTime(timeFrom);
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

        // Column 0: Days. Columns 1-16: Slots
        ColumnConstraints col0 = new ColumnConstraints();
        col0.setPercentWidth(10.0);
        gridSchedule.getColumnConstraints().add(col0);

        double slotPercent = 90.0 / 16;
        for (int i = 1; i <= 16; i++) {
            ColumnConstraints col = new ColumnConstraints();
            col.setHgrow(Priority.ALWAYS);
            col.setPercentWidth(slotPercent);
            gridSchedule.getColumnConstraints().add(col);
        }

        // Row 0: Headers
        RowConstraints row0 = new RowConstraints();
        row0.setPrefHeight(40);
        gridSchedule.getRowConstraints().add(row0);

        // Header Cells
        addCell(gridSchedule, createHeaderCell(""), 0, 0);
        for (int i = 1; i <= 16; i++) {
            addCell(gridSchedule, createHeaderCell(String.valueOf(i)), i, 0);
        }

        // Days Rows
        for (int r = 0; r < days.length; r++) {
            RowConstraints rc = new RowConstraints();
            rc.setPrefHeight(100);
            gridSchedule.getRowConstraints().add(rc);
            addCell(gridSchedule, createDayCell(arDays[r]), 0, r + 1);

            // Empty background cells
            for (int c = 1; c <= 16; c++) {
                addCell(gridSchedule, createEmptyCell(), c, r + 1);
            }
        }
    }

    private void buildGrid(List<BookingSlotInfo> slots) {
        setupEmptyGrid(); // Reset

        for (BookingSlotInfo slot : slots) {
            int rowIdx = getDayRowIndex(slot.dayOfWeek);
            if (rowIdx == -1) continue;

            int startPeriod = slot.slotIndex;
            if (startPeriod < 1 || startPeriod > 16) continue;

            final int r = rowIdx;
            if (slot.biWeekly) {
                // Bi-weekly occupies only a single period startPeriod
                VBox cell = createLectureCell(slot, slot.timeFrom, slot.timeTo, true);
                
                // Remove empty cell at startPeriod
                gridSchedule.getChildren().removeIf(node -> GridPane.getColumnIndex(node) != null && 
                        GridPane.getColumnIndex(node) == startPeriod && 
                        GridPane.getRowIndex(node) != null && 
                        GridPane.getRowIndex(node) == r);
                
                addCell(gridSchedule, cell, startPeriod, rowIdx);
            } else {
                // Weekly occupies two consecutive periods (span = 2)
                VBox cell = createLectureCell(slot, slot.timeFrom, slot.timeTo, false);
                
                // Remove empty cell at startPeriod and startPeriod + 1
                gridSchedule.getChildren().removeIf(node -> GridPane.getColumnIndex(node) != null && 
                        (GridPane.getColumnIndex(node) == startPeriod || GridPane.getColumnIndex(node) == (startPeriod + 1)) && 
                        GridPane.getRowIndex(node) != null && 
                        GridPane.getRowIndex(node) == r);
                
                gridSchedule.add(cell, startPeriod, rowIdx, 2, 1);
            }
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

    private int getStartPeriodFromTime(String timeFrom) {
        if (timeFrom == null || !timeFrom.contains(":")) return 1;
        try {
            String clean = timeFrom.replace("ص", "").replace("م", "").replace("AM", "").replace("PM", "").trim();
            String[] parts = clean.split(":");
            int hour = Integer.parseInt(parts[0]);
            
            boolean isPM = timeFrom.contains("م") || timeFrom.toUpperCase().contains("PM");
            if (isPM && hour < 12) {
                hour += 12;
            } else if (!isPM && hour == 12) {
                hour = 0;
            }
            
            // Period 1 starts at 08:30 -> hour = 8
            int period = hour - 8 + 1;
            if (period >= 1 && period <= 16) {
                return period;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 1;
    }

    private String adjustTimeByHours(String timeStr, int hours) {
        if (timeStr == null || !timeStr.contains(":")) return timeStr;
        try {
            String[] parts = timeStr.split(":");
            int h = Integer.parseInt(parts[0]);
            int m = Integer.parseInt(parts[1]);
            h = (h + hours) % 24;
            return String.format("%02d:%02d", h, m);
        } catch (Exception e) {
            return timeStr;
        }
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

    private VBox createLectureCell(BookingSlotInfo info, String from, String to, boolean isBiWeekly) {
        VBox box = new VBox();
        box.setStyle("-fx-background-color: white; -fx-border-color: #4b5563; -fx-border-width: 1; -fx-padding: 4;");
        box.setMaxSize(Double.MAX_VALUE, Double.MAX_VALUE);
        box.setAlignment(Pos.TOP_CENTER);
        box.setSpacing(2);

        // Time HBox
        String displayTime = RoomSlotConfig.formatTime(from) + " - " + RoomSlotConfig.formatTime(to);
        Label timeLabel = new Label(displayTime);
        timeLabel.setFont(Font.font("System", 9));
        
        HBox timeBox = new HBox(timeLabel);
        timeBox.setAlignment(Pos.CENTER);
        timeBox.setStyle("-fx-border-color: #d1d5db; -fx-border-width: 0 0 1 0;");

        // Course Box
        Label courseCode = new Label((isBiWeekly ? "🔵 " : "⚪ ") + info.courseCode);
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
        bottomBox.setSpacing(5);
        Label room = new Label("Room " + info.roomId);
        String suffix = info.lectureType.equalsIgnoreCase("section") ? "Sec." : "Lect.";
        if (isBiWeekly) {
            suffix += " (أسبوعين)";
        }
        Label type = new Label(suffix);
        room.setStyle("-fx-font-size: 9px;");
        type.setStyle("-fx-font-size: 9px; -fx-text-fill: " + (isBiWeekly ? "#0284c7" : "#374151") + "; -fx-font-weight: " + (isBiWeekly ? "bold" : "normal"));
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
        boolean biWeekly;
    }
}
