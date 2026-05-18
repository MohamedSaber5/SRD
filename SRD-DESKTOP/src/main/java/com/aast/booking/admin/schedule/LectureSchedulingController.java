package com.aast.booking.admin.schedule;

import com.aast.booking.services.BranchManagerService;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

import java.io.File;
import java.io.FileOutputStream;
import java.net.URL;
import java.util.ResourceBundle;
import java.util.concurrent.CompletableFuture;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

/**
 * Controller for the Weekly Lecture Scheduling screen.
 */
public class LectureSchedulingController implements Initializable {

    @FXML private Label lblStatus;
    @FXML private ProgressBar progressBar;
    @FXML private Button btnUpload;
    @FXML private Button btnDownloadTemplate;
    @FXML private Button btnCancelAll;
    @FXML private Label lblRamadanMode;

    private boolean isRamadanMode = false;
    private final LectureSchedulingEngine engine = new LectureSchedulingEngine();

    @Override
    public void initialize(URL url, ResourceBundle rb) {
        progressBar.setVisible(false);
        lblStatus.setText("يرجى تحميل ملف الإكسل للبدء.");
        
        // Fetch Ramadan mode so slots are resolved correctly
        BranchManagerService.getInstance().fetchRamadanMode().thenAccept(mode -> {
            Platform.runLater(() -> {
                this.isRamadanMode = mode;
                lblRamadanMode.setVisible(mode);
                lblRamadanMode.setManaged(mode);
            });
        });
    }

    @FXML
    private void handleUpload() {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("اختر ملف جدول المحاضرات (Excel)");
        fileChooser.getExtensionFilters().add(
                new FileChooser.ExtensionFilter("Excel Files", "*.xlsx")
        );

        Stage stage = (Stage) btnUpload.getScene().getWindow();
        File selectedFile = fileChooser.showOpenDialog(stage);

        if (selectedFile != null) {
            startProcessing(selectedFile);
        }
    }

    @FXML
    private void handleDownloadTemplate() {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("حفظ قالب الإكسل (Template)");
        fileChooser.setInitialFileName("schedule_template.xlsx");
        fileChooser.getExtensionFilters().add(
                new FileChooser.ExtensionFilter("Excel Files", "*.xlsx")
        );

        Stage stage = (Stage) btnDownloadTemplate.getScene().getWindow();
        File saveFile = fileChooser.showSaveDialog(stage);

        if (saveFile != null) {
            try {
                generateTemplate(saveFile);
                showAlert("نجاح", "تم حفظ قالب الإكسل بنجاح في:\n" + saveFile.getAbsolutePath(), Alert.AlertType.INFORMATION);
            } catch (Exception e) {
                showAlert("خطأ", "حدث خطأ أثناء حفظ القالب: " + e.getMessage(), Alert.AlertType.ERROR);
            }
        }
    }

    private void generateTemplate(File file) throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Schedule");

            // عناوين الأعمدة (Header)
            Row headerRow = sheet.createRow(0);
            String[] columns = {
                "الكلية", "القسم", "المادة", "كود المادة", "اسم المحاضر",
                "نوع المحاضرة", "السعة", "الفترة", "الفترات اليومية", "اليوم", "تاريخ البداية",
                "الجروب", "كل أسبوعين (0/1)"
            };
            
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int i = 0; i < columns.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // أمثلة (داتا جاهزة)
            Object[][] data = {
                {"حاسبات ومعلومات", "هندسة البرمجيات", "Designing Human Centered Software", "CSE3201", "Walid moahmed Rabae Abdel Moaz", "lecture", 18, 6, "7-9", "الأحد", "2027-01-10", "F", 0},
                {"حاسبات ومعلومات", "هندسة البرمجيات", "Designing Human Centered Software", "CSE3201", "Walid moahmed Rabae Abdel Moaz", "section", 18, 6, "1-4", "الأحد", "2027-01-10", "F", 0},
                {"حاسبات ومعلومات", "هندسة البرمجيات", "Software Component Design", "CSE3202", "شادي عبد القادر زكريا زهران", "lecture", 40, 6, "5-6", "السبت", "2027-01-09", "F", 0}
            };

            int rowNum = 1;
            for (Object[] rowData : data) {
                Row row = sheet.createRow(rowNum++);
                for (int i = 0; i < rowData.length; i++) {
                    org.apache.poi.ss.usermodel.Cell cell = row.createCell(i);
                    if (rowData[i] instanceof String) {
                        cell.setCellValue((String) rowData[i]);
                    } else if (rowData[i] instanceof Integer) {
                        cell.setCellValue((Integer) rowData[i]);
                    }
                }
            }
            
            for(int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            try (FileOutputStream fileOut = new FileOutputStream(file)) {
                workbook.write(fileOut);
            }
        }
    }

    private void startProcessing(File file) {
        setUiLocked(true);
        progressBar.setVisible(true);
        progressBar.setProgress(0);
        lblStatus.setText("جاري معالجة الملف...");
        lblStatus.setStyle("-fx-text-fill: #1e3a5f;");

        engine.processSchedule(file, isRamadanMode, (message, percentage) -> {
            Platform.runLater(() -> {
                lblStatus.setText(message);
                progressBar.setProgress(percentage);
            });
        }).thenAccept(count -> {
            Platform.runLater(() -> {
                setUiLocked(false);
                lblStatus.setText("تم الانتهاء بنجاح! تم إنشاء " + count + " حجز.");
                lblStatus.setStyle("-fx-text-fill: #16a34a; -fx-font-weight: bold;");
                showAlert("نجاح", "تمت أتمتة جدول المحاضرات بنجاح وإضافته لقاعدة البيانات.", Alert.AlertType.INFORMATION);
            });
        }).exceptionally(ex -> {
            Platform.runLater(() -> {
                setUiLocked(false);
                progressBar.setVisible(false);
                lblStatus.setText("حدث خطأ أثناء المعالجة.");
                lblStatus.setStyle("-fx-text-fill: #dc2626; -fx-font-weight: bold;");
                showAlert("خطأ", ex.getCause() != null ? ex.getCause().getMessage() : ex.getMessage(), Alert.AlertType.ERROR);
            });
            return null;
        });
    }

    @FXML
    private void handleCancelAll() {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("تأكيد الإلغاء");
        alert.setHeaderText("إلغاء جميع حجوزات المحاضرات الأسبوعية");
        alert.setContentText("هل أنت متأكد أنك تريد إلغاء ومسح جميع الحجوزات التي تم إنشاؤها تلقائياً عبر ملف الإكسل؟ لا يمكن التراجع عن هذا الإجراء.");

        alert.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                setUiLocked(true);
                progressBar.setVisible(true);
                progressBar.setProgress(ProgressIndicator.INDETERMINATE_PROGRESS);
                lblStatus.setText("جاري الحذف من قاعدة البيانات...");
                lblStatus.setStyle("-fx-text-fill: #dc2626;");

                engine.cancelAllWeeklyBookings().thenAccept(count -> {
                    Platform.runLater(() -> {
                        setUiLocked(false);
                        progressBar.setVisible(false);
                        lblStatus.setText("تم حذف " + count + " حجز بنجاح.");
                        lblStatus.setStyle("-fx-text-fill: #16a34a; -fx-font-weight: bold;");
                        showAlert("نجاح", "تم حذف جميع حجوزات الإكسل بنجاح.", Alert.AlertType.INFORMATION);
                    });
                }).exceptionally(ex -> {
                    Platform.runLater(() -> {
                        setUiLocked(false);
                        progressBar.setVisible(false);
                        lblStatus.setText("حدث خطأ أثناء الحذف.");
                        lblStatus.setStyle("-fx-text-fill: #dc2626;");
                        showAlert("خطأ", ex.getCause() != null ? ex.getCause().getMessage() : ex.getMessage(), Alert.AlertType.ERROR);
                    });
                    return null;
                });
            }
        });
    }

    private void setUiLocked(boolean locked) {
        btnUpload.setDisable(locked);
        btnCancelAll.setDisable(locked);
    }

    private void showAlert(String title, String message, Alert.AlertType type) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
