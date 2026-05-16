package com.aast.booking.admin;

import com.aast.booking.models.Booking;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;

import java.util.function.Consumer;

public class RequestCardController {

    @FXML private Label lblTitle;
    @FXML private Label lblTypeBadge;
    @FXML private Label lblRoomTypeBadge;
    @FXML private Label lblCreatedAt;
    
    @FXML private Label lblDate;
    @FXML private Label lblTimeRange;
    
    @FXML private Label lblResponsibleJob;
    @FXML private Label lblResponsibleName;
    
    @FXML private Label lblCapacity;
    @FXML private Label lblRoomTypeDesc;
    
    @FXML private Label lblPurpose;
    @FXML private Label lblRequester;

    @FXML private Button btnApprove;
    @FXML private Button btnReject;

    private Booking booking;
    private Consumer<Booking> onApproveAction;
    private Consumer<Booking> onRejectAction;

    public void setBooking(Booking booking, Consumer<Booking> onApprove, Consumer<Booking> onReject) {
        this.booking = booking;
        this.onApproveAction = onApprove;
        this.onRejectAction = onReject;

        // Populate data
        boolean isMulti = "multi".equals(booking.getRoomType());
        lblTitle.setText(isMulti ? "قاعة متعددة الأغراض" : "طلب قاعة استثنائية");
        lblTypeBadge.setText("طلب جديد");
        lblRoomTypeBadge.setText(isMulti ? "متعددة الأغراض" : "محاضرات");
        
        if (booking.getCreatedAt() != null) {
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy/MM/dd  hh:mm a", new java.util.Locale("ar"));
            lblCreatedAt.setText(sdf.format(booking.getCreatedAt()));
        } else {
            lblCreatedAt.setText("غير متوفر");
        }
        
        lblDate.setText(booking.getDate() != null ? booking.getDate() : "-");
        lblTimeRange.setText(
            (booking.getTimeFrom() != null ? booking.getTimeFrom() : "-") + " — " + 
            (booking.getTimeTo() != null ? booking.getTimeTo() : "-")
        );

        lblResponsibleJob.setText(booking.getResponsibleJob() != null && !booking.getResponsibleJob().isEmpty() ? booking.getResponsibleJob() : "لا توجد صفة");
        lblResponsibleName.setText(booking.getResponsibleName() != null && !booking.getResponsibleName().isEmpty() ? booking.getResponsibleName() : "-");

        lblCapacity.setText(booking.getRequiredCapacity() > 0 ? String.valueOf(booking.getRequiredCapacity()) + " شخص" : "لم تحدد السعة");
        lblRoomTypeDesc.setText(isMulti ? "قاعة متعددة الأغراض" : "قاعة محاضرات");

        lblPurpose.setText(booking.getPurpose() != null && !booking.getPurpose().isEmpty() ? booking.getPurpose() : "-");
        lblRequester.setText(booking.getUserName() != null ? booking.getUserName() : "-");
    }

    @FXML
    private void handleApprove() {
        if (onApproveAction != null && booking != null) {
            onApproveAction.accept(booking);
        }
    }

    @FXML
    private void handleReject() {
        if (onRejectAction != null && booking != null) {
            onRejectAction.accept(booking);
        }
    }

    @FXML
    private void consumeClick(javafx.scene.input.MouseEvent event) {
        event.consume(); // Prevent click from bubbling up to the card's detail overlay handler
    }
}
