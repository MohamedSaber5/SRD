package com.aast.booking.admin;

import com.aast.booking.core.SessionManager;
import com.aast.booking.models.Booking;
import com.aast.booking.patterns.builder.BookingBuilder;
import com.aast.booking.services.BookingService;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.Alert.AlertType;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

/**
 * AdminBookingFormController
 * Handles the "New Booking" 3-step wizard for Admins.
 * 
 * DESIGN PATTERNS:
 * 1. BUILDER: Uses BookingBuilder to construct the Booking object.
 * 2. MEMENTO: Uses AdminBookingCaretaker and AdminBookingMemento to save/restore form state.
 * 3. DECORATOR: Uses AdminBookingDecorator to add optional traits to the booking.
 * 4. PROTOTYPE: Can clone an existing booking using Booking.clone().
 */
public class AdminBookingFormController {

    // Step 1: Basics
    @FXML private VBox step1Pane;
    @FXML private Button btnCategoryLecture, btnCategoryMulti;
    @FXML private DatePicker datePicker;
    @FXML private HBox slotBox, multiTimeBox;
    @FXML private ComboBox<String> slotComboBox, timeFromCombo, timeToCombo;
    @FXML private TextArea purposeField;
    @FXML private TextField capacityField;
    @FXML private Label leadTimeErrorLabel;

    // Step 2: Responsible Person
    @FXML private VBox step2Pane;
    @FXML private TextField respNameField, respJobField, respMobileField;

    // Step 3: Requirements & Decorators
    @FXML private VBox step3Pane;
    @FXML private CheckBox cbOfficial, cbHoliday, reqLaptopCheck, reqVideoConfCheck, reqMicCheck, reqOtherCheck;
    @FXML private HBox micQtyRow;
    @FXML private Spinner<Integer> reqMicQtySpinner;
    @FXML private VBox reqOtherDetailsRow;
    @FXML private TextArea reqOtherDetailsField;

    // Navigation
    @FXML private Label pageTitle;
    @FXML private Button prevButton, nextButton;
    @FXML private Label step1Indicator, step2Indicator, step3Indicator;
    @FXML private javafx.scene.layout.StackPane step1IndicatorCircle, step2IndicatorCircle, step3IndicatorCircle;

    private int currentStep = 1;
    private String selectedCategory = "lecture"; // default

    // Pattern-related
    private AdminBookingCaretaker caretaker = new AdminBookingCaretaker();
    private Booking lastBooking; // For Prototype cloning

    @FXML
    public void initialize() {
        setupTimeCombos();
        setupRequirementsLogic();
        refreshStepUI();
        
        // Default category selection
        selectLectureCategory();
    }

    private void setupTimeCombos() {
        List<String> slots = Arrays.asList("الفترة الأولى (8:30 - 10:00)", "الفترة الثانية (10:15 - 11:45)", 
                                         "الفترة الثالثة (12:00 - 1:30)", "الفترة الرابعة (1:45 - 3:15)");
        slotComboBox.setItems(FXCollections.observableArrayList(slots));

        List<String> hours = Arrays.asList("08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00");
        timeFromCombo.setItems(FXCollections.observableArrayList(hours));
        timeToCombo.setItems(FXCollections.observableArrayList(hours));
    }

    private void setupRequirementsLogic() {
        reqMicCheck.selectedProperty().addListener((obs, old, val) -> {
            micQtyRow.setVisible(val);
            micQtyRow.setManaged(val);
        });
        reqOtherCheck.selectedProperty().addListener((obs, old, val) -> {
            reqOtherDetailsRow.setVisible(val);
            reqOtherDetailsRow.setManaged(val);
        });
        
        reqMicQtySpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(1, 10, 1));
    }

    // --- NAVIGATION LOGIC ---

    @FXML
    private void handleNext() {
        if (validateCurrentStep()) {
            if (currentStep < 3) {
                saveStateToMemento();
                currentStep++;
                refreshStepUI();
            } else {
                submitForm();
            }
        }
    }

    private boolean validateCurrentStep() {
        List<String> missingFields = new java.util.ArrayList<>();

        if (currentStep == 1) {
            if (datePicker.getValue() == null) missingFields.add("تاريخ الفعالية");
            if (selectedCategory.equals("lecture")) {
                if (slotComboBox.getValue() == null) missingFields.add("الفترة الزمنية");
            } else {
                if (timeFromCombo.getValue() == null || timeToCombo.getValue() == null) missingFields.add("الفترة الزمنية (من/إلى)");
            }
            if (purposeField.getText().trim().isEmpty()) missingFields.add("الغرض من الاستخدام");
            if (capacityField.getText().trim().isEmpty()) missingFields.add("السعة المطلوبة");
        } 
        else if (currentStep == 2) {
            if (respNameField.getText().trim().isEmpty()) missingFields.add("اسم المسؤول");
            if (respJobField.getText().trim().isEmpty()) missingFields.add("المسمى الوظيفي");
            if (respMobileField.getText().trim().isEmpty()) missingFields.add("رقم المحمول");
        }

        if (!missingFields.isEmpty()) {
            String msg = "يرجى تعبئة الحقول التالية قبل الانتقال:\n- " + String.join("\n- ", missingFields);
            showAlert(msg, AlertType.WARNING);
            return false;
        }
        return true;
    }

    @FXML
    private void handlePrev() {
        if (currentStep > 1) {
            currentStep--;
            refreshStepUI();
        }
    }

    private void refreshStepUI() {
        step1Pane.setVisible(currentStep == 1);
        step1Pane.setManaged(currentStep == 1);
        
        step2Pane.setVisible(currentStep == 2);
        step2Pane.setManaged(currentStep == 2);
        
        step3Pane.setVisible(currentStep == 3);
        step3Pane.setManaged(currentStep == 3);

        // Update Indicators (Secretary Style)
        updateIndicator(step1IndicatorCircle, step1Indicator, currentStep >= 1);
        updateIndicator(step2IndicatorCircle, step2Indicator, currentStep >= 2);
        updateIndicator(step3IndicatorCircle, step3Indicator, currentStep >= 3);
    }

    private void updateIndicator(javafx.scene.layout.StackPane circle, Label label, boolean active) {
        circle.getStyleClass().removeAll("step-circle-active", "step-circle-inactive");
        label.getStyleClass().removeAll("step-num-active", "step-num-inactive");
        
        if (active) {
            circle.getStyleClass().add("step-circle-active");
            label.getStyleClass().add("step-num-active");
        } else {
            circle.getStyleClass().add("step-circle-inactive");
            label.getStyleClass().add("step-num-inactive");
        }
    }

    // --- CATEGORY SELECTION ---

    @FXML
    private void selectLectureCategory() {
        selectedCategory = "lecture";
        btnCategoryLecture.getStyleClass().add("toggle-active");
        btnCategoryMulti.getStyleClass().remove("toggle-active");
        slotBox.setVisible(true);
        multiTimeBox.setVisible(false);
    }

    @FXML
    private void selectMultiCategory() {
        selectedCategory = "multi";
        btnCategoryMulti.getStyleClass().add("toggle-active");
        btnCategoryLecture.getStyleClass().remove("toggle-active");
        slotBox.setVisible(false);
        multiTimeBox.setVisible(true);
    }

    @FXML private void onDateChanged() {}
    @FXML private void onTimeFromChanged() {}

    // --- MEMENTO PATTERN: UNDO / RESET ---

    @FXML
    private void handleUndo() {
        AdminBookingMemento memento = caretaker.undo();
        if (memento != null) {
            restoreFromMemento(memento);
            showAlert("تم استعادة الحالة السابقة للنموذج.", AlertType.INFORMATION);
        } else {
            showAlert("لا توجد حالات سابقة محفوظة.", AlertType.WARNING);
        }
    }

    @FXML
    private void handleReset() {
        datePicker.setValue(null);
        slotComboBox.setValue(null);
        timeFromCombo.setValue(null);
        timeToCombo.setValue(null);
        purposeField.clear();
        capacityField.clear();
        respNameField.clear();
        respJobField.clear();
        respMobileField.clear();
        cbOfficial.setSelected(false);
        cbHoliday.setSelected(false);
        reqLaptopCheck.setSelected(false);
        reqVideoConfCheck.setSelected(false);
        reqMicCheck.setSelected(false);
        reqOtherCheck.setSelected(false);
        caretaker.clear();
        showAlert("تم مسح كافة البيانات في النموذج.", AlertType.INFORMATION);
    }

    private void saveStateToMemento() {
        AdminBookingMemento memento = new AdminBookingMemento(
            selectedCategory,
            datePicker.getValue() != null ? datePicker.getValue().toString() : "",
            selectedCategory.equals("lecture") ? slotComboBox.getValue() : timeFromCombo.getValue(),
            selectedCategory.equals("lecture") ? "" : timeToCombo.getValue(),
            purposeField.getText(),
            capacityField.getText(),
            respNameField.getText(),
            respJobField.getText(),
            respMobileField.getText(),
            reqMicCheck.isSelected(),
            reqMicQtySpinner.getValue(),
            reqLaptopCheck.isSelected(),
            reqVideoConfCheck.isSelected(),
            reqOtherCheck.isSelected(),
            reqOtherDetailsField.getText()
        );
        caretaker.save(memento);
    }

    private void restoreFromMemento(AdminBookingMemento m) {
        if (m.getHallCategory().equals("lecture")) selectLectureCategory(); else selectMultiCategory();
        if (!m.getDate().isEmpty()) datePicker.setValue(LocalDate.parse(m.getDate()));
        if (m.getHallCategory().equals("lecture")) slotComboBox.setValue(m.getTimeFrom());
        else {
            timeFromCombo.setValue(m.getTimeFrom());
            timeToCombo.setValue(m.getTimeTo());
        }
        purposeField.setText(m.getPurpose());
        capacityField.setText(m.getCapacity());
        respNameField.setText(m.getRespName());
        respJobField.setText(m.getRespJob());
        respMobileField.setText(m.getRespMobile());
        reqMicCheck.setSelected(m.isReqMic());
        reqMicQtySpinner.getValueFactory().setValue(m.getReqMicQty());
        reqLaptopCheck.setSelected(m.isReqLaptop());
        reqVideoConfCheck.setSelected(m.isReqVideoConf());
        reqOtherCheck.setSelected(m.isReqOther());
        reqOtherDetailsField.setText(m.getReqOtherDetails());
    }

    // --- FORM SUBMISSION (BUILDER + DECORATOR + PROTOTYPE) ---

    private void submitForm() {
        try {
            // 1. BUILDER PATTERN
            BookingBuilder builder = new BookingBuilder()
                .userRole("admin")
                .userId(SessionManager.getInstance().getCurrentUser().getUid())
                .userName(SessionManager.getInstance().getCurrentUser().getDisplayName())
                .hallCategory(selectedCategory)
                .date(datePicker.getValue().toString())
                .purpose(purposeField.getText())
                .requiredCapacity(Integer.parseInt(capacityField.getText()))
                .responsibleName(respNameField.getText())
                .responsibleJob(respJobField.getText())
                .responsibleMobile(respMobileField.getText())
                .reqLaptop(reqLaptopCheck.isSelected())
                .reqVideoConf(reqVideoConfCheck.isSelected());

            if (selectedCategory.equals("lecture")) {
                builder.timeFrom(slotComboBox.getValue());
            } else {
                builder.timeFrom(timeFromCombo.getValue()).timeTo(timeToCombo.getValue());
            }

            Booking booking = builder.build();

            // 2. DECORATOR PATTERN
            if (cbOfficial.isSelected()) {
                new AdminOfficialDecorator(booking).decorate();
            }
            if (cbHoliday.isSelected()) {
                new AdminHolidayDecorator(booking).decorate();
            }

            // 3. SUBMIT (Facade)
            BookingService.submitBooking(booking, () -> {
                showAlert("تم إرسال طلب الحجز بنجاح.", AlertType.INFORMATION);
                lastBooking = booking; // Save for PROTOTYPE cloning if needed
                handleReset();
                currentStep = 1;
                refreshStepUI();
            }, e -> showAlert("فشل في إرسال الطلب: " + e.getMessage(), AlertType.ERROR));

        } catch (Exception e) {
            showAlert("يرجى التأكد من ملء جميع الحقول بشكل صحيح: " + e.getMessage(), AlertType.ERROR);
        }
    }

    private void showAlert(String message, AlertType type) {
        Platform.runLater(() -> {
            Alert alert = new Alert(type);
            alert.setHeaderText(null);
            alert.setContentText(message);
            alert.showAndWait();
        });
    }

    /**
     * PROTOTYPE PATTERN: Clone last booking to pre-fill form.
     */
    @FXML
    public void cloneLastBooking() {
        if (lastBooking == null) {
            showAlert("لا يوجد حجز سابق لتكراره.", AlertType.WARNING);
            return;
        }
        Booking cloned = lastBooking.clone();
        
        // Category
        if (cloned.getHallCategory().equals("lecture")) selectLectureCategory(); 
        else selectMultiCategory();

        // Details
        purposeField.setText(cloned.getPurpose());
        capacityField.setText(String.valueOf(cloned.getRequiredCapacity()));
        respNameField.setText(cloned.getResponsibleName());
        respJobField.setText(cloned.getResponsibleJob());
        respMobileField.setText(cloned.getResponsibleMobile());
        
        showAlert("تم ملء البيانات من الحجز السابق بنجاح.", AlertType.INFORMATION);
    }
}
