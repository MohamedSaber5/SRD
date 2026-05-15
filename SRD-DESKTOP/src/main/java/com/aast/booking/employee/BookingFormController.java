package com.aast.booking.employee;

import com.aast.booking.core.SessionManager;
import com.aast.booking.models.Booking;
import com.aast.booking.models.Room;
import com.aast.booking.models.TimeSlot;
import com.aast.booking.patterns.builder.BookingBuilder;
import com.aast.booking.services.BookingService;
import com.aast.booking.services.RoomService;
import com.google.cloud.firestore.ListenerRegistration;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.layout.*;

import java.net.URL;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.ResourceBundle;

/**
 * Controller for BookingForm.fxml.
 * Manages the 3-step booking form exactly like useBookingForm.js.
 *
 * BUILDER PATTERN:
 *   - A BookingBuilder instance is maintained throughout the form lifecycle
 *   - Each step adds data to the builder:
 *       Step 1 → roomId, date, time, purpose, capacity
 *       Step 2 → responsibleName, responsibleJob, responsibleMobile
 *       Step 3 → reqMic, reqLaptop, reqVideoConf, reqOther
 *   - On final submit → builder.build() creates the complete Booking object
 *
 * PROTOTYPE PATTERN (consumed here):
 *   - When called with a prefilled Booking (from cloneWithSuggestions),
 *     we initialize the BookingBuilder via builder.fromPrototype(prefilled)
 *     so all fields are pre-populated.
 */
public class BookingFormController implements Initializable {

    // ── Step containers (shown/hidden based on current step) ─────────────
    @FXML private VBox step1Pane;
    @FXML private VBox step2Pane;
    @FXML private VBox step3Pane;

    // ── Step indicators ───────────────────────────────────────────────────
    @FXML private Label step1Indicator;
    @FXML private Label step2Indicator;
    @FXML private Label step3Indicator;

    // ── Step 1 fields ─────────────────────────────────────────────────────
    @FXML private Button btnCategoryLecture;
    @FXML private Button btnCategoryMulti;
    @FXML private DatePicker datePicker;
    @FXML private ComboBox<TimeSlot> slotComboBox;       // for lecture rooms
    @FXML private ComboBox<String>   timeFromCombo;      // for multi rooms
    @FXML private ComboBox<String>   timeToCombo;        // for multi rooms
    @FXML private TextArea purposeField;
    @FXML private TextField capacityField;
    @FXML private Label leadTimeErrorLabel;
    @FXML private HBox slotBox;     // shown for lecture
    @FXML private HBox multiTimeBox; // shown for multi

    // ── Step 2 fields ─────────────────────────────────────────────────────
    @FXML private TextField respNameField;
    @FXML private TextField respJobField;
    @FXML private TextField respMobileField;

    // ── Step 3 fields ─────────────────────────────────────────────────────
    @FXML private CheckBox reqLaptopCheck;
    @FXML private CheckBox reqVideoConfCheck;
    @FXML private CheckBox reqMicCheck;
    @FXML private Spinner<Integer> reqMicQtySpinner;
    @FXML private HBox micQtyRow;
    @FXML private CheckBox reqOtherCheck;
    @FXML private TextArea reqOtherDetailsField;
    @FXML private VBox reqOtherDetailsRow;

    // ── Navigation buttons ────────────────────────────────────────────────
    @FXML private Button prevButton;
    @FXML private Button nextButton;
    @FXML private Label formNoticeLabel;
    @FXML private Label formTitleLabel;

    // ── State ─────────────────────────────────────────────────────────────
    private int currentStep = 1;
    private BookingBuilder bookingBuilder;
    private String selectedHallCategory = ""; // "lecture" or "multi"
    private List<Room> allRooms;
    private boolean isRamadanMode = false;
    private ListenerRegistration ramadanListener;
    private EmployeeDashboardController shellController;

    @Override
    public void initialize(URL url, ResourceBundle rb) {
        // Setup mic qty spinner
        if (reqMicQtySpinner != null) {
            reqMicQtySpinner.setValueFactory(
                new SpinnerValueFactory.IntegerSpinnerValueFactory(1, 10, 1));
        }

        // Toggle mic qty row visibility
        if (reqMicCheck != null) {
            reqMicCheck.selectedProperty().addListener((obs, old, val) -> {
                if (micQtyRow != null) micQtyRow.setVisible(val);
            });
        }

        // Toggle other details field visibility
        if (reqOtherCheck != null) {
            reqOtherCheck.selectedProperty().addListener((obs, old, val) -> {
                if (reqOtherDetailsRow != null) reqOtherDetailsRow.setVisible(val);
            });
        }

        // Show notice based on role
        setupRoleNotice();
        resetForm(null);
    }

    public void setShellController(EmployeeDashboardController shell) {
        this.shellController = shell;
    }

    /**
     * Resets the form to step 1.
     * If prefilled != null → uses Prototype clone (fromPrototype) to pre-fill builder.
     * If prefilled == null → fresh form.
     */
    public void resetForm(Booking prefilled) {
        currentStep = 1;
        bookingBuilder = new BookingBuilder();

        // Pre-fill user metadata from session
        var user = SessionManager.getInstance().getCurrentUser();
        if (user != null) {
            bookingBuilder.userId(user.getUid())
                          .userName(user.getDisplayName() != null ? user.getDisplayName() : "")
                          .userRole(user.getRole())
                          .college(user.getCollegeName());
        }

        // PROTOTYPE PATTERN: if a cloned booking is provided, pre-fill the form
        if (prefilled != null) {
            bookingBuilder.fromPrototype(prefilled);
            prefillUIFromPrototype(prefilled);
        } else {
            clearAllFields();
        }

        updateStepUI();
    }

    // ── Step 1 handlers (Room category selection) ─────────────────────────

    @FXML
    private void selectLectureCategory() {
        selectedHallCategory = "lecture";
        bookingBuilder.hallCategory("lecture").roomType("fixed");
        btnCategoryLecture.getStyleClass().add("category-active");
        btnCategoryMulti.getStyleClass().remove("category-active");
        updateTimeSelection();
    }

    @FXML
    private void selectMultiCategory() {
        selectedHallCategory = "multi";
        bookingBuilder.hallCategory("multi").roomType("multi");
        btnCategoryMulti.getStyleClass().add("category-active");
        btnCategoryLecture.getStyleClass().remove("category-active");
        updateTimeSelection();
    }

    private void updateTimeSelection() {
        boolean isMulti = "multi".equals(selectedHallCategory);
        if (slotBox != null) slotBox.setVisible(!isMulti);
        if (multiTimeBox != null) multiTimeBox.setVisible(isMulti);
        if (!isMulti) updateSlotOptions();
        else setupHourOptions();
    }

    private void updateSlotOptions() {
        if (slotComboBox == null) return;
        slotComboBox.getItems().clear();
        List<TimeSlot> slots = isRamadanMode ? TimeSlot.RAMADAN_SLOTS : TimeSlot.REGULAR_SLOTS;
        slotComboBox.getItems().addAll(slots);
    }

    private void setupHourOptions() {
        if (timeFromCombo == null || timeToCombo == null) return;
        timeFromCombo.getItems().clear();
        timeToCombo.getItems().clear();
        for (String h : TimeSlot.HOUR_OPTIONS) {
            timeFromCombo.getItems().add(h);
            timeToCombo.getItems().add(h);
        }
        // Show 12h labels in ComboBox
        javafx.util.StringConverter<String> conv = new javafx.util.StringConverter<>() {
            @Override public String toString(String v) { return v == null ? "" : TimeSlot.to12h(v); }
            @Override public String fromString(String s) { return s; }
        };
        timeFromCombo.setConverter(conv);
        timeToCombo.setConverter(conv);
    }

    @FXML
    private void onDateChanged() {
        checkLeadTimeError();
    }

    @FXML
    private void onTimeFromChanged() {
        checkLeadTimeError();
    }

    /** Mirrors checkLeadTimeError() in useBookingForm.js */
    private void checkLeadTimeError() {
        if (datePicker == null || datePicker.getValue() == null) return;
        var user = SessionManager.getInstance().getCurrentUser();
        if (user == null) return;

        String timeFrom = null;
        if ("lecture".equals(selectedHallCategory) && slotComboBox != null
                && slotComboBox.getValue() != null) {
            timeFrom = slotComboBox.getValue().getFrom();
        } else if (timeFromCombo != null && timeFromCombo.getValue() != null) {
            timeFrom = timeFromCombo.getValue();
        }

        if (timeFrom == null) return;

        LocalDate date = datePicker.getValue();
        String[] parts = timeFrom.split(":");
        LocalDateTime selectedDT = date.atTime(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
        LocalDateTime now = LocalDateTime.now();
        long diffHours = java.time.Duration.between(now, selectedDT).toHours();

        int requiredHours = "secretary".equals(user.getRole()) ? 48 : 24;
        boolean isError = diffHours < requiredHours;

        if (leadTimeErrorLabel != null) {
            leadTimeErrorLabel.setVisible(isError);
            leadTimeErrorLabel.setText(
                "⚠️ يجب أن يكون الحجز قبل الموعد بـ " + requiredHours + " ساعة على الأقل."
            );
        }
    }

    private void setupRoleNotice() {
        if (formNoticeLabel == null) return;
        var user = SessionManager.getInstance().getCurrentUser();
        if (user == null) return;
        String notice = switch (user.getRole() != null ? user.getRole() : "") {
            case "secretary"  -> "ملاحظة: لا يمكن حجز موعد أقل من 48 ساعة ويُسمح فقط بالقاعات متعددة الأغراض.";
            case "admin"      -> "ملاحظة: يمكن حجز القاعات متعددة الأغراض فقط، وسيتم تحويل الطلب لمدير الفرع مباشرة.";
            default           -> "ملاحظة: لا يمكن حجز موعد أقل من 24 ساعة من الآن.";
        };
        formNoticeLabel.setText(notice);
    }

    // ── Step Navigation ───────────────────────────────────────────────────

    @FXML
    private void handleNext() {
        if (!validateCurrentStep()) return;
        collectCurrentStepData();
        if (currentStep < 3) {
            currentStep++;
            updateStepUI();
        } else {
            handleSubmit();
        }
    }

    @FXML
    private void handlePrev() {
        if (currentStep > 1) {
            currentStep--;
            updateStepUI();
        }
    }

    /** Mirrors validateStep1, validateStep2, validateStep3 in useBookingForm.js */
    private boolean validateCurrentStep() {
        return switch (currentStep) {
            case 1 -> validateStep1();
            case 2 -> validateStep2();
            case 3 -> validateStep3();
            default -> true;
        };
    }

    private boolean validateStep1() {
        if (selectedHallCategory.isEmpty()) {
            showAlert("يرجى اختيار نوع القاعة أولاً", Alert.AlertType.WARNING);
            return false;
        }
        if (datePicker == null || datePicker.getValue() == null) {
            showAlert("يرجى اختيار تاريخ الحجز", Alert.AlertType.WARNING);
            return false;
        }
        if (purposeField == null || purposeField.getText().trim().isEmpty()) {
            showAlert("يرجى كتابة الغرض من الاستخدام", Alert.AlertType.WARNING);
            return false;
        }
        if (capacityField == null || capacityField.getText().trim().isEmpty()) {
            showAlert("يرجى إدخال السعة المطلوبة", Alert.AlertType.WARNING);
            return false;
        }
        if (leadTimeErrorLabel != null && leadTimeErrorLabel.isVisible()) {
            showAlert("الوقت المختار لا يستوفي الحد الأدنى المطلوب للحجز", Alert.AlertType.WARNING);
            return false;
        }
        return true;
    }

    private boolean validateStep2() {
        if (respNameField == null || respNameField.getText().trim().isEmpty() ||
            respJobField == null  || respJobField.getText().trim().isEmpty()  ||
            respMobileField == null || respMobileField.getText().trim().isEmpty()) {
            showAlert("يرجى تعبئة جميع بيانات المسؤول", Alert.AlertType.WARNING);
            return false;
        }
        if (!respMobileField.getText().matches("[0-9]+")) {
            showAlert("رقم المحمول يجب أن يحتوي على أرقام فقط", Alert.AlertType.WARNING);
            return false;
        }
        if (respNameField.getText().matches(".*[0-9].*")) {
            showAlert("الاسم لا يجب أن يحتوي على أرقام", Alert.AlertType.WARNING);
            return false;
        }
        return true;
    }

    private boolean validateStep3() {
        if (reqOtherCheck != null && reqOtherCheck.isSelected() &&
            (reqOtherDetailsField == null || reqOtherDetailsField.getText().trim().isEmpty())) {
            showAlert("يرجى كتابة تفاصيل المتطلبات الأخرى", Alert.AlertType.WARNING);
            return false;
        }
        return true;
    }

    /** Collects data from current step into the BookingBuilder */
    private void collectCurrentStepData() {
        switch (currentStep) {
            case 1 -> {
                bookingBuilder.hallCategory(selectedHallCategory)
                              .roomType("lecture".equals(selectedHallCategory) ? "fixed" : "multi");
                if (datePicker != null && datePicker.getValue() != null) {
                    bookingBuilder.date(datePicker.getValue().format(DateTimeFormatter.ISO_DATE));
                }
                // Time
                if ("lecture".equals(selectedHallCategory) && slotComboBox != null
                        && slotComboBox.getValue() != null) {
                    TimeSlot slot = slotComboBox.getValue();
                    bookingBuilder.timeFrom(slot.getFrom()).timeTo(slot.getTo());
                } else if (timeFromCombo != null && timeToCombo != null) {
                    bookingBuilder.timeFrom(timeFromCombo.getValue() != null ? timeFromCombo.getValue() : "")
                                  .timeTo(timeToCombo.getValue() != null ? timeToCombo.getValue() : "");
                }
                if (purposeField != null) bookingBuilder.purpose(purposeField.getText().trim());
                if (capacityField != null) {
                    try { bookingBuilder.requiredCapacity(Integer.parseInt(capacityField.getText().trim())); }
                    catch (NumberFormatException ignored) {}
                }
            }
            case 2 -> {
                if (respNameField != null)   bookingBuilder.responsibleName(respNameField.getText().trim());
                if (respJobField != null)    bookingBuilder.responsibleJob(respJobField.getText().trim());
                if (respMobileField != null) bookingBuilder.responsibleMobile(respMobileField.getText().trim());
            }
            case 3 -> {
                boolean mic  = reqMicCheck != null && reqMicCheck.isSelected();
                int micQty   = reqMicQtySpinner != null ? reqMicQtySpinner.getValue() : 1;
                bookingBuilder.reqMic(mic, micQty)
                              .reqLaptop(reqLaptopCheck != null && reqLaptopCheck.isSelected())
                              .reqVideoConf(reqVideoConfCheck != null && reqVideoConfCheck.isSelected());
                boolean other  = reqOtherCheck != null && reqOtherCheck.isSelected();
                String details = reqOtherDetailsField != null ? reqOtherDetailsField.getText().trim() : "";
                bookingBuilder.reqOther(other, details);
            }
        }
    }

    /** Final submission: builds the Booking via Builder, then submits to Firestore */
    private void handleSubmit() {
        collectCurrentStepData(); // collect step 3 data

        Booking booking;
        try {
            booking = bookingBuilder.build(); // BUILDER PATTERN: build() validates + returns Booking
        } catch (IllegalStateException e) {
            showAlert("يرجى التأكد من تعبئة جميع الحقول بشكل صحيح: " + e.getMessage(),
                      Alert.AlertType.WARNING);
            return;
        }

        nextButton.setDisable(true);
        nextButton.setText("جاري الإرسال...");

        BookingService.submitBooking(
            booking,
            () -> {
                nextButton.setDisable(false);
                nextButton.setText("التالي");
                showAlert("تم إرسال الطلب بنجاح وهو الآن بانتظار الموافقة ✓", Alert.AlertType.INFORMATION);
                if (shellController != null) shellController.showDashboard();
            },
            err -> {
                nextButton.setDisable(false);
                nextButton.setText("التالي");
                showAlert("حدث خطأ أثناء إرسال الطلب: " + err.getMessage(), Alert.AlertType.ERROR);
            }
        );
    }

    private void updateStepUI() {
        // Show/hide step panes
        if (step1Pane != null) step1Pane.setVisible(currentStep == 1);
        if (step2Pane != null) step2Pane.setVisible(currentStep == 2);
        if (step3Pane != null) step3Pane.setVisible(currentStep == 3);

        // Update step indicators
        updateStepIndicator(step1Indicator, 1);
        updateStepIndicator(step2Indicator, 2);
        updateStepIndicator(step3Indicator, 3);

        // Prev/Next button states
        if (prevButton != null) prevButton.setVisible(currentStep > 1);
        if (nextButton != null) {
            nextButton.setText(currentStep == 3 ? "تأكيد وإرسال الطلب ✓" : "التالي ←");
        }
    }

    private void updateStepIndicator(Label indicator, int step) {
        if (indicator == null) return;
        if (step < currentStep) {
            indicator.getStyleClass().setAll("step-indicator", "step-done");
            indicator.setText("✓");
        } else if (step == currentStep) {
            indicator.getStyleClass().setAll("step-indicator", "step-active");
            indicator.setText(String.valueOf(step));
        } else {
            indicator.getStyleClass().setAll("step-indicator", "step-inactive");
            indicator.setText(String.valueOf(step));
        }
    }

    /** Pre-fills UI fields when form is opened with a Prototype clone */
    private void prefillUIFromPrototype(Booking prefilled) {
        if (datePicker != null && prefilled.getDate() != null) {
            try {
                datePicker.setValue(LocalDate.parse(prefilled.getDate()));
            } catch (Exception ignored) {}
        }
        if (purposeField != null && prefilled.getPurpose() != null) {
            purposeField.setText(prefilled.getPurpose());
        }
        if (capacityField != null && prefilled.getRequiredCapacity() > 0) {
            capacityField.setText(String.valueOf(prefilled.getRequiredCapacity()));
        }
        if (respNameField != null && prefilled.getResponsibleName() != null) {
            respNameField.setText(prefilled.getResponsibleName());
        }
        if (respJobField != null && prefilled.getResponsibleJob() != null) {
            respJobField.setText(prefilled.getResponsibleJob());
        }
        if (respMobileField != null && prefilled.getResponsibleMobile() != null) {
            respMobileField.setText(prefilled.getResponsibleMobile());
        }
        // Set hall category
        if (prefilled.getHallCategory() != null) {
            if ("multi".equals(prefilled.getHallCategory())) selectMultiCategory();
            else selectLectureCategory();
        }
    }

    private void clearAllFields() {
        if (datePicker != null) datePicker.setValue(null);
        if (purposeField != null) purposeField.clear();
        if (capacityField != null) capacityField.clear();
        if (respNameField != null) respNameField.clear();
        if (respJobField != null) respJobField.clear();
        if (respMobileField != null) respMobileField.clear();
        if (reqLaptopCheck != null) reqLaptopCheck.setSelected(false);
        if (reqVideoConfCheck != null) reqVideoConfCheck.setSelected(false);
        if (reqMicCheck != null) reqMicCheck.setSelected(false);
        if (reqOtherCheck != null) reqOtherCheck.setSelected(false);
        if (reqOtherDetailsField != null) reqOtherDetailsField.clear();
        selectedHallCategory = "";
        if (btnCategoryLecture != null) btnCategoryLecture.getStyleClass().remove("category-active");
        if (btnCategoryMulti != null) btnCategoryMulti.getStyleClass().remove("category-active");
    }

    private void showAlert(String message, Alert.AlertType type) {
        Platform.runLater(() -> {
            Alert alert = new Alert(type);
            alert.setHeaderText(null);
            alert.setContentText(message);
            alert.showAndWait();
        });
    }
}
