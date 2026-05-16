package com.aast.booking.secretary;

import com.aast.booking.auth.AuthService;
import com.aast.booking.core.BaseDashboardController;
import com.aast.booking.core.FirebaseService;
import com.aast.booking.core.SessionManager;
import com.aast.booking.core.observer.BookingNotifierSubject;
import com.aast.booking.core.observer.NotificationObserver;
import com.aast.booking.models.BookingNotification;
import com.aast.booking.models.BookingRequest;
import com.aast.booking.secretary.form.*;
import com.aast.booking.secretary.notification.*;
import com.aast.booking.secretary.ui.CardFactory;
import com.aast.booking.secretary.ui.DashboardNavigationMediator;
import com.aast.booking.services.NotificationService;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

public class SecretaryDashboardController extends BaseDashboardController implements NotificationObserver {

    @FXML private StackPane mainContentArea;
    @FXML private VBox dashboardView;
    @FXML private javafx.scene.control.ScrollPane newBookingView;
    private Node notificationsNode;
    
    @FXML private ProgressIndicator loadingIndicator;
    @FXML private VBox emptyStateLabel;
    
    @FXML private HBox statsHBox;
    @FXML private VBox recentRequestsList;
    @FXML private Label notificationLabel;
    @FXML private Label userNameLabel;
    @FXML private Label pageTitle;
    @FXML private Label pageSubtitle;
    
    @FXML private Button btnDashboard;
    @FXML private Button btnNewBookingMenu;
    @FXML private Button btnNotifications;

    // Form inputs
    @FXML private DatePicker datePicker;
    @FXML private ComboBox<String> timeFromCombo;
    @FXML private ComboBox<String> timeToCombo;
    @FXML private TextField purposeField;
    @FXML private TextField capacityField;
    @FXML private CheckBox cbHoliday;
    @FXML private CheckBox cbOfficial;
    
    // Step 2 & 3 fields
    @FXML private TextField requesterNameField;
    @FXML private TextField requesterTitleField;
    @FXML private TextField requesterPhoneField;
    @FXML private CheckBox cbLaptop;
    @FXML private CheckBox cbVideoConf;
    @FXML private CheckBox cbMic;

    // Multi-step form variables
    @FXML private VBox step1Box;
    @FXML private VBox step2Box;
    @FXML private VBox step3Box;
    @FXML private StackPane step1Circle;
    @FXML private StackPane step2Circle;
    @FXML private StackPane step3Circle;
    @FXML private Label step1Label;
    @FXML private Label step2Label;
    @FXML private Label step3Label;

    private DashboardNavigationMediator mediator;
    private List<BookingRequest> myRequests = new ArrayList<>();

    // Design Pattern Instances
    private BookingCaretaker caretaker;
    private BookingRequest lastSubmittedBooking; // For Prototype
    private NotificationSender inAppNotifier;

    @Override
    protected void setupObservers() {
        BookingNotifierSubject.getInstance().addObserver(this);
    }

    @Override
    protected void initUI() {
        mediator = new DashboardNavigationMediator(mainContentArea);
        caretaker = new BookingCaretaker();
        inAppNotifier = new InAppNotificationSender();
        
        String currentUserName = SessionManager.getInstance().getCurrentUser() != null 
                ? SessionManager.getInstance().getCurrentUser().getDisplayName() 
                : "زميلنا الأكاديمي";
        
        if (userNameLabel != null) {
            userNameLabel.setText("مرحباً " + currentUserName);
        }
        
        if (timeFromCombo != null && timeToCombo != null) {
            String[] times = {"08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"};
            timeFromCombo.getItems().addAll(times);
            timeToCombo.getItems().addAll(times);
        }
        
        if (datePicker != null) {
            datePicker.valueProperty().addListener((observable, oldValue, newValue) -> {
                if (newValue != null) {
                    if (newValue.isBefore(java.time.LocalDate.now().plusDays(2))) {
                        javafx.scene.control.Alert alert = new javafx.scene.control.Alert(javafx.scene.control.Alert.AlertType.WARNING);
                        alert.setTitle("تاريخ غير صالح");
                        alert.setHeaderText("قواعد الحجز المسبق");
                        alert.setContentText("عذراً، لا يمكن حجز القاعة قبل 48 ساعة من موعد الفعالية (وفقاً للوائح). الرجاء اختيار تاريخ أبعد.");
                        alert.showAndWait();
                        datePicker.setValue(null);
                    }
                }
            });
        }
        
        // Load Notifications View
        try {
            FXMLLoader notifLoader = new FXMLLoader(getClass().getResource("/fxml/employee/Notifications.fxml"));
            notificationsNode = notifLoader.load();
        } catch (IOException e) {
            System.err.println("[SecretaryDashboard] Failed to load notifications content: " + e.getMessage());
            e.printStackTrace();
        }

        // Subscribe to notifications for badge count
        NotificationService.listenToMyNotifications(
            this::updateNotifBadge,
            err -> System.err.println("[Dashboard] Notification error: " + err.getMessage())
        );

        showDashboard();
    }

    private void updateNotifBadge(List<BookingNotification> notifications) {
        long unreadCount = notifications.stream().filter(n -> !n.isRead()).count();
        Platform.runLater(() -> {
            if (btnNotifications != null && unreadCount > 0) {
                btnNotifications.setText("🔔  الإشعارات (" + unreadCount + ")");
            } else if (btnNotifications != null) {
                btnNotifications.setText("🔔  الإشعارات");
            }
        });
    }

    @FXML
    private void handleRefresh() {
        loadData();
    }

    @Override
    protected void loadData() {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) {
            new SystemNotification(inAppNotifier, "تحذير: لا يوجد اتصال بقاعدة البيانات").dispatch();
            return;
        }

        if (loadingIndicator != null) {
            loadingIndicator.setVisible(true);
            loadingIndicator.setManaged(true);
        }
        if (emptyStateLabel != null) {
            emptyStateLabel.setVisible(false);
            emptyStateLabel.setManaged(false);
        }

        String currentUserId = SessionManager.getInstance().getCurrentUser() != null 
            ? SessionManager.getInstance().getCurrentUser().getUid() 
            : "MOCK_USER_ID";

        // Fetch asynchronously from Firestore with optimized query
        ApiFuture<QuerySnapshot> future = db.collection("bookings")
                                            .whereEqualTo("userId", currentUserId)
                                            .get();

        new Thread(() -> {
            try {
                QuerySnapshot snapshot = future.get();
                List<BookingRequest> fetchedRequests = new ArrayList<>();
                for (QueryDocumentSnapshot doc : snapshot.getDocuments()) {
                    BookingRequest req = new BookingRequest();
                    req.setId(doc.getId());
                    req.setUserId(doc.getString("userId"));
                    req.setEmployeeName(doc.getString("employeeName"));
                    req.setRoomId(doc.getString("roomId"));
                    req.setDate(doc.getString("date"));
                    req.setTimeFrom(doc.getString("timeFrom"));
                    req.setTimeTo(doc.getString("timeTo"));
                    req.setPurpose(doc.getString("purpose"));
                    req.setStatus(doc.getString("status"));
                    Object createdAtObj = doc.get("createdAt");
                    if (createdAtObj instanceof com.google.cloud.Timestamp) {
                        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                        req.setCreatedAt(sdf.format(((com.google.cloud.Timestamp) createdAtObj).toDate()));
                    } else if (createdAtObj != null) {
                        req.setCreatedAt(createdAtObj.toString());
                    }
                    req.setDescription(doc.getString("description"));
                    req.setRejectReason(doc.getString("rejectReason"));
                    req.setSuggestedRoomId(doc.getString("suggestedRoomId"));
                    req.setSuggestedDate(doc.getString("suggestedDate"));
                    req.setSuggestedTimeFrom(doc.getString("suggestedTimeFrom"));
                    req.setSuggestedTimeTo(doc.getString("suggestedTimeTo"));
                    
                    req.setRequesterName(doc.getString("requesterName"));
                    req.setRequesterTitle(doc.getString("requesterTitle"));
                    req.setRequesterPhone(doc.getString("requesterPhone"));
                    Object reqs = doc.get("requirements");
                    if (reqs instanceof List) {
                        req.setRequirements((List<String>) reqs);
                    }
                    
                    Double cost = doc.getDouble("totalCost");
                    if (cost != null) req.setTotalCost(cost);
                    
                    fetchedRequests.add(req);
                }
                
                // Sort by createdAt descending
                fetchedRequests.sort((a, b) -> {
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                });
                
                Platform.runLater(() -> {
                    myRequests = fetchedRequests;
                    populateDashboard();
                });
            } catch (InterruptedException | ExecutionException e) {
                Platform.runLater(() -> {
                    if (loadingIndicator != null) {
                        loadingIndicator.setVisible(false);
                        loadingIndicator.setManaged(false);
                    }
                    new SystemNotification(inAppNotifier, "خطأ في تحميل البيانات من قاعدة البيانات").dispatch();
                    e.printStackTrace();
                });
            }
        }).start();
    }

    private void populateDashboard() {
        if (loadingIndicator != null) {
            loadingIndicator.setVisible(false);
            loadingIndicator.setManaged(false);
        }

        long totalCount = myRequests.size();
        long approvedCount = myRequests.stream().filter(r -> "approved".equals(r.getStatus())).count();
        long pendingCount = myRequests.stream().filter(r -> "pending".equals(r.getStatus()) || "awaiting_manager_final".equals(r.getStatus())).count();
        long rejectedCount = myRequests.stream().filter(r -> "rejected".equals(r.getStatus())).count();

        statsHBox.getChildren().clear();
        statsHBox.getChildren().add(CardFactory.createStatCard("إجمالي الحجوزات", String.valueOf(totalCount), "#003087", "inventory"));
        statsHBox.getChildren().add(CardFactory.createStatCard("الطلبات المقبولة", String.valueOf(approvedCount), "#15803d", "check_circle"));
        statsHBox.getChildren().add(CardFactory.createStatCard("قيد الانتظار", String.valueOf(pendingCount), "#b45309", "pending_actions"));
        statsHBox.getChildren().add(CardFactory.createStatCard("الطلبات المرفوضة", String.valueOf(rejectedCount), "#b91c1c", "cancel"));

        recentRequestsList.getChildren().clear();
        if (emptyStateLabel != null) {
            recentRequestsList.getChildren().add(emptyStateLabel);
        }

        for (BookingRequest req : myRequests) {
            recentRequestsList.getChildren().add(CardFactory.createRequestListItem(req, this));
        }
        
        if (myRequests.isEmpty()) {
            if (emptyStateLabel != null) {
                emptyStateLabel.setVisible(true);
                emptyStateLabel.setManaged(true);
            }
        } else {
            if (emptyStateLabel != null) {
                emptyStateLabel.setVisible(false);
                emptyStateLabel.setManaged(false);
            }
        }
    }

    // ==========================================
    // DESIGN PATTERN IMPLEMENTATIONS (BACKEND)
    // ==========================================

    @FXML
    private void saveFormState() {
        String dateVal = datePicker.getValue() != null ? datePicker.getValue().toString() : "";
        String tFrom = timeFromCombo != null && timeFromCombo.getValue() != null ? timeFromCombo.getValue() : "";
        String tTo = timeToCombo != null && timeToCombo.getValue() != null ? timeToCombo.getValue() : "";
        String purp = purposeField != null ? purposeField.getText() : "";
        String cap = capacityField != null ? capacityField.getText() : "";
        
        String reqName = requesterNameField != null ? requesterNameField.getText() : "";
        String reqTitle = requesterTitleField != null ? requesterTitleField.getText() : "";
        String reqPhone = requesterPhoneField != null ? requesterPhoneField.getText() : "";
        
        caretaker.saveState(new BookingMemento("قاعة متعددة الأغراض", dateVal, tFrom, tTo, purp, cap, 
            cbHoliday.isSelected(), cbOfficial.isSelected(),
            reqName, reqTitle, reqPhone, 
            cbLaptop.isSelected(), cbVideoConf.isSelected(), cbMic.isSelected()));
    }

    @FXML
    private void handleUndoForm() {
        clearForm();
        new SystemNotification(inAppNotifier, "تم تصفير محتويات النموذج بناءً على طلبك.").dispatch();
    }

    @FXML
    private void handleCloneLastBooking() {
        BookingRequest lastBooking = lastSubmittedBooking;
        if (lastBooking == null && !myRequests.isEmpty()) {
            lastBooking = myRequests.get(0);
        }

        if (lastBooking != null) {
            BookingRequest cloned = lastBooking.clone();
            datePicker.setValue(null); 
            if (timeFromCombo != null) timeFromCombo.setValue(cloned.getTimeFrom());
            if (timeToCombo != null) timeToCombo.setValue(cloned.getTimeTo());
            
            // Extract capacity if exists in purpose
            String purp = cloned.getPurpose() != null ? cloned.getPurpose() : "";
            if (purp.contains("(السعة: ")) {
                try {
                    String cap = purp.substring(purp.indexOf("(السعة: ") + 8, purp.indexOf(")", purp.indexOf("(السعة: ")));
                    if (capacityField != null) capacityField.setText(cap);
                    purp = purp.substring(0, purp.indexOf("(السعة: ")).trim();
                } catch (Exception e) {}
            }
            if (purposeField != null) purposeField.setText(purp);
            
            // Step 2 Fields
            if (requesterNameField != null) requesterNameField.setText(cloned.getRequesterName() != null ? cloned.getRequesterName() : "");
            if (requesterTitleField != null) requesterTitleField.setText(cloned.getRequesterTitle() != null ? cloned.getRequesterTitle() : "");
            if (requesterPhoneField != null) requesterPhoneField.setText(cloned.getRequesterPhone() != null ? cloned.getRequesterPhone() : "");

            // Re-apply checkboxes state from previous booking based on description hints
            cbHoliday.setSelected(cloned.getDescription() != null && cloned.getDescription().contains("عطلة"));
            cbOfficial.setSelected(cloned.getDescription() != null && cloned.getDescription().contains("مناسبة رسمية"));
            
            List<String> reqs = cloned.getRequirements();
            if (reqs != null) {
                cbLaptop.setSelected(reqs.contains("Laptop"));
                cbVideoConf.setSelected(reqs.contains("Video Conference"));
                cbMic.setSelected(reqs.contains("Microphones"));
            } else {
                cbLaptop.setSelected(false);
                cbVideoConf.setSelected(false);
                cbMic.setSelected(false);
            }
            
            new SystemNotification(inAppNotifier, "تم تعبئة النموذج ببيانات الحجز السابق.").dispatch();
        } else {
            new SystemNotification(inAppNotifier, "لا يوجد حجز سابق لاستنساخه.").dispatch();
        }
    }

    public void prefillFormWithSuggestion(BookingRequest originalReq) {
        String d = originalReq.getSuggestedDate() != null ? originalReq.getSuggestedDate() : originalReq.getDate();
        if (d != null && !d.isEmpty()) {
            datePicker.setValue(LocalDate.parse(d));
        }
        
        if (timeFromCombo != null) {
            timeFromCombo.setValue(originalReq.getSuggestedTimeFrom() != null ? originalReq.getSuggestedTimeFrom() : originalReq.getTimeFrom());
        }
        if (timeToCombo != null) {
            timeToCombo.setValue(originalReq.getSuggestedTimeTo() != null ? originalReq.getSuggestedTimeTo() : originalReq.getTimeTo());
        }
        if (purposeField != null) purposeField.setText(originalReq.getPurpose());
        
        showNewBooking();
        new SystemNotification(inAppNotifier, "تم تعبئة النموذج بالبديل المقترح. راجع التفاصيل ثم اضغط إرسال.").dispatch();
    }

    @FXML
    private void handleSubmitBooking() {
        String room = "قاعة متعددة الأغراض"; // Hardcoded for secretary
        String date = datePicker.getValue() != null ? datePicker.getValue().toString() : "";
        String tFrom = timeFromCombo != null && timeFromCombo.getValue() != null ? timeFromCombo.getValue() : "";
        String tTo = timeToCombo != null && timeToCombo.getValue() != null ? timeToCombo.getValue() : "";
        String purp = purposeField != null ? purposeField.getText() : "";
        String cap = capacityField != null ? capacityField.getText() : "";
        
        List<String> missingFields = new ArrayList<>();
        if (date.isEmpty()) missingFields.add("تاريخ الفعالية");
        if (tFrom.isEmpty()) missingFields.add("وقت البداية");
        if (tTo.isEmpty()) missingFields.add("وقت النهاية");
        if (purp.isEmpty()) missingFields.add("الغرض من الاستخدام");
        if (cap.isEmpty()) missingFields.add("السعة المطلوبة");
        
        String reqName = requesterNameField != null ? requesterNameField.getText().trim() : "";
        String reqTitle = requesterTitleField != null ? requesterTitleField.getText().trim() : "";
        String reqPhone = requesterPhoneField != null ? requesterPhoneField.getText().trim() : "";

        if (reqName.isEmpty()) missingFields.add("اسم المسؤول");
        if (reqTitle.isEmpty()) missingFields.add("الصفة الأكاديمية");
        if (reqPhone.isEmpty()) missingFields.add("رقم الجوال");

        if (!missingFields.isEmpty()) {
            String msg = "لا يمكنك الإرسال قبل تعبئة النواقص:\n- " + String.join("\n- ", missingFields);
            Alert alert = new Alert(Alert.AlertType.WARNING);
            alert.setTitle("حقول مطلوبة");
            alert.setHeaderText("يرجى استكمال الحقول التالية أولاً");
            alert.setContentText(msg);
            alert.showAndWait();
            return;
        }

        // Add capacity to purpose so backend receives it
        if (!cap.isEmpty()) {
            purp = purp + " (السعة: " + cap + ")";
        }

        String reqId = "REQ-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String employeeName = "زميل أكاديمي";
        String userId = "MOCK_USER_ID";
        if (SessionManager.getInstance().getCurrentUser() != null) {
            employeeName = SessionManager.getInstance().getCurrentUser().getDisplayName();
            userId = SessionManager.getInstance().getCurrentUser().getUid();
        }
        
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        // Builder Pattern
        BookingBuilder builder = new StandardBookingBuilder(reqId)
                                    .setUserId(userId)
                                    .setEmployeeName(employeeName)
                                    .setRoomId(room)
                                    .setDate(date)
                                    .setTimeFrom(tFrom)
                                    .setTimeTo(tTo)
                                    .setPurpose(purp)
                                    .setCreatedAt(now)
                                    .setStatus("pending");
        BookingRequest newBooking = builder.build();
        
        // Add step 2 & 3 data to request model
        newBooking.setRequesterName(requesterNameField != null ? requesterNameField.getText() : "");
        newBooking.setRequesterTitle(requesterTitleField != null ? requesterTitleField.getText() : "");
        newBooking.setRequesterPhone(requesterPhoneField != null ? requesterPhoneField.getText() : "");
        
        List<String> requirements = new ArrayList<>();
        if (cbLaptop != null && cbLaptop.isSelected()) requirements.add("Laptop");
        if (cbVideoConf != null && cbVideoConf.isSelected()) requirements.add("Video Conference");
        if (cbMic != null && cbMic.isSelected()) requirements.add("Microphones");
        newBooking.setRequirements(requirements);

        // Decorator Pattern
        BookingService bookingService = new BasicBooking();
        if (cbHoliday.isSelected()) bookingService = new HolidayDecorator(bookingService);
        if (cbOfficial.isSelected()) bookingService = new OfficialEventDecorator(bookingService);
        bookingService.applyTo(newBooking);

        // Connect to Firestore Backend
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db != null) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", newBooking.getId());
            data.put("userId", newBooking.getUserId());
            data.put("employeeName", newBooking.getEmployeeName());
            data.put("roomId", newBooking.getRoomId());
            data.put("date", newBooking.getDate());
            data.put("timeFrom", newBooking.getTimeFrom());
            data.put("timeTo", newBooking.getTimeTo());
            data.put("purpose", newBooking.getPurpose());
            data.put("createdAt", newBooking.getCreatedAt());
            data.put("status", newBooking.getStatus());
            data.put("roomType", "multi");
            data.put("hallCategory", "multi");
            data.put("totalCost", newBooking.getTotalCost());
            data.put("description", bookingService.getDescription());
            
            // Add Step 2 & 3 data to Firestore
            data.put("requesterName", newBooking.getRequesterName());
            data.put("requesterTitle", newBooking.getRequesterTitle());
            data.put("requesterPhone", newBooking.getRequesterPhone());
            data.put("requirements", newBooking.getRequirements());

            ApiFuture<WriteResult> future = db.collection("bookings").document(newBooking.getId()).set(data);
            
            new Thread(() -> {
                try {
                    future.get(); // Wait for write
                    Platform.runLater(() -> {
                        myRequests.add(0, newBooking);
                        lastSubmittedBooking = newBooking;
                        clearForm();
                        populateDashboard();
                        showDashboard();
                        new SystemNotification(inAppNotifier, "تم إرسال الطلب بنجاح!").dispatch();
                    });
                } catch (InterruptedException | ExecutionException e) {
                    Platform.runLater(() -> {
                        new SystemNotification(inAppNotifier, "حدث خطأ أثناء الحفظ في قاعدة البيانات").dispatch();
                    });
                }
            }).start();
        } else {
            // Fallback Notification if no DB connection
            myRequests.add(0, newBooking);
            lastSubmittedBooking = newBooking;
            clearForm();
            populateDashboard();
            showDashboard();
            new SystemNotification(inAppNotifier, "تم إنشاء طلب الحجز محلياً بنجاح (لا يوجد اتصال)").dispatch();
        }
    }
    
    private void clearForm() {
        datePicker.setValue(null);
        if (timeFromCombo != null) timeFromCombo.setValue(null);
        if (timeToCombo != null) timeToCombo.setValue(null);
        if (purposeField != null) purposeField.clear();
        if (capacityField != null) capacityField.clear();
        cbHoliday.setSelected(false);
        cbOfficial.setSelected(false);
        
        if (requesterNameField != null) requesterNameField.clear();
        if (requesterTitleField != null) requesterTitleField.clear();
        if (requesterPhoneField != null) requesterPhoneField.clear();
        
        if (cbLaptop != null) cbLaptop.setSelected(false);
        if (cbVideoConf != null) cbVideoConf.setSelected(false);
        if (cbMic != null) cbMic.setSelected(false);
        
        goToStep1();
    }

    // --- Multi-Step Form Navigation ---
    @FXML
    private void goToStep1() { updateStepUI(1); }
    @FXML
    private void goToStep2() { updateStepUI(2); }
    @FXML
    private void goToStep3() { updateStepUI(3); }

    @FXML
    private void handleNextToStep2() {
        List<String> missingFields = new ArrayList<>();
        
        String dateVal = datePicker.getValue() != null ? datePicker.getValue().toString() : "";
        String tFrom = timeFromCombo != null && timeFromCombo.getValue() != null ? timeFromCombo.getValue() : "";
        String tTo = timeToCombo != null && timeToCombo.getValue() != null ? timeToCombo.getValue() : "";
        String purp = purposeField != null ? purposeField.getText().trim() : "";
        String cap = capacityField != null ? capacityField.getText().trim() : "";
        
        if (dateVal.isEmpty()) missingFields.add("تاريخ الفعالية");
        if (tFrom.isEmpty() || tTo.isEmpty()) missingFields.add("الفترة الزمنية");
        if (purp.isEmpty()) missingFields.add("الغرض من الاستخدام");
        if (cap.isEmpty()) missingFields.add("السعة المطلوبة");
        
        if (!missingFields.isEmpty()) {
            String msg = "يرجى تعبئة الحقول التالية قبل الانتقال للخطوة التالية:\n- " + String.join("\n- ", missingFields);
            Alert alert = new Alert(Alert.AlertType.WARNING);
            alert.setTitle("حقول مطلوبة");
            alert.setHeaderText("بيانات مفقودة في الخطوة الأولى");
            alert.setContentText(msg);
            alert.showAndWait();
            return;
        }
        
        goToStep2();
    }

    @FXML
    private void handleNextToStep3() {
        List<String> missingFields = new ArrayList<>();
        
        String reqName = requesterNameField != null ? requesterNameField.getText().trim() : "";
        String reqTitle = requesterTitleField != null ? requesterTitleField.getText().trim() : "";
        String reqPhone = requesterPhoneField != null ? requesterPhoneField.getText().trim() : "";

        if (reqName.isEmpty()) missingFields.add("اسم المسؤول");
        if (reqTitle.isEmpty()) missingFields.add("الصفة الأكاديمية");
        if (reqPhone.isEmpty()) missingFields.add("رقم الجوال");
        
        if (!missingFields.isEmpty()) {
            String msg = "يرجى تعبئة الحقول التالية قبل الانتقال للخطوة التالية:\n- " + String.join("\n- ", missingFields);
            Alert alert = new Alert(Alert.AlertType.WARNING);
            alert.setTitle("حقول مطلوبة");
            alert.setHeaderText("بيانات مفقودة في الخطوة الثانية");
            alert.setContentText(msg);
            alert.showAndWait();
            return;
        }
        
        goToStep3();
    }

    private void updateStepUI(int step) {
        if (step1Box == null) return; // Prevent NPE if UI isn't fully loaded

        // Visibility
        step1Box.setVisible(step == 1); step1Box.setManaged(step == 1);
        step2Box.setVisible(step == 2); step2Box.setManaged(step == 2);
        step3Box.setVisible(step == 3); step3Box.setManaged(step == 3);

        // Progress bar styling
        step1Circle.getStyleClass().setAll(step >= 1 ? "step-circle-active" : "step-circle-inactive");
        step1Label.getStyleClass().setAll(step >= 1 ? "step-num-active" : "step-num-inactive");

        step2Circle.getStyleClass().setAll(step >= 2 ? "step-circle-active" : "step-circle-inactive");
        step2Label.getStyleClass().setAll(step >= 2 ? "step-num-active" : "step-num-inactive");

        step3Circle.getStyleClass().setAll(step >= 3 ? "step-circle-active" : "step-circle-inactive");
        step3Label.getStyleClass().setAll(step >= 3 ? "step-num-active" : "step-num-inactive");
    }

    // ==========================================
    // UI NAVIGATION
    // ==========================================

    @FXML
    private void showDashboard() {
        mediator.navigateTo(dashboardView);
        setActiveNav(btnDashboard);
        if (pageTitle != null) pageTitle.setText("لوحة التحكم");
        if (pageSubtitle != null) pageSubtitle.setText("نظرة عامة على سجل طلبات الحجز");
    }

    @FXML
    private void showNewBooking() {
        goToStep1();
        mediator.navigateTo(newBookingView);
        setActiveNav(btnNewBookingMenu);
        if (pageTitle != null) pageTitle.setText("طلب حجز جديد");
        if (pageSubtitle != null) pageSubtitle.setText("تعبئة بيانات حجز قاعة متعددة الأغراض");
    }

    @FXML
    private void showNotifications() {
        if (notificationsNode != null) {
            mediator.navigateTo(notificationsNode);
            setActiveNav(btnNotifications);
            if (pageTitle != null) pageTitle.setText("الإشعارات");
            if (pageSubtitle != null) pageSubtitle.setText("متابعة تحديثات طلبات الحجز");
        }
    }

    private void setActiveNav(Button active) {
        for (Button btn : new Button[]{btnDashboard, btnNewBookingMenu, btnNotifications}) {
            if (btn != null) {
                btn.getStyleClass().removeAll("bm-nav-btn-active");
                if (!btn.getStyleClass().contains("bm-nav-btn")) btn.getStyleClass().add("bm-nav-btn");
            }
        }
        if (active != null) {
            active.getStyleClass().removeAll("bm-nav-btn");
            if (!active.getStyleClass().contains("bm-nav-btn-active")) active.getStyleClass().add("bm-nav-btn-active");
        }
    }

    @FXML
    private void handleLogout() throws IOException {
        BookingNotifierSubject.getInstance().removeObserver(this);
        NotificationService.stopListening();
        AuthService.logout();
        Stage stage = SessionManager.getInstance().getPrimaryStage();
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/Login.fxml"));
        Scene scene = new Scene(loader.load(), 1000, 680);
        scene.getStylesheets().add(getClass().getResource("/css/styles.css").toExternalForm());
        stage.setScene(scene); 
        stage.setMaximized(false);
    }

    @Override
    public void onNotificationReceived(String message) {
        Platform.runLater(() -> {
            if (notificationLabel != null) {
                notificationLabel.setText(message);
            }
        });
    }
}
