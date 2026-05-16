package com.aast.booking.admin;
 
import com.aast.booking.core.FirebaseService;
import com.aast.booking.models.User;
import com.aast.booking.patterns.permissions.*;
import com.google.cloud.firestore.*;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
 
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.ResourceBundle;
import java.util.Stack;
 
public class AdminDelegationController implements Initializable {
 
    @FXML private TextField searchUserField;
    @FXML private ListView<User> userListView;
    @FXML private RadioButton rbTempAdmin, rbSecretary;
    @FXML private ComboBox<String> collegeCombo;
    @FXML private DatePicker startDatePicker, endDatePicker;
    @FXML private Spinner<Integer> startHourSpinner, startMinSpinner, endHourSpinner, endMinSpinner;
    @FXML private VBox collegeSelectionBox, granularPermissionsBox;
    @FXML private CheckBox checkRequests, checkRooms, checkStats, checkSearch, checkSettings;
    @FXML private javafx.scene.layout.HBox dateTimeRangeBox;
    @FXML private Label statusLabel;
    @FXML private TableView<com.aast.booking.models.Delegation> activeDelegationsTable;
    @FXML private TableColumn<com.aast.booking.models.Delegation, String> colUser, colPermission, colType, colStatus, colAction;
 
    private ObservableList<User> allUsers = FXCollections.observableArrayList();
    private javafx.collections.transformation.FilteredList<User> filteredUsers;
    private User selectedUser;
    private Stack<PermissionCommand> commandHistory = new Stack<>();
    private SecurityProxy securityProxy = new SecurityProxy();
 
    @Override
    public void initialize(URL url, ResourceBundle rb) {
        setupUserList();
        setupSearchLogic();
        setupRoleToggles();
        setupColleges();
        setupTimeSpinners();
        setupTableColumns();
        fetchUsers();
        fetchDelegations();
    }
 
    private void setupTableColumns() {
        colUser.setCellValueFactory(new javafx.scene.control.cell.PropertyValueFactory<>("userName"));
        colPermission.setCellValueFactory(new javafx.scene.control.cell.PropertyValueFactory<>("permissionName"));
        colType.setCellValueFactory(new javafx.scene.control.cell.PropertyValueFactory<>("type"));
        colStatus.setCellValueFactory(cell -> new javafx.beans.property.SimpleStringProperty("نشط"));
 
        colAction.setCellFactory(param -> new TableCell<>() {
            private final Button btn = new Button("سحب الصلاحية");
            {
                btn.getStyleClass().add("admin-logout-btn"); // Red style
                btn.setStyle("-fx-font-size: 11px; -fx-padding: 4 8;");
                btn.setOnAction(event -> {
                    com.aast.booking.models.Delegation d = getTableView().getItems().get(getIndex());
                    handleRevoke(d);
                });
            }
 
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty) setGraphic(null);
                else setGraphic(btn);
            }
        });
    }
 
    private void handleRevoke(com.aast.booking.models.Delegation d) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION, "هل أنت متأكد من سحب الصلاحية عن " + d.getUserName() + "؟", ButtonType.YES, ButtonType.NO);
        alert.showAndWait().ifPresent(type -> {
            if (type == ButtonType.YES) {
                Firestore db = FirebaseService.getInstance().getFirestore();
                if (db == null) return;
                
                // 1. Delete from delegations collection
                db.collection("delegations").document(d.getId()).delete();
                
                // 2. Reset user role to employee
                db.collection("users").document(d.getTargetUserId()).update(
                    "role", "employee",
                    "collegeName", FieldValue.delete(),
                    "tempAccessStart", FieldValue.delete(),
                    "tempAccessEnd", FieldValue.delete(),
                    "allowedFeatures", FieldValue.delete()
                );
                
                showAlert("نجاح", "تم سحب الصلاحية بنجاح.");
                fetchDelegations();
            }
        });
    }
 
    private void setupTimeSpinners() {
        startHourSpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(0, 23, 12));
        startMinSpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(0, 59, 0));
        endHourSpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(0, 23, 13));
        endMinSpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(0, 59, 0));
    }
 
    private void setupUserList() {
        filteredUsers = new javafx.collections.transformation.FilteredList<>(allUsers, p -> true);
        userListView.setItems(filteredUsers);
        userListView.setCellFactory(lv -> new ListCell<User>() {
            @Override
            protected void updateItem(User item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setGraphic(null);
                } else {
                    javafx.scene.layout.HBox cell = new javafx.scene.layout.HBox(15);
                    cell.setAlignment(javafx.geometry.Pos.CENTER_RIGHT); // Align right for Arabic
                    cell.setStyle("-fx-padding: 10 15;");
 
                    javafx.scene.layout.VBox details = new javafx.scene.layout.VBox(2);
                    details.setAlignment(javafx.geometry.Pos.CENTER_RIGHT);
                    javafx.scene.control.Label name = new javafx.scene.control.Label(item.getDisplayName());
                    name.setStyle("-fx-font-weight: bold; -fx-text-fill: #111827; -fx-font-size: 14px;");
                    javafx.scene.control.Label id = new javafx.scene.control.Label("ID: " + (item.getEmployeeId() != null ? item.getEmployeeId() : "N/A"));
                    id.setStyle("-fx-text-fill: #6B7280; -fx-font-size: 11px;");
                    details.getChildren().addAll(name, id);
 
                    javafx.scene.control.Label icon = new javafx.scene.control.Label("👤");
                    icon.setStyle("-fx-text-fill: #3B82F6; -fx-font-size: 18px;");
 
                    javafx.scene.layout.Region spacer = new javafx.scene.layout.Region();
                    javafx.scene.layout.HBox.setHgrow(spacer, javafx.scene.layout.Priority.ALWAYS);
 
                    // In RTL, adding icon first then details with spacer will put icon on left and details on right
                    cell.getChildren().addAll(icon, spacer, details);
                    setGraphic(cell);
                    setText(null);
                }
            }
        });
 
        userListView.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) {
                selectedUser = newVal;
                statusLabel.setText("تم اختيار المستخدم: " + newVal.getDisplayName());
                userListView.setVisible(false);
                userListView.setManaged(false);
                searchUserField.setText(newVal.getDisplayName());
            }
        });
    }
 
    @FXML private void selectTempAdmin() { rbTempAdmin.setSelected(true); }
    @FXML private void selectSecretary() { rbSecretary.setSelected(true); }
 
    private void setupSearchLogic() {
        searchUserField.textProperty().addListener((observable, oldValue, newValue) -> {
            boolean hasText = newValue != null && !newValue.isEmpty();
            boolean show = hasText && (selectedUser == null || !selectedUser.getDisplayName().equals(newValue));
            
            userListView.setVisible(show);
            userListView.setManaged(show); // Ensure it takes space or at least is considered in layout
            if (show) userListView.toFront();
            
            if (selectedUser != null && !selectedUser.getDisplayName().equals(newValue)) {
                selectedUser = null;
                statusLabel.setText("تم اختيار المستخدم: -");
            }
 
            filteredUsers.setPredicate(user -> {
                if (!hasText) return true;
                String lowerCaseFilter = newValue.toLowerCase();
                boolean match = (user.getDisplayName() != null && user.getDisplayName().toLowerCase().contains(lowerCaseFilter)) || 
                                (user.getEmployeeId() != null && user.getEmployeeId().toLowerCase().contains(lowerCaseFilter));
                return match;
            });
        });
 
        // Hide suggestions when clicking elsewhere
        searchUserField.focusedProperty().addListener((obs, oldV, newV) -> {
            if (!newV) {
                // Delay hiding to allow ListView selection
                Platform.runLater(() -> {
                    if (!userListView.isFocused()) userListView.setVisible(false);
                });
            }
        });
    }
 
    private void setupRoleToggles() {
        ToggleGroup group = new ToggleGroup();
        rbTempAdmin.setToggleGroup(group);
        rbSecretary.setToggleGroup(group);
        
        group.selectedToggleProperty().addListener((obs, oldVal, newVal) -> {
            boolean isTemp = rbTempAdmin.isSelected();
            collegeSelectionBox.setVisible(!isTemp);
            collegeSelectionBox.setManaged(!isTemp);
            dateTimeRangeBox.setVisible(isTemp);
            dateTimeRangeBox.setManaged(isTemp);
            granularPermissionsBox.setVisible(isTemp);
            granularPermissionsBox.setManaged(isTemp);
        });
        
        rbTempAdmin.setSelected(true);
    }
 
    private void setupColleges() {
        collegeCombo.setItems(FXCollections.observableArrayList(
            "كلية الهندسة والتكنولوجيا",
            "كلية الحاسبات وتكنولوجيا المعلومات",
            "كلية الإدارة والتكنولوجيا",
            "كلية النقل الدولي واللوجستيات",
            "كلية اللغة والإعلام",
            "كلية الآثار والتراث الحضاري"
        ));
    }
 
    @FXML
    private void handleDelegate() {
        // PROXY PATTERN: Check if current user can delegate
        if (!securityProxy.canAccess("DELEGATE_PERMISSION")) {
            return;
        }
 
        if (selectedUser == null) {
            showAlert("خطأ", "يرجى اختيار الموظف أولاً من قائمة الاقتراحات.");
            return;
        }
 
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) return;
 
        if (rbSecretary.isSelected()) {
            String college = collegeCombo.getValue();
            if (college == null) {
                showAlert("خطأ", "يرجى اختيار الكلية / الجهة.");
                return;
            }
 
            // VALIDATION: Each college allows only one secretary
            try {
                QuerySnapshot existing = db.collection("users")
                    .whereEqualTo("role", "secretary")
                    .whereEqualTo("collegeName", college)
                    .get().get();
                
                if (!existing.isEmpty()) {
                    showAlert("خطأ في التحقق", "عذراً، هذه الكلية (" + college + ") لديها سكرتير معين بالفعل. لا يمكن تعيين أكثر من سكرتير واحد لكل كلية.");
                    return;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
 
            // Proceed with Secretary Delegation
            PermissionComponent perm = new LeafPermission("SECRETARY", "صلاحيات سكرتير جهة: " + college);
            DelegationStrategy strategy = new PermanentValidationStrategy();
            PermissionCommand command = new DelegateCommand(selectedUser.getUid(), selectedUser.getDisplayName(), perm, strategy, null);
            command.execute();
            commandHistory.push(command);
            showAlert("نجاح", "تم تعيين " + selectedUser.getDisplayName() + " كسكرتير لـ " + college);
            fetchDelegations();
 
        } else if (rbTempAdmin.isSelected()) {
            if (startDatePicker.getValue() == null || endDatePicker.getValue() == null) {
                showAlert("خطأ", "يرجى تحديد تاريخ ووقت البداية والنهاية للأدمن المؤقت.");
                return;
            }
 
            // Collect allowed features
            List<String> allowed = new ArrayList<>();
            if (checkRequests.isSelected()) allowed.add("requests");
            if (checkRooms.isSelected())    allowed.add("rooms");
            if (checkStats.isSelected())    allowed.add("stats");
            if (checkSearch.isSelected())   allowed.add("search");
            if (checkSettings.isSelected()) allowed.add("settings");
 
            if (allowed.isEmpty()) {
                showAlert("خطأ", "يجب اختيار صلاحية واحدة على الأقل للأدمن المؤقت.");
                return;
            }
 
            // Combine Date and Time
            java.time.LocalDateTime start = java.time.LocalDateTime.of(startDatePicker.getValue(), 
                java.time.LocalTime.of(startHourSpinner.getValue(), startMinSpinner.getValue()));
            java.time.LocalDateTime end = java.time.LocalDateTime.of(endDatePicker.getValue(), 
                java.time.LocalTime.of(endHourSpinner.getValue(), endMinSpinner.getValue()));
 
            if (end.isBefore(start)) {
                showAlert("خطأ", "تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية.");
                return;
            }
 
            PermissionComponent perm = new PermissionGroup("TEMP_ADMIN", "صلاحيات مسؤول مؤقت (" + allowed.size() + " ميزات)");
            DelegationStrategy strategy = new TemporaryValidationStrategy(start, end);
            PermissionCommand command = new DelegateCommand(selectedUser.getUid(), selectedUser.getDisplayName(), perm, strategy, allowed);
            command.execute();
            commandHistory.push(command);
            showAlert("نجاح", "تم منح صلاحيات أدمن مؤقت بنجاح لـ: " + selectedUser.getDisplayName());
            fetchDelegations();
        }
    }
 
    private void fetchDelegations() {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) return;
 
        db.collection("delegations")
          .orderBy("timestamp", Query.Direction.DESCENDING)
          .limit(10)
          .addSnapshotListener((snapshots, e) -> {
              if (e != null) return;
              List<com.aast.booking.models.Delegation> list = new ArrayList<>();
              for (QueryDocumentSnapshot doc : snapshots) {
                  com.aast.booking.models.Delegation d = doc.toObject(com.aast.booking.models.Delegation.class);
                  d.setId(doc.getId());
                  list.add(d);
              }
              Platform.runLater(() -> {
                  activeDelegationsTable.setItems(FXCollections.observableArrayList(list));
              });
          });
    }
 
    @FXML
    private void handleUndo() {
        if (!commandHistory.isEmpty()) {
            PermissionCommand lastCommand = commandHistory.pop();
            lastCommand.undo();
            showAlert("تراجع", "تم التراجع عن آخر عملية تفويض.");
        } else {
            showAlert("تنبيه", "لا توجد عمليات للتراجع عنها.");
        }
    }
 
 
    private void fetchUsers() {
        Firestore db = FirebaseService.getInstance().getFirestore();
        if (db == null) return;
 
        new Thread(() -> {
            try {
                QuerySnapshot snapshot = db.collection("users").get().get();
                List<User> users = new ArrayList<>();
                for (DocumentSnapshot doc : snapshot.getDocuments()) {
                    User u = new User();
                    u.setUid(doc.getId());
                    u.setDisplayName(doc.getString("displayName"));
                    u.setRole(doc.getString("role"));
                    u.setEmployeeId(doc.getString("employeeId"));
                    users.add(u);
                }
                Platform.runLater(() -> allUsers.setAll(users));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }
 
    private void showAlert(String title, String content) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        alert.showAndWait();
    }
}
