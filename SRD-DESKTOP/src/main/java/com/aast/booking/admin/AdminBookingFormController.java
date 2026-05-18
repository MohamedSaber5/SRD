package com.aast.booking.admin;

import com.aast.booking.core.SessionManager;
import com.aast.booking.models.Booking;
import com.aast.booking.patterns.builder.BookingBuilder;
import com.aast.booking.services.BookingService;
import com.aast.booking.services.RoomService;
import com.aast.booking.models.Room;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.Alert.AlertType;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.util.StringConverter;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

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
    @FXML private ComboBox<Room> roomComboBox;
    @FXML private DatePicker datePicker;
    @FXML private HBox multiTimeBox;
    @FXML private ComboBox<String> timeFromCombo, timeToCombo;
    @FXML private TextArea purposeField;
    @FXML private TextField capacityField;
    private Label leadTimeErrorLabel; // not present in admin FXML

    // Step 2: Responsible Person
    @FXML private VBox step2Pane;
    @FXML private TextField respNameField, respJobField, respMobileField;

    // Step 3: Requirements
    @FXML private VBox step3Pane;
    @FXML private CheckBox reqLaptopCheck, reqVideoConfCheck, reqMicCheck, reqOtherCheck;
    @FXML private HBox micQtyRow;
    @FXML private Spinner<Integer> reqMicQtySpinner;
    @FXML private VBox reqOtherDetailsRow;
    @FXML private TextArea reqOtherDetailsField;

    // Navigation
    @FXML private Label pageTitle;
    @FXML private Button prevButton, nextButton;
    @FXML private Label step1Indicator, step2Indicator, step3Indicator;
    @FXML private javafx.scene.layout.StackPane step1IndicatorCircle, step2IndicatorCircle, step3IndicatorCircle;

    @FXML private CheckBox chkUrgentBooking;

    private int currentStep = 1;
    private String selectedCategory = "multi"; // Admin: multi-purpose only

    // Pattern-related
    private AdminBookingCaretaker caretaker = new AdminBookingCaretaker();
    private Booking lastBooking; // For Prototype cloning

    // STRATEGY PATTERN (Prompt 10): availability context for time slot switching
    private final com.aast.booking.patterns.strategy.AvailabilityContext availabilityContext =
        new com.aast.booking.patterns.strategy.AvailabilityContext();

    @FXML
    public void initialize() {
        setupTimeCombos();
        setupRoomComboBox();
        setupRequirementsLogic();
        refreshStepUI();
        selectMultiCategory();

        // STRATEGY PATTERN (Prompt 10): fetch Ramadan mode and apply strategy
        com.aast.booking.patterns.facade.SystemFacade.getInstance().fetchRamadanMode(isRamadan -> {
            availabilityContext.setStrategy(isRamadan);
            refreshTimeSlots();
        });
    }

    private void setupRoomComboBox() {
        roomComboBox.setConverter(new StringConverter<Room>() {
            @Override
            public String toString(Room r) {
                if (r == null) return "يرجى اختيار قاعة...";
                return r.getRoomNumber() + " (سعة: " + r.getCapacity() + ")";
            }

            @Override
            public Room fromString(String string) {
                return null;
            }
        });

        RoomService.fetchRooms(rooms -> {
            List<Room> multiRooms = rooms.stream()
                .filter(r -> "multi".equals(r.getType()))
                .collect(Collectors.toList());
            roomComboBox.setItems(FXCollections.observableArrayList(multiRooms));
        }, e -> showAlert("فشل في تحميل القاعات: " + e.getMessage(), AlertType.ERROR));
    }

    private void setupTimeCombos() {
        // Initial population using the default strategy (Normal mode)
        refreshTimeSlots();
    }

    /** Rebuilds time ComboBoxes from the active AvailabilityContext strategy. */
    private void refreshTimeSlots() {
        java.util.List<String> slots = availabilityContext.getSlots();
        if (timeFromCombo != null) timeFromCombo.setItems(FXCollections.observableArrayList(slots));
        if (timeToCombo   != null) timeToCombo.setItems(FXCollections.observableArrayList(slots));
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
            if (roomComboBox.getValue() == null) missingFields.add("القاعة المطلوبة");
            if (datePicker.getValue() == null) missingFields.add("تاريخ الفعالية");
            
            if (timeFromCombo.getValue() == null || timeToCombo.getValue() == null) {
                missingFields.add("الفترة الزمنية (من/إلى)");
            } else {
                int fromMin = parseTimeToMinutes(timeFromCombo.getValue());
                int toMin   = parseTimeToMinutes(timeToCombo.getValue());
                if (fromMin >= 0 && toMin >= 0 && toMin <= fromMin) {
                    missingFields.add("وقت النهاية يجب أن يكون بعد وقت البداية");
                }
            }
            if (purposeField.getText().trim().isEmpty()) missingFields.add("الغرض من الاستخدام");
            
            String capacity = capacityField.getText().trim();
            if (capacity.isEmpty()) {
                missingFields.add("السعة المطلوبة");
            } else {
                try {
                    int cap = Integer.parseInt(capacity);
                    if (cap <= 0) missingFields.add("السعة يجب أن تكون رقماً أكبر من الصفر");
                } catch (NumberFormatException e) {
                    missingFields.add("السعة يجب أن تكون رقماً صحيحاً");
                }
            }
        } 
        else if (currentStep == 2) {
            String name = respNameField.getText().trim();
            String job = respJobField.getText().trim();
            String mobile = respMobileField.getText().trim();
            
            if (name.isEmpty()) {
                missingFields.add("اسم المسؤول");
            } else if (name.matches(".*\\d.*")) {
                missingFields.add("اسم المسؤول يجب ألا يحتوي على أرقام");
            }
            
            if (job.isEmpty()) {
                missingFields.add("المسمى الوظيفي");
            } else if (!job.matches(".*[a-zA-Z\\u0600-\\u06FF].*")) {
                missingFields.add("المسمى الوظيفي يجب أن يحتوي على حروف");
            }
            
            if (mobile.isEmpty()) {
                missingFields.add("رقم المحمول");
            } else if (!mobile.matches("^[0-9]+$")) {
                missingFields.add("رقم المحمول يجب أن يحتوي على أرقام فقط");
            }
        }
        else if (currentStep == 3) {
            if (reqOtherCheck.isSelected() && reqOtherDetailsField.getText().trim().isEmpty()) {
                missingFields.add("تفاصيل المتطلبات الأخرى (لأنك قمت بتحديدها)");
            }
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
        // Admin form is multi-only; lecture category no longer applicable
        selectMultiCategory();
    }

    @FXML
    private void selectMultiCategory() {
        selectedCategory = "multi";
        if (multiTimeBox != null) { multiTimeBox.setVisible(true); multiTimeBox.setManaged(true); }
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
        roomComboBox.setValue(null);
        datePicker.setValue(null);
        timeFromCombo.setValue(null);
        timeToCombo.setValue(null);
        purposeField.clear();
        capacityField.clear();
        respNameField.clear();
        respJobField.clear();
        respMobileField.clear();
        reqLaptopCheck.setSelected(false);
        reqVideoConfCheck.setSelected(false);
        reqMicCheck.setSelected(false);
        reqOtherCheck.setSelected(false);
        reqOtherDetailsField.clear();
        caretaker.clear();
        showAlert("تم مسح كافة البيانات في النموذج.", AlertType.INFORMATION);
    }

    private void saveStateToMemento() {
        String roomId = roomComboBox.getValue() != null ? roomComboBox.getValue().getId() : null;
        AdminBookingMemento memento = new AdminBookingMemento(
            roomId,
            "multi", // Admin is always multi-purpose
            datePicker.getValue() != null ? datePicker.getValue().toString() : "",
            timeFromCombo.getValue(),
            timeToCombo.getValue(),
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
        selectMultiCategory(); // Admin is always multi
        
        if (m.getRoomId() != null) {
            for (Room r : roomComboBox.getItems()) {
                if (r.getId().equals(m.getRoomId())) {
                    roomComboBox.setValue(r);
                    break;
                }
            }
        }
        
        if (!m.getDate().isEmpty()) datePicker.setValue(LocalDate.parse(m.getDate()));
        timeFromCombo.setValue(m.getTimeFrom());
        timeToCombo.setValue(m.getTimeTo());
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
            Booking booking;
            com.aast.booking.patterns.builder.IBookingBuilder builder = new BookingBuilder();
            String uId = SessionManager.getInstance().getCurrentUser().getUid();
            String uName = SessionManager.getInstance().getCurrentUser().getDisplayName();
            String d = datePicker.getValue().toString();
            String purp = purposeField.getText();
            int cap = 0;
            try { cap = Integer.parseInt(capacityField.getText()); } catch(Exception ignored) {}
            String rName = respNameField.getText();
            String rJob = respJobField.getText();
            String rMob = respMobileField.getText();
            boolean laptop = reqLaptopCheck.isSelected();
            boolean video = reqVideoConfCheck.isSelected();
            boolean mic = reqMicCheck.isSelected();
            int micQty = reqMicQtySpinner.getValue();
            boolean other = reqOtherCheck.isSelected();
            String otherDet = reqOtherDetailsField.getText();

            // Admin always submits multi-purpose hall requests
            com.aast.booking.patterns.builder.BookingDirector director = new com.aast.booking.patterns.builder.BookingDirector();
            String roomId = roomComboBox.getValue().getId();
            booking = director.buildAdminMultiPurposeRequest(
                builder, roomId, d, timeFromCombo.getValue(), timeToCombo.getValue(),
                purp, cap, rName, rJob, rMob, mic, micQty, laptop, video, other, otherDet,
                uId, uName
            );
            // Apply urgent flag if selected
            if (chkUrgentBooking != null && chkUrgentBooking.isSelected()) {
                booking.setUrgent(true);
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

    /**
     * Parses a time string in either "HH:mm" (24h) or "hh:mm a" (12h AM/PM) format
     * and returns total minutes since midnight, or -1 on failure.
     */
    private int parseTimeToMinutes(String time) {
        if (time == null || time.trim().isEmpty()) return -1;
        try {
            java.time.format.DateTimeFormatter fmt24 = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
            java.time.LocalTime t = java.time.LocalTime.parse(time.trim(), fmt24);
            return t.getHour() * 60 + t.getMinute();
        } catch (java.time.format.DateTimeParseException ignored) {}
        try {
            java.time.format.DateTimeFormatter fmt12 = java.time.format.DateTimeFormatter.ofPattern("hh:mm a");
            java.time.LocalTime t = java.time.LocalTime.parse(time.trim().toUpperCase(), fmt12);
            return t.getHour() * 60 + t.getMinute();
        } catch (java.time.format.DateTimeParseException ignored) {}
        return -1;
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
        // PROTOTYPE PATTERN (Prompt 4): use cloneForResubmit() via IBookingPrototype interface
        Booking cloned = lastBooking.cloneForResubmit();

        // Admin is always multi-purpose
        selectMultiCategory();

        if (cloned.getRoomId() != null) {
            for (Room r : roomComboBox.getItems()) {
                if (r.getId().equals(cloned.getRoomId())) {
                    roomComboBox.setValue(r);
                    break;
                }
            }
        }

        // Pre-fill form fields with cloned data
        purposeField.setText(cloned.getPurpose());
        capacityField.setText(String.valueOf(cloned.getRequiredCapacity()));
        respNameField.setText(cloned.getResponsibleName());
        respJobField.setText(cloned.getResponsibleJob());
        respMobileField.setText(cloned.getResponsibleMobile());

        showAlert("تم ملء البيانات من الحجز السابق بنجاح.", AlertType.INFORMATION);
    }
}
