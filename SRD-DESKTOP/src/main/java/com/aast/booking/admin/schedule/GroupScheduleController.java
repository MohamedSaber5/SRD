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

// PDFBox and AWT Imports
import java.awt.image.BufferedImage;
import java.awt.Graphics2D;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

public class GroupScheduleController implements Initializable {

    @FXML private ComboBox<String> comboCollege;
    @FXML private ComboBox<String> comboDepartment;
    @FXML private ComboBox<String> comboPeriod;
    @FXML private ComboBox<String> comboGroup;
    @FXML private Button btnSearch;
    @FXML private Button btnExportPdf;
    @FXML private VBox scheduleContainer;
    @FXML private GridPane gridSchedule;
    @FXML private Label lblStatus;

    private final Firestore db;
    private final Map<String, List<String>> collegeDeptsMap = new LinkedHashMap<>();

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

        // 1. Populate Colleges & Departments dynamically
        collegeDeptsMap.put("كلية الهندسة والتكنولوجيا", Arrays.asList(
            "هندسة الإلكترونيات والاتصالات",
            "الهندسة المعمارية والتصميم البيئي",
            "هندسة التشييد والبناء",
            "الهندسة الميكانيكية (قوى - ميكاترونيات)"
        ));
        collegeDeptsMap.put("كلية حاسبات ومعلومات", Arrays.asList(
            "هندسة البرمجيات",
            "علوم حاسب"
        ));
        collegeDeptsMap.put("كلية الإدارة والتكنولوجيا", Arrays.asList(
            "إدارة الأعمال",
            "نظم معلومات الأعمال",
            "إدارة الإعلام",
            "التسويق والتمويل"
        ));
        collegeDeptsMap.put("كلية النقل الدولي واللوجستيات", Arrays.asList(
            "إدارة اللوجستيات وسلاسل الإمداد",
            "إدارة النقل"
        ));
        collegeDeptsMap.put("كلية الآثار والتراث الحضاري", Arrays.asList(
            "إدارة التراث والمتاحف",
            "الآثار المصرية",
            "الإرشاد السياحي"
        ));

        comboCollege.getItems().addAll(collegeDeptsMap.keySet());
        comboCollege.setOnAction(e -> {
            String selectedCollege = comboCollege.getValue();
            comboDepartment.getItems().clear();
            if (selectedCollege != null) {
                comboDepartment.getItems().addAll(collegeDeptsMap.get(selectedCollege));
                comboDepartment.getSelectionModel().selectFirst();
            }
        });
        
        // Select first college and populate its departments by default
        comboCollege.getSelectionModel().selectFirst();
        String firstCollege = comboCollege.getValue();
        if (firstCollege != null) {
            comboDepartment.getItems().addAll(collegeDeptsMap.get(firstCollege));
            comboDepartment.getSelectionModel().selectFirst();
        }

        // 2. Populate Period (1 to 8) - Academic Semesters (no "الكل", select "الفترة 6" by default)
        for (int i = 1; i <= 8; i++) {
            comboPeriod.getItems().add("الفترة " + i);
        }
        comboPeriod.getSelectionModel().select("الفترة 6");

        // 3. Populate Groups (A to N)
        comboGroup.getItems().add("الكل");
        for (char c = 'A'; c <= 'N'; c++) {
            comboGroup.getItems().add(String.valueOf(c));
        }
        comboGroup.getSelectionModel().selectFirst();
    }

    @FXML
    private void handleSearch() {
        String college = comboCollege.getValue();
        String dept = comboDepartment.getValue();
        String group = comboGroup.getValue();
        String selectedPeriod = comboPeriod.getValue();

        if (college == null || dept == null || group == null) {
            showAlert("خطأ", "يرجى اختيار الكلية والقسم والجروب.", Alert.AlertType.ERROR);
            return;
        }

        lblStatus.setText("جاري جلب الجدول...");
        btnSearch.setDisable(true);
        btnExportPdf.setDisable(true);
        scheduleContainer.setVisible(true);

        // Normalize college and department names to match database format perfectly
        String normalizedCollege = normalizeCollege(college);
        String normalizedDept = normalizeDepartment(dept);

        CompletableFuture.runAsync(() -> {
            try {
                // Query Firestore for bookings matching normalized college and department
                var baseQuery = db.collection("bookings")
                        .whereEqualTo("college", normalizedCollege)
                        .whereEqualTo("department", normalizedDept);

                var query = baseQuery.get().get();
                List<QueryDocumentSnapshot> docs = query.getDocuments();
                System.out.println("[DEBUG] GroupScheduleController: Query returned " + docs.size() + " documents from Firestore.");

                // Deduplicate by courseCode + lectureType + timeFrom
                Map<String, BookingSlotInfo> uniqueSlots = new HashMap<>();

                for (var doc : docs) {
                    String docId = doc.getId();
                    String source = doc.getString("source");
                    String status = doc.getString("status");
                    
                    boolean isWeekly = "weekly_lecture".equals(source);
                    boolean isApproved = "approved".equals(status) || "approved_by_branch".equals(status);
                    
                    System.out.println("[DEBUG] Doc " + docId + ": code=" + doc.getString("courseCode") + " | source=" + source + " | status=" + status + " | isWeekly=" + isWeekly + " | isApproved=" + isApproved);

                    // Filter: must be either an imported weekly lecture or an approved student booking
                    if (!isWeekly && !isApproved) {
                        System.out.println("[DEBUG]   -> SKIPPED: not weekly and not approved");
                        continue;
                    }

                    // Group filter (if selected group is not "الكل")
                    String docGroup = doc.getString("group");
                    if (!"الكل".equals(group)) {
                        if (docGroup == null || !docGroup.equalsIgnoreCase(group)) {
                            System.out.println("[DEBUG]   -> SKIPPED: group mismatch (selected: " + group + ", doc: " + docGroup + ")");
                            continue;
                        }
                    }

                    // Academic Semester (period) filtering
                    String docPeriod = doc.getString("period");
                    if (docPeriod == null) {
                        Long pLong = doc.getLong("period");
                        if (pLong != null) {
                            docPeriod = String.valueOf(pLong);
                        }
                    }

                    // Fallback to guess period based on standard courses if not set
                    if (docPeriod == null && doc.getString("courseCode") != null) {
                        String code = doc.getString("courseCode");
                        if (code.contains("3201") || code.contains("3202") || code.contains("3002") || code.contains("3403")) {
                            docPeriod = "6";
                        }
                    }

                    if (selectedPeriod != null) {
                        String targetPeriod = selectedPeriod.replace("الفترة ", "").trim();
                        if (docPeriod == null || !docPeriod.equals(targetPeriod)) {
                            System.out.println("[DEBUG]   -> SKIPPED: period mismatch (selected: " + targetPeriod + ", doc: " + docPeriod + ")");
                            continue;
                        }
                    }

                    String dateStr = doc.getString("date");
                    if (dateStr == null) {
                        System.out.println("[DEBUG]   -> SKIPPED: null date");
                        continue;
                    }

                    LocalDate date = LocalDate.parse(dateStr);
                    String dayOfWeek = date.getDayOfWeek().name(); // SATURDAY, etc.

                    String timeFrom = doc.getString("timeFrom");
                    String timeTo = doc.getString("timeTo");
                    
                    // Fields handling for both weekly lectures and student bookings
                    String courseCode = doc.getString("courseCode");
                    if (courseCode == null || courseCode.trim().isEmpty()) {
                        courseCode = doc.getString("purpose");
                    }
                    if (courseCode == null || courseCode.trim().isEmpty()) {
                        courseCode = "حجز";
                    }

                    String courseName = doc.getString("courseName");
                    if (courseName == null || courseName.trim().isEmpty()) {
                        courseName = doc.getString("purpose");
                    }
                    if (courseName == null || courseName.trim().isEmpty()) {
                        courseName = "حجز معتمد";
                    }

                    String lecturerName = doc.getString("lecturerName");
                    if (lecturerName == null || lecturerName.trim().isEmpty()) {
                        lecturerName = doc.getString("responsibleName");
                    }
                    if (lecturerName == null || lecturerName.trim().isEmpty()) {
                        lecturerName = "—";
                    }

                    String lectureType = doc.getString("lectureType");
                    if (lectureType == null || lectureType.trim().isEmpty()) {
                        lectureType = "booking";
                    }

                    String roomId = doc.getString("roomId");
                    Boolean biWeeklyObj = doc.getBoolean("biWeekly");
                    if (biWeeklyObj == null) biWeeklyObj = doc.getBoolean("isBiWeekly");
                    boolean biWeekly = biWeeklyObj != null ? biWeeklyObj : false;

                    // Unique key to prevent duplicating the same lecture every week
                    String key = dayOfWeek + "_" + timeFrom + "_" + courseCode + "_" + lectureType;
                    System.out.println("[DEBUG]   -> MATCHED! key=" + key + " | date=" + dateStr + " | day=" + dayOfWeek + " | time=" + timeFrom + "-" + timeTo);
                    
                    if (!uniqueSlots.containsKey(key)) {
                        BookingSlotInfo info = new BookingSlotInfo();
                        info.dayOfWeek = dayOfWeek;
                        info.timeFrom = timeFrom;
                        info.timeTo = timeTo;
                        info.courseCode = courseCode;
                        info.courseName = courseName;
                        info.lecturerName = lecturerName;
                        info.lectureType = lectureType;
                        info.roomId = roomId != null ? roomId : "N/A";
                        info.biWeekly = biWeekly;

                        // Parse startSlot and endSlot from Firestore, or fallback using times
                        Long dbStartSlot = doc.getLong("startSlot");
                        Long dbEndSlot = doc.getLong("endSlot");
                        if (dbStartSlot != null && dbEndSlot != null) {
                            info.startSlot = dbStartSlot.intValue();
                            info.endSlot = dbEndSlot.intValue();
                        } else {
                            info.startSlot = getStartPeriodFromTime(timeFrom);
                            info.endSlot = getEndPeriodFromTime(timeTo);
                        }
                        info.slotIndex = info.startSlot;

                        System.out.println("[DEBUG]   -> ADDED to uniqueSlots: startSlot=" + info.startSlot + " | endSlot=" + info.endSlot + " | biWeekly=" + biWeekly);
                        uniqueSlots.put(key, info);
                    } else {
                        System.out.println("[DEBUG]   -> Already exists in uniqueSlots.");
                    }
                }

                Platform.runLater(() -> {
                    List<BookingSlotInfo> list = new ArrayList<>(uniqueSlots.values());
                    buildGrid(list);
                    if ("الكل".equals(group)) {
                        lblStatus.setText("تنبيه: تم عرض الجدول لجميع المجموعات (قد تظهر متداخلة). يرجى تحديد جروب معين (مثال: F) للحصول على جدول منظم.");
                        lblStatus.setStyle("-fx-text-fill: #b45309; -fx-font-weight: bold; -fx-font-size: 13px;");
                    } else {
                        lblStatus.setText("تم تحميل الجدول بنجاح للجروب " + group + ".");
                        lblStatus.setStyle("-fx-text-fill: #047857; -fx-font-weight: bold; -fx-font-size: 13px;");
                    }
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
        gridSchedule.setStyle("-fx-background-color: #0d3868; -fx-padding: 2;"); // Premium dark border

        // Column 0: Days. Columns 1-16: Slots
        ColumnConstraints col0 = new ColumnConstraints();
        col0.setPercentWidth(12.0); // Slightly wider for English Day names
        gridSchedule.getColumnConstraints().add(col0);

        double slotPercent = 88.0 / 16;
        for (int i = 1; i <= 16; i++) {
            ColumnConstraints col = new ColumnConstraints();
            col.setHgrow(Priority.ALWAYS);
            col.setPercentWidth(slotPercent);
            gridSchedule.getColumnConstraints().add(col);
        }

        // Row 0: Headers
        RowConstraints row0 = new RowConstraints();
        row0.setPrefHeight(35);
        gridSchedule.getRowConstraints().add(row0);

        // Header Cells
        // Column 0 Header cell
        VBox emptyHeader = new VBox();
        emptyHeader.setStyle("-fx-background-color: #0d3868; -fx-border-color: #ffffff; -fx-border-width: 1px;");
        emptyHeader.setMaxSize(Double.MAX_VALUE, Double.MAX_VALUE);
        addCell(gridSchedule, emptyHeader, 0, 0);

        // 16 Slot Headers (1 to 16)
        for (int i = 1; i <= 16; i++) {
            Label label = new Label(String.valueOf(i));
            label.setStyle("-fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 13px;");
            VBox slotHeader = new VBox(label);
            slotHeader.setAlignment(Pos.CENTER);
            slotHeader.setStyle("-fx-background-color: #0d3868; -fx-border-color: #ffffff; -fx-border-width: 1px;");
            slotHeader.setMaxSize(Double.MAX_VALUE, Double.MAX_VALUE);
            addCell(gridSchedule, slotHeader, i, 0);
        }

        // Days Rows
        String[] engDays = {"Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"};
        for (int r = 0; r < engDays.length; r++) {
            RowConstraints rc = new RowConstraints();
            rc.setPrefHeight(110); // taller for perfect content spacing
            gridSchedule.getRowConstraints().add(rc);
            
            // Day label cell
            Label dayLabel = new Label(engDays[r]);
            dayLabel.setStyle("-fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 14px;");
            VBox dayCell = new VBox(dayLabel);
            dayCell.setAlignment(Pos.CENTER);
            dayCell.setStyle("-fx-background-color: #0d3868; -fx-border-color: #ffffff; -fx-border-width: 1px;");
            dayCell.setMaxSize(Double.MAX_VALUE, Double.MAX_VALUE);
            addCell(gridSchedule, dayCell, 0, r + 1);

            // Empty background cells for the 16 slots
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

            int startSlot = slot.startSlot;
            int endSlot = slot.endSlot;
            
            if (startSlot < 1 || startSlot > 16) continue;
            if (endSlot < startSlot) endSlot = startSlot;
            if (endSlot > 16) endSlot = 16;

            final int r = rowIdx;
            final int sStart = startSlot;
            final int sEnd = endSlot;
            final int span = endSlot - startSlot + 1;

            // Remove any empty background cells in this span range to make room for our spanned cell
            gridSchedule.getChildren().removeIf(node -> {
                Integer colIdx = GridPane.getColumnIndex(node);
                Integer rowIdxNode = GridPane.getRowIndex(node);
                return colIdx != null && rowIdxNode != null &&
                       rowIdxNode == r &&
                       colIdx >= sStart && colIdx <= sEnd;
            });

            VBox cell = createLectureCell(slot);
            gridSchedule.add(cell, startSlot, rowIdx, span, 1);
        }
    }

    @FXML
    private void handleExportImage() {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("حفظ الجدول");
        fileChooser.setInitialFileName(comboGroup.getValue() + "_Schedule");
        fileChooser.getExtensionFilters().addAll(
            new FileChooser.ExtensionFilter("PDF Document (*.pdf)", "*.pdf"),
            new FileChooser.ExtensionFilter("PNG Image (*.png)", "*.png")
        );

        Stage stage = (Stage) btnExportPdf.getScene().getWindow();
        File file = fileChooser.showSaveDialog(stage);

        if (file != null) {
            try {
                SnapshotParameters params = new SnapshotParameters();
                params.setFill(Color.WHITE);
                
                WritableImage image = scheduleContainer.snapshot(params, null);
                BufferedImage bufferedImage = SwingFXUtils.fromFXImage(image, null);
                
                // Fix the JavaFX RTL horizontal mirroring bug
                boolean isRTL = scheduleContainer.getEffectiveNodeOrientation() == javafx.geometry.NodeOrientation.RIGHT_TO_LEFT || 
                                (scheduleContainer.getScene() != null && scheduleContainer.getScene().getRoot() != null && 
                                 scheduleContainer.getScene().getRoot().getNodeOrientation() == javafx.geometry.NodeOrientation.RIGHT_TO_LEFT);
                
                if (isRTL) {
                    bufferedImage = flipImageHorizontal(bufferedImage);
                }
                
                String fileName = file.getName().toLowerCase();
                if (fileName.endsWith(".pdf")) {
                    saveAsPdf(bufferedImage, file);
                    showAlert("نجاح", "تم حفظ الجدول بنجاح كـ PDF في:\n" + file.getAbsolutePath(), Alert.AlertType.INFORMATION);
                } else {
                    ImageIO.write(bufferedImage, "png", file);
                    showAlert("نجاح", "تم حفظ الجدول بنجاح كـ صورة في:\n" + file.getAbsolutePath(), Alert.AlertType.INFORMATION);
                }
            } catch (Exception e) {
                showAlert("خطأ", "فشل الحفظ: " + e.getMessage(), Alert.AlertType.ERROR);
                e.printStackTrace();
            }
        }
    }

    private BufferedImage flipImageHorizontal(BufferedImage img) {
        int w = img.getWidth();
        int h = img.getHeight();
        BufferedImage flipped = new BufferedImage(w, h, img.getType() == 0 ? BufferedImage.TYPE_INT_ARGB : img.getType());
        Graphics2D g = flipped.createGraphics();
        g.drawImage(img, 0, 0, w, h, w, 0, 0, h, null);
        g.dispose();
        return flipped;
    }

    private void saveAsPdf(BufferedImage bufferedImage, File file) throws Exception {
        try (PDDocument doc = new PDDocument()) {
            float width = bufferedImage.getWidth();
            float height = bufferedImage.getHeight();
            
            PDPage page = new PDPage(new PDRectangle(width, height));
            doc.addPage(page);
            
            PDImageXObject pdImage = LosslessFactory.createFromImage(doc, bufferedImage);
            
            try (PDPageContentStream contentStream = new PDPageContentStream(doc, page)) {
                contentStream.drawImage(pdImage, 0, 0, width, height);
            }
            
            doc.save(file);
        }
    }

    // --- UI Helpers ---

    private int getStartPeriodFromTime(String timeFrom) {
        if (timeFrom == null || !timeFrom.contains(":")) return 1;
        try {
            String clean = timeFrom.replace("ص", "").replace("م", "").replace("AM", "").replace("PM", "").trim();
            String[] parts = clean.split(":");
            int hour = Integer.parseInt(parts[0]);
            
            boolean hasMeridiem = timeFrom.contains("ص") || timeFrom.contains("م") || 
                                  timeFrom.toUpperCase().contains("AM") || timeFrom.toUpperCase().contains("PM");
            if (hasMeridiem) {
                boolean isPM = timeFrom.contains("م") || timeFrom.toUpperCase().contains("PM");
                if (isPM && hour < 12) {
                    hour += 12;
                } else if (!isPM && hour == 12) {
                    hour = 0;
                }
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
        Label label = new Label(text);
        label.setTextAlignment(javafx.scene.text.TextAlignment.CENTER);
        label.setAlignment(Pos.CENTER);
        VBox box = new VBox(label);
        box.setAlignment(Pos.CENTER);
        box.setStyle("-fx-background-color: #001e40; -fx-border-color: #ffffff; -fx-border-width: 1px;"); // Dark premium navy
        label.setStyle("-fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 11px;");
        box.setMaxSize(Double.MAX_VALUE, Double.MAX_VALUE);
        return box;
    }

    private VBox createDayCell(String text) {
        Label label = new Label(text);
        label.setTextAlignment(javafx.scene.text.TextAlignment.CENTER);
        label.setAlignment(Pos.CENTER);
        VBox box = new VBox(label);
        box.setAlignment(Pos.CENTER);
        box.setStyle("-fx-background-color: #0d3868; -fx-border-color: #ffffff; -fx-border-width: 1px;"); // Lighter premium navy
        label.setStyle("-fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 12px;");
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
        String bgColor = getCourseColor(info.courseCode);
        box.setStyle("-fx-background-color: " + bgColor + "; -fx-border-color: #0d3868; -fx-border-width: 1px; -fx-padding: 6px;");
        box.setMaxSize(Double.MAX_VALUE, Double.MAX_VALUE);
        box.setAlignment(Pos.CENTER);
        box.setSpacing(4);

        // Course Label (Name, Code, Lecture/Section suffix)
        String suffix = info.lectureType.equalsIgnoreCase("section") ? "Sec." : "Lect.";
        if (info.biWeekly) {
            suffix += " (أسبوعين)";
        }
        
        Label courseLabel = new Label(info.courseName + "\n(" + info.courseCode + ")\n" + suffix);
        courseLabel.setStyle("-fx-font-weight: bold; -fx-font-size: 11px; -fx-text-fill: #111827;");
        courseLabel.setTextAlignment(javafx.scene.text.TextAlignment.CENTER);
        courseLabel.setWrapText(true);

        // Lecturer Label
        Label lecturer = new Label(info.lecturerName);
        lecturer.setStyle("-fx-font-size: 10px; -fx-text-fill: #374151;");
        lecturer.setTextAlignment(javafx.scene.text.TextAlignment.CENTER);
        lecturer.setWrapText(true);

        // Room Label
        String roomStr = info.roomId != null && !info.roomId.equalsIgnoreCase("N/A") ? "Room " + info.roomId : "";
        Label room = new Label(roomStr);
        room.setStyle("-fx-font-size: 9px; -fx-text-fill: #4b5563; -fx-font-weight: bold;");

        box.getChildren().addAll(courseLabel, lecturer, room);
        return box;
    }

    private String getCourseColor(String courseCode) {
        if (courseCode == null) return "#ffffff";
        String clean = courseCode.trim().toUpperCase();
        if (clean.contains("CSE3201")) return "#f0f4c3"; // Designing Human Centered Software (yellow-green)
        if (clean.contains("CSE3202")) return "#f8bbd0"; // Software Component Design (pink)
        if (clean.contains("CCS3002")) return "#ffe0b2"; // Numerical Methods (orange)
        if (clean.contains("CIT3101")) return "#d4e157"; // Professional Training (lime)
        if (clean.contains("CCS3403")) return "#b2ebf2"; // Computing Algorithms (cyan)
        if (clean.contains("EBA3201")) return "#b2dfdb"; // Advanced Statistics (teal)
        
        // General mapping for other courses
        int hash = Math.abs(clean.hashCode());
        String[] colors = {
            "#f0f4c3", "#f8bbd0", "#ffe0b2", "#d4e157", "#b2ebf2", "#b2dfdb",
            "#d1c4e9", "#c5cae9", "#bbdefb", "#e0f2f1", "#f9fbe7", "#fff9c4"
        };
        return colors[hash % colors.length];
    }

    private int getEndPeriodFromTime(String timeTo) {
        if (timeTo == null || !timeTo.contains(":")) return 1;
        try {
            String clean = timeTo.replace("ص", "").replace("م", "").replace("AM", "").replace("PM", "").trim();
            String[] parts = clean.split(":");
            int hour = Integer.parseInt(parts[0]);
            int minute = Integer.parseInt(parts[1]);
            
            boolean hasMeridiem = timeTo.contains("ص") || timeTo.contains("م") || 
                                  timeTo.toUpperCase().contains("AM") || timeTo.toUpperCase().contains("PM");
            if (hasMeridiem) {
                boolean isPM = timeTo.contains("م") || timeTo.toUpperCase().contains("PM");
                if (isPM && hour < 12) {
                    hour += 12;
                } else if (!isPM && hour == 12) {
                    hour = 0;
                }
            }
            
            if (hour == 0) {
                hour = 24;
            }
            
            int slot = hour - 8;
            if (minute >= 30) {
                // e.g. 09:30 -> slot = 9 - 8 = 1
            } else {
                slot = hour - 9;
            }
            if (slot >= 1 && slot <= 16) {
                return slot;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 1;
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
        int startSlot;
        int endSlot;
        boolean biWeekly;
    }

    public static String normalizeCollege(String college) {
        if (college == null) return "";
        String norm = college.replace("كلية ", "").trim();
        if (norm.contains("الهندسة")) {
            return "الهندسة";
        }
        if (norm.contains("حاسبات")) {
            return "حاسبات ومعلومات";
        }
        if (norm.contains("الإدارة")) {
            return "الإدارة والتكنولوجيا";
        }
        if (norm.contains("النقل") || norm.contains("لوجستيات")) {
            return "النقل الدولي واللوجستيات";
        }
        if (norm.contains("الآثار") || norm.contains("تراث")) {
            return "الآثار والتراث الحضاري";
        }
        return norm;
    }

    public static String normalizeDepartment(String dept) {
        if (dept == null) return "";
        String norm = dept.replace("قسم ", "").trim();
        if (norm.contains("اتصالات") || norm.contains("الإلكترونيات")) {
            return "هندسة الإلكترونيات والاتصالات";
        }
        if (norm.contains("معمارية") || norm.contains("العمارة")) {
            return "الهندسة المعمارية والتصميم البيئي";
        }
        if (norm.contains("تشييد") || norm.contains("البناء")) {
            return "هندسة التشييد والبناء";
        }
        if (norm.contains("ميكانيكية") || norm.contains("ميكاترونيات")) {
            return "الهندسة الميكانيكية (قوى - ميكاترونيات)";
        }
        if (norm.contains("برمجيات") || norm.contains("Software")) {
            return "هندسة البرمجيات";
        }
        if (norm.contains("علوم حاسب") || norm.contains("Computer Science") || norm.contains("علوم الحاسب")) {
            return "علوم حاسب";
        }
        if (norm.contains("أعمال") || norm.contains("Business")) {
            return "إدارة الأعمال";
        }
        if (norm.contains("نظم معلومات") || norm.contains("BIS")) {
            return "نظم معلومات الأعمال";
        }
        if (norm.contains("إعلام") || norm.contains("Media")) {
            return "إدارة الإعلام";
        }
        if (norm.contains("تسويق") || norm.contains("تمويل") || norm.contains("Marketing")) {
            return "التسويق والتمويل";
        }
        if (norm.contains("سلاسل") || norm.contains("اللوجستيات")) {
            return "إدارة اللوجستيات وسلاسل الإمداد";
        }
        if (norm.contains("نقل") || norm.contains("Transport")) {
            return "إدارة النقل";
        }
        if (norm.contains("تراث") || norm.contains("متاحف")) {
            return "إدارة التراث والمتاحف";
        }
        if (norm.contains("مصرية") || norm.contains("الآثار")) {
            return "الآثار المصرية";
        }
        if (norm.contains("إرشاد") || norm.contains("سياحي")) {
            return "الإرشاد السياحي";
        }
        return norm;
    }
}
