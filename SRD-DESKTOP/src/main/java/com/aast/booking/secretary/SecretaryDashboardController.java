package com.aast.booking.secretary;

import com.aast.booking.auth.AuthService;
import com.aast.booking.core.BaseDashboardController;
import com.aast.booking.core.FirebaseService;
import com.aast.booking.core.SessionManager;
import com.aast.booking.core.observer.BookingNotifierSubject;
import com.aast.booking.core.observer.NotificationObserver;
import com.aast.booking.models.BookingRequest;
import com.aast.booking.secretary.form.*;
import com.aast.booking.secretary.notification.*;
import com.aast.booking.secretary.ui.CardFactory;
import com.aast.booking.secretary.ui.DashboardNavigationMediator;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
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
    
    @FXML private HBox statsHBox;
    @FXML private VBox recentRequestsList;
    @FXML private Label notificationLabel;
    @FXML private Label userNameLabel;
    
    @FXML private Button btnDashboard;
    @FXML private Button btnNewBookingMenu;

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
        
        showDashboard();
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

        // Fetch asynchronously from Firestore (fetch all bookings to match web app view)
        ApiFuture<QuerySnapshot> future = db.collection("bookings").get();

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
                    new SystemNotification(inAppNotifier, "خطأ في تحميل البيانات من قاعدة البيانات").dispatch();
                    e.printStackTrace();
                });
            }
        }).start();
    }

    private void populateDashboard() {
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
        for (BookingRequest req : myRequests) {
            recentRequestsList.getChildren().add(CardFactory.createRequestListItem(req, this));
        }
        
        if (myRequests.isEmpty()) {
            Label emptyLabel = new Label("لم تقم بإرسال أي طلبات حجز بعد");
            emptyLabel.setStyle("-fx-font-size: 16px; -fx-text-fill: #9ca3af; -fx-font-weight: bold; -fx-padding: 40;");
            recentRequestsList.getChildren().add(emptyLabel);
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
        if (caretaker.canRestore()) {
            BookingMemento memento = caretaker.restoreState();
            if (!memento.getDate().isEmpty()) {
                datePicker.setValue(LocalDate.parse(memento.getDate()));
            } else {
                datePicker.setValue(null);
            }
            if (timeFromCombo != null) timeFromCombo.setValue(memento.getTimeFrom());
            if (timeToCombo != null) timeToCombo.setValue(memento.getTimeTo());
            if (purposeField != null) purposeField.setText(memento.getPurpose());
            if (capacityField != null) capacityField.setText(memento.getCapacity());
            
            cbHoliday.setSelected(memento.isHoliday());
            cbOfficial.setSelected(memento.isOfficial());

            if (requesterNameField != null) requesterNameField.setText(memento.getRequesterName());
            if (requesterTitleField != null) requesterTitleField.setText(memento.getRequesterTitle());
            if (requesterPhoneField != null) requesterPhoneField.setText(memento.getRequesterPhone());
            
            cbLaptop.setSelected(memento.isLaptop());
            cbVideoConf.setSelected(memento.isVideoConf());
            cbMic.setSelected(memento.isMic());
        }
    }

    @FXML
    private void handleCloneLastBooking() {
        if (lastSubmittedBooking != null) {
            BookingRequest cloned = lastSubmittedBooking.clone();
            datePicker.setValue(null); 
            if (timeFromCombo != null) timeFromCombo.setValue(cloned.getTimeFrom());
            if (timeToCombo != null) timeToCombo.setValue(cloned.getTimeTo());
            if (purposeField != null) purposeField.setText(cloned.getPurpose());
            
            // Re-apply checkboxes state from previous booking based on description hints
            cbHoliday.setSelected(cloned.getDescription() != null && cloned.getDescription().contains("عطلة"));
            cbOfficial.setSelected(cloned.getDescription() != null && cloned.getDescription().contains("مناسبة رسمية"));
            new SystemNotification(inAppNotifier, "تم استنساخ بيانات الحجز السابق بنجاح.").dispatch();
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
        
        if (date.isEmpty() || tFrom.isEmpty() || tTo.isEmpty() || purp.isEmpty()) {
            new SystemNotification(inAppNotifier, "يرجى تعبئة كافة الحقول المطلوبة!").dispatch();
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
    }

    // ==========================================
    // UI NAVIGATION
    // ==========================================

    @FXML
    private void showDashboard() {
        mediator.navigateTo(dashboardView);
        updateMenuStyles(btnDashboard, btnNewBookingMenu);
    }

    @FXML
    private void showNewBooking() {
        mediator.navigateTo(newBookingView);
        updateMenuStyles(btnNewBookingMenu, btnDashboard);
    }

    private void updateMenuStyles(Button active, Button inactive) {
        if (active != null) active.setStyle("-fx-background-color: linear-gradient(to left, #003087, #1565C0); -fx-text-fill: white; -fx-font-size: 14px; -fx-font-weight: bold; -fx-padding: 12; -fx-background-radius: 12; -fx-cursor: hand; -fx-alignment: center-right; -fx-effect: dropshadow(gaussian, rgba(0,0,0,0.2), 10, 0, 0, 4);");
        if (inactive != null) inactive.setStyle("-fx-background-color: transparent; -fx-text-fill: #475569; -fx-font-size: 14px; -fx-font-weight: bold; -fx-padding: 12; -fx-cursor: hand; -fx-alignment: center-right;");
    }

    @FXML
    private void handleLogout() throws IOException {
        BookingNotifierSubject.getInstance().removeObserver(this);
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
