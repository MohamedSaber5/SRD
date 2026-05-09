import React, { useState, useEffect } from 'react';
import { roomService } from '../../services/roomService';
import { formatTime } from '../../utils/timeUtils';

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

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("الرجاء السماح بالنوافذ المنبثقة (Pop-ups) لطباعة التقرير");
      return;
    }

    const getStatusArabic = (status) => {
      switch(status) {
        case 'approved': return 'معتمد';
        case 'pending': return 'قيد الانتظار';
        case 'awaiting_manager_final': return 'انتظار المدير';
        case 'rejected': return 'مرفوض';
        case 'approved_by_branch': return 'معتمد فرعياً';
        default: return status;
      }
    };

    const htmlContent = `
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير قاعة ${room.roomNumber}</title>
          <style>
            body { font-family: Tahoma, Arial, sans-serif; padding: 40px; color: #001e40; background: #fff; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #001e40; padding-bottom: 20px; }
            .header h1 { margin: 0 0 10px 0; font-size: 28px; }
            .header p { color: #5a7698; margin: 0; font-size: 14px; }
            .info-grid { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 40px; }
            .info-item { background: #f8fafc; padding: 15px; border-radius: 8px; flex: 1; min-width: 150px; border: 1px solid #e2e8f0; text-align: center; }
            .info-item b { display: block; color: #5a7698; font-size: 12px; margin-bottom: 5px; }
            .info-item span { font-size: 18px; font-weight: bold; color: #001e40; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { padding: 12px 15px; text-align: right; border-bottom: 1px solid #e2e8f0; }
            th { background-color: #001e40; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .stats { display: flex; justify-content: space-between; background: #eef2f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير تفصيلي - قاعة ${room.roomNumber}</h1>
            <p>تاريخ استخراج التقرير: ${new Date().toLocaleString('ar-EG')}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-item"><b>نوع القاعة</b><span>${room.type === 'multi' ? 'متعددة الأغراض' : 'محاضرات عادية'}</span></div>
            <div class="info-item"><b>المبنى</b><span>${room.building}</span></div>
            <div class="info-item"><b>الدور</b><span>${room.floor}</span></div>
            <div class="info-item"><b>السعة</b><span>${room.capacity} فرد</span></div>
            <div class="info-item"><b>الحالة</b><span>${room.status === 'available' ? 'متاحة' : 'مغلقة للصيانة'}</span></div>
          </div>

          <div class="stats">
            <span>إجمالي الحجوزات: ${bookings.length}</span>
            <span>نشطة: ${activeBookingsCount}</span>
            <span>سابقة: ${historyBookingsCount}</span>
          </div>

          <h2>سجل الحجوزات</h2>
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الوقت</th>
                <th>المسؤول</th>
                <th>الغرض / المادة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${[...bookings].sort((a, b) => new Date(b.date) - new Date(a.date)).map(b => `
                <tr>
                  <td>${b.date}</td>
                  <td dir="ltr" style="text-align: left;">${formatTime(b.timeFrom)} - ${formatTime(b.timeTo)}</td>
                  <td>${b.responsibleName || '—'}</td>
                  <td>${b.courseName || b.purpose || (room.type === 'multi' ? 'حدث' : 'محاضرة')}</td>
                  <td>${getStatusArabic(b.status)}</td>
                </tr>
              `).join('')}
              ${bookings.length === 0 ? '<tr><td colspan="5" style="text-align: center; color: #5a7698;">لا توجد حجوزات مسجلة لهذه القاعة.</td></tr>' : ''}
            </tbody>
          </table>
          <script>
            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <>
      {/* Backdrop & Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rtl p-4" dir="rtl" onClick={onClose}>
        
        {/* Modal */}
        <div 
          className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] border border-gray-100 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="px-6 py-6 border-b border-gray-100 flex justify-between items-center bg-[#f8fafc] rounded-t-[2rem]">
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
          <div className="p-6 border-t border-gray-100 bg-white rounded-b-[2rem]">
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
