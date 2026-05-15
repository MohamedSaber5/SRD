package com.aast.booking.secretary.ui;

import com.aast.booking.models.BookingRequest;
import com.aast.booking.secretary.SecretaryDashboardController;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;

/**
 * DESIGN PATTERN: Factory Method
 * Generates reusable UI components like Statistics Cards and Request List Items.
 */
public class CardFactory {

    public static VBox createStatCard(String title, String count, String colorHex, String iconName) {
        VBox card = new VBox(15);
        card.setPadding(new Insets(20));
        card.setStyle("-fx-background-color: white; -fx-background-radius: 12; -fx-effect: dropshadow(three-pass-box, rgba(0,0,0,0.05), 10, 0, 0, 4); -fx-border-color: #f1f5f9; -fx-border-radius: 12; -fx-border-width: 1;");
        card.setPrefWidth(280);

        HBox topHBox = new HBox();
        topHBox.setAlignment(Pos.CENTER);
        
        Label countLabel = new Label(count);
        countLabel.setStyle("-fx-font-size: 32px; -fx-font-weight: bold; -fx-text-fill: #0f172a;");
        
        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);
        
        // Icon container
        VBox iconBox = new VBox();
        iconBox.setAlignment(Pos.CENTER);
        iconBox.setPrefSize(48, 48);
        iconBox.setStyle("-fx-background-color: " + colorHex + "15; -fx-background-radius: 12;");
        
        Label iconLabel = new Label(getMaterialIconCode(iconName)); 
        iconLabel.setStyle("-fx-font-family: 'Material Icons'; -fx-font-size: 24px; -fx-text-fill: " + colorHex + ";");
        iconBox.getChildren().add(iconLabel);
        
        topHBox.getChildren().addAll(countLabel, spacer, iconBox);
        
        Label titleLabel = new Label(title);
        titleLabel.setStyle("-fx-font-size: 14px; -fx-font-weight: bold; -fx-text-fill: #64748b;");
        
        card.getChildren().addAll(topHBox, titleLabel);
        return card;
    }

    public static VBox createRequestListItem(BookingRequest request, SecretaryDashboardController controller) {
        VBox mainContainer = new VBox(10);
        mainContainer.setPadding(new Insets(15, 20, 15, 20));
        
        String status = request.getStatus() != null ? request.getStatus().toLowerCase() : "pending";
        String borderColor = "#e2e8f0";
        String statusText = "قيد الانتظار";
        String statusColor = "#b45309";
        String statusBg = "#fef3c7";
        
        if ("approved".equals(status) || status.contains("approved")) {
            statusText = "مقبول";
            statusColor = "#15803d";
            statusBg = "#dcfce7";
            borderColor = "#22c55e";
        } else if ("rejected".equals(status)) {
            statusText = "مرفوض";
            statusColor = "#b91c1c";
            statusBg = "#fee2e2";
            borderColor = "#ef4444";
        }

        mainContainer.setStyle("-fx-background-color: white; -fx-background-radius: 12; -fx-border-color: transparent " + borderColor + " transparent transparent; -fx-border-width: 0 4 0 0; -fx-effect: dropshadow(three-pass-box, rgba(0,0,0,0.03), 8, 0, 0, 2);");

        HBox topItem = new HBox(15);
        topItem.setAlignment(Pos.CENTER_RIGHT); // RTL orientation inner alignment
        
        VBox rightDetails = new VBox(8);
        rightDetails.setAlignment(Pos.CENTER_RIGHT);
        
        String roomName = request.getRoomId() != null ? request.getRoomId() : "غير محدد";
        Label titleLabel = new Label("حجز " + roomName);
        titleLabel.setStyle("-fx-font-size: 16px; -fx-font-weight: bold; -fx-text-fill: #1e293b;");
        
        Label badgeLabel = new Label(statusText);
        badgeLabel.setStyle("-fx-background-color: " + statusBg + "; -fx-text-fill: " + statusColor + "; -fx-padding: 4 10; -fx-background-radius: 12; -fx-font-size: 12px; -fx-font-weight: bold;");
        
        HBox titleBox = new HBox(10, badgeLabel, titleLabel);
        titleBox.setAlignment(Pos.CENTER_RIGHT);

        String tFrom = request.getTimeFrom() != null ? request.getTimeFrom() : "--:--";
        String tTo = request.getTimeTo() != null ? request.getTimeTo() : "--:--";
        String purp = request.getPurpose() != null ? request.getPurpose() : "لم يتم تحديد الغرض";
        String dateStr = request.getDate() != null ? request.getDate() : "بدون تاريخ";
        
        String desc = request.getDescription() != null && !request.getDescription().isEmpty() ? "\nتفاصيل إضافية: " + request.getDescription() : "";
        Label detailsLabel = new Label("الغرض: " + purp + "   |   التاريخ: " + dateStr + "   |   الوقت: " + tFrom + " - " + tTo + desc);
        detailsLabel.setStyle("-fx-font-size: 13px; -fx-text-fill: #64748b; -fx-wrap-text: true;");

        rightDetails.getChildren().addAll(titleBox, detailsLabel);
        
        if ("rejected".equals(status)) {
            String rejectReason = request.getRejectReason() != null ? request.getRejectReason() : "لم يتم ذكر سبب";
            Label reasonLabel = new Label("السبب: " + rejectReason);
            reasonLabel.setStyle("-fx-font-size: 13px; -fx-text-fill: #ef4444; -fx-font-weight: bold; -fx-padding: 5 10; -fx-background-color: #fef2f2; -fx-background-radius: 6;");
            rightDetails.getChildren().add(reasonLabel);
        }

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        // Icon placeholder on the left
        VBox iconBox = new VBox();
        iconBox.setAlignment(Pos.CENTER);
        iconBox.setPrefSize(44, 44);
        iconBox.setStyle("-fx-background-color: #f8fafc; -fx-background-radius: 10; -fx-border-color: #e2e8f0; -fx-border-radius: 10; -fx-border-width: 1;");
        Label roomIcon = new Label("\ue871"); // Dashboard icon
        roomIcon.setStyle("-fx-font-family: 'Material Icons'; -fx-font-size: 20px; -fx-text-fill: #64748b;");
        iconBox.getChildren().add(roomIcon);

        topItem.getChildren().addAll(iconBox, spacer, rightDetails);
        mainContainer.getChildren().add(topItem);
        
        // Handle Alternatives Display
        if (request.getSuggestedRoomId() != null && !request.getSuggestedRoomId().isEmpty()) {
            VBox alternativesBox = new VBox(10);
            alternativesBox.setPadding(new Insets(10, 15, 10, 15));
            alternativesBox.setStyle("-fx-background-color: #f0fdf4; -fx-background-radius: 8; -fx-border-color: #bbf7d0; -fx-border-radius: 8; -fx-border-width: 1;");
            alternativesBox.setAlignment(Pos.CENTER_RIGHT);
            
            Label suggestTitle = new Label("يوجد مقترح بديل متوفر");
            suggestTitle.setStyle("-fx-font-size: 14px; -fx-font-weight: bold; -fx-text-fill: #166534;");
            
            String sRoom = request.getSuggestedRoomId();
            String sDate = request.getSuggestedDate() != null ? request.getSuggestedDate() : dateStr;
            String sFrom = request.getSuggestedTimeFrom() != null ? request.getSuggestedTimeFrom() : tFrom;
            String sTo = request.getSuggestedTimeTo() != null ? request.getSuggestedTimeTo() : tTo;
            
            Label suggestDetails = new Label("القاعة: " + sRoom + "  |  التاريخ: " + sDate + "  |  الوقت: " + sFrom + " - " + sTo);
            suggestDetails.setStyle("-fx-font-size: 13px; -fx-text-fill: #15803d;");
            
            Button acceptBtn = new Button("قبول البديل وإنشاء طلب");
            acceptBtn.setStyle("-fx-background-color: #22c55e; -fx-text-fill: white; -fx-font-weight: bold; -fx-padding: 6 16; -fx-background-radius: 6; -fx-cursor: hand;");
            acceptBtn.setOnAction(e -> {
                if (controller != null) {
                    controller.prefillFormWithSuggestion(request);
                }
            });
            
            alternativesBox.getChildren().addAll(suggestTitle, suggestDetails, acceptBtn);
            mainContainer.getChildren().add(alternativesBox);
        }

        return mainContainer;
    }
    
    private static String getMaterialIconCode(String name) {
        switch (name) {
            case "check_circle": return "\ue86c";
            case "pending_actions": return "\uf1bb";
            case "cancel": return "\ue5c9";
            default: return "\ue88a";
        }
    }
}
