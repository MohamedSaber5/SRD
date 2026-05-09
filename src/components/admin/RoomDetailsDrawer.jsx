import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { roomService } from '../../services/roomService';

export default function RoomDetailsDrawer({ room, isOpen, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (room && isOpen) {
      const fetchBookings = async () => {
        setLoading(true);
        try {
          const roomBookings = await roomService.getAllBookingsForRoom(room.id);
          setBookings(roomBookings);
        } catch (error) {
          console.error("Error fetching room bookings:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchBookings();
    }
  }, [room, isOpen]);

  if (!isOpen || !room) return null;

  const activeBookingsCount = bookings.filter(b => ['pending', 'awaiting_manager_final', 'approved', 'approved_by_branch'].includes(b.status)).length;
  const historyBookingsCount = bookings.length - activeBookingsCount;

  // Factory Method Pattern logic inside the PDF generation based on room type
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
    // Add custom font for Arabic if needed (requires base64 font registration, using default for now, which may not support full Arabic, 
    // ideally in a real app we'd load an Arabic font, but we'll stick to a simple clean layout).
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(0, 30, 64);
    doc.text(`Room Report: ${room.roomNumber}`, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // Room Details Section
    doc.setDrawColor(200);
    doc.line(14, 35, 196, 35);
    
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text(`Type: ${room.type === 'multi' ? 'Multi-purpose' : 'Fixed Lecture'}`, 14, 45);
    doc.text(`Building: ${room.building} | Floor: ${room.floor}`, 14, 52);
    doc.text(`Capacity: ${room.capacity} students`, 14, 59);
    doc.text(`Status: ${room.status === 'available' ? 'Available' : 'Unavailable'}`, 14, 66);
    
    doc.text(`Total Active Bookings: ${activeBookingsCount}`, 120, 45);
    doc.text(`Total History Bookings: ${historyBookingsCount}`, 120, 52);

    // Bookings Table
    const tableColumn = ["Date", "Time", "Responsible", "Course/Event", "Status"];
    const tableRows = [];

    // Sort bookings by date descending
    const sortedBookings = [...bookings].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedBookings.forEach(booking => {
      const bookingData = [
        booking.date,
        `${booking.timeFrom} - ${booking.timeTo || 'N/A'}`,
        booking.responsibleName || 'N/A',
        booking.courseName || (room.type === 'multi' ? 'Event' : 'Lecture'),
        booking.status
      ];
      tableRows.push(bookingData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [0, 30, 64], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`Room_${room.roomNumber}_Report.pdf`);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform rtl" dir="rtl">
        <div className="h-full flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-6 border-b border-gray-100 flex justify-between items-center bg-[#f8fafc]">
            <div>
              <h2 className="text-2xl font-headline font-black text-[#001e40] flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">meeting_room</span>
                قاعة {room.roomNumber}
              </h2>
              <p className="text-sm font-bold text-gray-500 mt-1">
                {room.type === 'multi' ? 'متعددة الأغراض' : 'محاضرات عادية'}
              </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-all shadow-sm">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-center">
                <span className="material-symbols-outlined text-blue-500 mb-2">apartment</span>
                <div className="text-sm font-bold text-gray-500">مبنى</div>
                <div className="text-xl font-black text-[#001e40]">{room.building}</div>
              </div>
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 text-center">
                <span className="material-symbols-outlined text-purple-500 mb-2">layers</span>
                <div className="text-sm font-bold text-gray-500">الدور</div>
                <div className="text-xl font-black text-[#001e40]">{room.floor}</div>
              </div>
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 text-center">
                <span className="material-symbols-outlined text-orange-500 mb-2">groups</span>
                <div className="text-sm font-bold text-gray-500">السعة</div>
                <div className="text-xl font-black text-[#001e40]">{room.capacity} فرد</div>
              </div>
              <div className={`rounded-2xl p-4 border text-center ${room.status === 'available' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                <span className={`material-symbols-outlined mb-2 ${room.status === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                  {room.status === 'available' ? 'check_circle' : 'cancel'}
                </span>
                <div className="text-sm font-bold text-gray-500">الحالة</div>
                <div className={`text-xl font-black ${room.status === 'available' ? 'text-green-700' : 'text-red-700'}`}>
                  {room.status === 'available' ? 'متاحة' : 'مغلقة'}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-8 shadow-sm">
              <h3 className="font-bold text-[#001e40] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">analytics</span>
                إحصائيات الحجوزات
              </h3>
              {loading ? (
                <div className="text-center py-4 text-gray-400 font-bold animate-pulse">جاري جلب البيانات...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-bold text-gray-600">حجوزات نشطة (قادمة أو معلقة)</span>
                    <span className="bg-blue-100 text-blue-800 font-black px-3 py-1 rounded-full text-sm">{activeBookingsCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-bold text-gray-600">حجوزات سابقة (أرشيف)</span>
                    <span className="bg-gray-200 text-gray-700 font-black px-3 py-1 rounded-full text-sm">{historyBookingsCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#f8fafc] border border-gray-200 rounded-xl">
                    <span className="text-sm font-black text-[#001e40]">إجمالي الحركات على القاعة</span>
                    <span className="bg-[#001e40] text-white font-black px-3 py-1 rounded-full text-sm">{bookings.length}</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-100 bg-white">
            <button 
              onClick={handleDownloadPDF}
              className="w-full bg-[#001e40] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1e3a5f] hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              <span className="material-symbols-outlined">picture_as_pdf</span>
              تحميل تقرير القاعة (PDF)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
