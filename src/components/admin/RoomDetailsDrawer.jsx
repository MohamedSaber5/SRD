import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { roomService } from '../../services/roomService';
import { formatTime } from '../../utils/timeUtils';

export default function RoomDetailsDrawer({ room, isOpen, onClose }) {
  const { t, i18n } = useTranslation();
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
      alert(t('roomManagement.popupBlocked'));
      return;
    }

    const getStatusText = (status) => {
      switch(status) {
        case 'approved': return t('roomManagement.statusApproved');
        case 'pending': return t('roomManagement.statusPending');
        case 'awaiting_manager_final': return t('roomManagement.statusAwaitingManager');
        case 'rejected': return t('roomManagement.statusRejected');
        case 'approved_by_branch': return t('roomManagement.statusApprovedBranch');
        default: return status;
      }
    };

    const htmlContent = `
      <html dir="${i18n.language === 'ar' ? 'rtl' : 'ltr'}" lang="${i18n.language}">
        <head>
          <title>${t('roomManagement.reportTitle')} - ${room.roomNumber}</title>
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
            <h1>${t('roomManagement.reportTitle')} - ${t('roomManagement.room')} ${room.roomNumber}</h1>
            <p>${t('roomManagement.reportDate')}: ${new Date().toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-item"><b>${t('roomManagement.roomTypeLabel')}</b><span>${room.type === 'multi' ? t('roomManagement.roomTypeMulti') : t('roomManagement.roomTypeFixed')}</span></div>
            <div class="info-item"><b>${t('roomManagement.buildingLabel')}</b><span>${room.building}</span></div>
            <div class="info-item"><b>${t('roomManagement.floorLabel')}</b><span>${room.floor}</span></div>
            <div class="info-item"><b>${t('roomManagement.capacityLabel')}</b><span>${room.capacity} ${t('roomManagement.person')}</span></div>
            <div class="info-item"><b>${t('roomManagement.statusLabel')}</b><span>${room.status === 'available' ? t('roomManagement.statusAvailable') : t('roomManagement.statusUnavailable')}</span></div>
          </div>

          <div class="stats">
            <span>${t('roomManagement.totalBookings')}: ${bookings.length}</span>
            <span>${t('roomManagement.activeBookings')}: ${activeBookingsCount}</span>
            <span>${t('roomManagement.previousBookings')}: ${historyBookingsCount}</span>
          </div>

          <h2>${t('roomManagement.bookingLog')}</h2>
          <table>
            <thead>
              <tr>
                <th>${t('roomManagement.tableDate')}</th>
                <th>${t('roomManagement.tableTime')}</th>
                <th>${t('roomManagement.tableResponsible')}</th>
                <th>${t('roomManagement.tablePurpose')}</th>
                <th>${t('roomManagement.tableStatus')}</th>
              </tr>
            </thead>
            <tbody>
              ${[...bookings].sort((a, b) => new Date(b.date) - new Date(a.date)).map(b => `
                <tr>
                  <td>${b.date}</td>
                  <td dir="ltr" style="text-align: left;">${formatTime(b.timeFrom)} - ${formatTime(b.timeTo)}</td>
                  <td>${b.responsibleName || '—'}</td>
                  <td>${b.courseName || b.purpose || (room.type === 'multi' ? t('roomManagement.event') : t('roomManagement.lecture'))}</td>
                  <td>${getStatusText(b.status)}</td>
                </tr>
              `).join('')}
              ${bookings.length === 0 ? `<tr><td colspan="5" style="text-align: center; color: #5a7698;">${t('roomManagement.noBookingsFound')}</td></tr>` : ''}
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rtl p-4" dir="rtl" onClick={onClose}>
        
        {/* Modal */}
        <div 
          className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="px-6 py-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-[#f8fafc] dark:bg-slate-800/50 rounded-t-[2rem] text-right">
            <div>
              <h2 className="text-2xl font-headline font-black text-[#001e40] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">meeting_room</span>
                {t('roomManagement.room')} {room.roomNumber}
              </h2>
              <p className="text-sm font-bold text-gray-500 dark:text-slate-400 mt-1">
                {room.type === 'multi' ? t('roomManagement.roomTypeMulti') : t('roomManagement.roomTypeFixed')}
              </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-all shadow-sm">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/30 text-center">
                <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 mb-2">apartment</span>
                <div className="text-sm font-bold text-gray-500 dark:text-slate-400">{t('roomManagement.buildingLabel')}</div>
                <div className="text-xl font-black text-[#001e40] dark:text-white">{room.building}</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-900/30 text-center">
                <span className="material-symbols-outlined text-purple-500 dark:text-purple-400 mb-2">layers</span>
                <div className="text-sm font-bold text-gray-500 dark:text-slate-400">{t('roomManagement.floorLabel')}</div>
                <div className="text-xl font-black text-[#001e40] dark:text-white">{room.floor}</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 border border-orange-100 dark:border-orange-900/30 text-center">
                <span className="material-symbols-outlined text-orange-500 dark:text-orange-400 mb-2">groups</span>
                <div className="text-sm font-bold text-gray-500 dark:text-slate-400">{t('roomManagement.capacityLabel')}</div>
                <div className="text-xl font-black text-[#001e40] dark:text-white">{room.capacity} {t('roomManagement.person')}</div>
              </div>
              <div className={`rounded-2xl p-4 border text-center ${room.status === 'available' ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30'}`}>
                <span className={`material-symbols-outlined mb-2 ${room.status === 'available' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {room.status === 'available' ? 'check_circle' : 'cancel'}
                </span>
                <div className="text-sm font-bold text-gray-500 dark:text-slate-400">{t('roomManagement.statusLabel')}</div>
                <div className={`text-xl font-black ${room.status === 'available' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {room.status === 'available' ? t('roomManagement.statusAvailable') : t('roomManagement.statusUnavailableShort', 'مغلقة')}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 mb-8 shadow-sm text-right">
              <h3 className="font-bold text-[#001e40] dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-blue-600 dark:text-blue-400">analytics</span>
                {t('roomManagement.bookingStats')}
              </h3>
              {loading ? (
                <div className="text-center py-4 text-gray-400 font-bold animate-pulse">{t('common.loading')}...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-[#f8fafc] dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm font-bold text-gray-600 dark:text-slate-400">{t('roomManagement.activeBookingsLabel', 'حجوزات نشطة (قادمة أو معلقة)')}</span>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 font-black px-3 py-1 rounded-full text-sm">{activeBookingsCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#f8fafc] dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm font-bold text-gray-600 dark:text-slate-400">{t('roomManagement.previousBookingsLabel', 'حجوزات سابقة (أرشيف)')}</span>
                    <span className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 font-black px-3 py-1 rounded-full text-sm">{historyBookingsCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
                    <span className="text-sm font-black text-[#001e40] dark:text-white">{t('roomManagement.totalBookingsLabel', 'إجمالي الحركات على القاعة')}</span>
                    <span className="bg-[#001e40] dark:bg-blue-600 text-white font-black px-3 py-1 rounded-full text-sm">{bookings.length}</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-[2rem]">
            <button 
              onClick={handleDownloadPDF}
              className="w-full bg-[#001e40] dark:bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1e3a5f] dark:hover:bg-blue-700 hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              <span className="material-symbols-outlined">picture_as_pdf</span>
              {t('roomManagement.downloadReport')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
