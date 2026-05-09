import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { roomService } from '../services/roomService';
import RoomTable from '../components/admin/RoomTable';
import RoomFormModal from '../components/admin/RoomFormModal';
import RoomDetailsDrawer from '../components/admin/RoomDetailsDrawer';

export default function RoomManagement() {
  const { currentUser } = useAuth();
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Search State
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTimeFrom, setSearchTimeFrom] = useState('08:00');
  const [searchTimeTo, setSearchTimeTo] = useState('10:00');
  const [searchRoomType, setSearchRoomType] = useState('all');
  const [emptyRoomsResult, setEmptyRoomsResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

  // Load Rooms (Observer Pattern)
  useEffect(() => {
    const unsubscribe = roomService.subscribeToRooms((fetchedRooms) => {
      setRooms(fetchedRooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handlers
  const handleAddNewClick = () => {
    setEditingRoom(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (room) => {
    setEditingRoom(room);
    setIsFormModalOpen(true);
  };

  const handleRowClick = (room) => {
    setSelectedRoom(room);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingRoom) {
        await roomService.updateRoom(editingRoom.id, formData, currentUser);
        alert('تم تحديث القاعة بنجاح');
      } else {
        await roomService.addRoom(formData, currentUser);
        alert('تم إضافة القاعة بنجاح');
      }
      setIsFormModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء حفظ القاعة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (room) => {
    try {
      // Check for active bookings first
      const activeBookings = await roomService.getActiveBookingsForRoom(room.id);
      
      let replacementRoomId = null;
      if (activeBookings.length > 0) {
        // Needs a replacement room
        const msg = `هذه القاعة بها ${activeBookings.length} حجوزات نشطة. الرجاء إدخال الرقم التعريفي للقاعة البديلة (مثال: A-102) لترحيل الحجوزات إليها:`;
        const input = window.prompt(msg);
        
        if (input === null) return; // User cancelled
        
        // Find room by number
        const altRoom = rooms.find(r => r.roomNumber.toLowerCase() === input.trim().toLowerCase());
        if (!altRoom) {
          return alert('القاعة البديلة غير موجودة!');
        }
        if (altRoom.id === room.id) {
          return alert('لا يمكن أن تكون القاعة البديلة هي نفسها القاعة المراد حذفها.');
        }
        replacementRoomId = altRoom.id;
      } else {
        if (!window.confirm(`هل أنت متأكد من حذف القاعة ${room.roomNumber} نهائياً؟`)) return;
      }

      await roomService.deleteRoom(room.id, replacementRoomId, activeBookings, currentUser);
      alert('تم حذف القاعة بنجاح.');
      
      if (selectedRoom?.id === room.id) {
        setIsDrawerOpen(false);
      }
    } catch (error) {
      console.error(error);
      alert(error.message || 'حدث خطأ أثناء الحذف.');
    }
  };

  const handleSearchEmptyRooms = async () => {
    if (searchTimeFrom >= searchTimeTo) {
      return alert("وقت البداية يجب أن يكون قبل وقت الانتهاء");
    }
    setIsSearching(true);
    try {
      const activeBookings = await roomService.getBookingsByDate(searchDate);
      
      const overlappingBookings = activeBookings.filter(b => {
        const bookingStart = b.timeFrom;
        let bookingEnd = b.timeTo;
        if (!bookingEnd) {
           const startIndex = timeSlots.indexOf(bookingStart);
           bookingEnd = startIndex !== -1 && startIndex < timeSlots.length - 1 ? timeSlots[startIndex + 1] : '22:00';
        }

        // Intersect condition: StartA < EndB && EndA > StartB
        return searchTimeFrom < bookingEnd && searchTimeTo > bookingStart;
      });

      const occupiedRoomIds = overlappingBookings.map(b => b.roomId);

      const available = rooms.filter(r => {
        if (r.status === 'unavailable') return false; 
        if (searchRoomType !== 'all' && r.type !== searchRoomType) return false;
        if (occupiedRoomIds.includes(r.id)) return false;
        return true;
      });

      setEmptyRoomsResult(available);
    } catch (error) {
      console.error(error);
      alert('خطأ أثناء البحث عن القاعات المتاحة');
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full text-[#001e40] font-bold">جاري تحميل القاعات...</div>;
  }

  return (
    <div className="w-full h-full pb-20 px-4 rtl pt-8" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
        <div>
          <h1 className="text-4xl font-headline font-bold text-[#001e40] tracking-tight">إدارة القاعات والمدرجات</h1>
          <p className="text-[#5a7698] mt-2 text-lg">التحكم الشامل في قواعد البيانات وإضافة وإزالة القاعات وتوليد التقارير.</p>
        </div>
        <button 
          onClick={handleAddNewClick}
          className="mt-4 md:mt-0 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span>
          إضافة قاعة جديدة
        </button>
      </div>

      {/* Advanced Search for Empty Rooms */}
      <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 w-full mb-8">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">search</span>
           </div>
           <div>
             <h2 className="text-2xl font-headline font-black text-[#001e40]">البحث المتقدم (القاعات المتاحة)</h2>
             <p className="text-sm font-bold text-[#5a7698]">ابحث عن القاعات المتاحة في تاريخ ووقت محدد (مفيد لقاعات متعددة الأغراض أو السكاشن الاستثنائية).</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
           <div className="space-y-2">
             <label className="block text-xs font-bold text-[#5a7698] uppercase">تاريخ البحث</label>
             <input 
               type="date" 
               value={searchDate} 
               onChange={(e) => setSearchDate(e.target.value)} 
               className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none" 
             />
           </div>
           <div className="space-y-2">
             <label className="block text-xs font-bold text-[#5a7698] uppercase">من الساعة</label>
             <select 
               value={searchTimeFrom} 
               onChange={(e) => setSearchTimeFrom(e.target.value)} 
               className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none" dir="ltr"
             >
               {timeSlots.map(t => <option key={`from-${t}`} value={t}>{t}</option>)}
             </select>
           </div>
           <div className="space-y-2">
             <label className="block text-xs font-bold text-[#5a7698] uppercase">إلى الساعة</label>
             <select 
               value={searchTimeTo} 
               onChange={(e) => setSearchTimeTo(e.target.value)} 
               className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none" dir="ltr"
             >
               {timeSlots.map(t => <option key={`to-${t}`} value={t}>{t}</option>)}
             </select>
           </div>
           <div className="space-y-2">
             <label className="block text-xs font-bold text-[#5a7698] uppercase">نوع القاعة</label>
             <select 
               value={searchRoomType} 
               onChange={(e) => setSearchRoomType(e.target.value)} 
               className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none"
             >
               <option value="all">الجميع</option>
               <option value="fixed">قاعات السكاشن (عادية)</option>
               <option value="multi">متعددة الأغراض</option>
             </select>
           </div>
        </div>

        <button 
          onClick={handleSearchEmptyRooms}
          disabled={isSearching}
          className="w-full bg-[#001e40] hover:bg-[#1e3a5f] text-white px-6 py-4 rounded-xl font-bold transition-all shadow-md hover:-translate-y-1 flex items-center justify-center gap-2"
        >
           <span className="material-symbols-outlined">{isSearching ? 'hourglass_empty' : 'zoom_in'}</span>
           {isSearching ? 'جاري البحث...' : 'عرض القاعات المتاحة'}
        </button>

        {emptyRoomsResult && (
          <div className="mt-8 pt-8 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4">
             <h3 className="text-xl font-headline font-black text-[#001e40] mb-4 flex items-center gap-2">
               نتيجة البحث: <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">{emptyRoomsResult.length} قاعة متاحة</span>
             </h3>
             {emptyRoomsResult.length > 0 ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {emptyRoomsResult.map(r => (
                   <div key={r.id} className="bg-green-50 border border-green-200 rounded-xl p-4 text-center hover:bg-green-100 hover:border-green-300 transition-colors shadow-sm cursor-pointer" onClick={() => handleRowClick(r)}>
                     <div className="font-black text-green-800 text-xl font-headline mb-1">{r.roomNumber}</div>
                     <div className="text-xs font-bold text-green-600">{r.type === 'multi' ? 'متعددة الأغراض' : 'محاضرات عادية'}</div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-500 font-bold">
                 لم نجد أي قاعات متاحة مطابقة لشروط البحث (في هذا الوقت).
               </div>
             )}
          </div>
        )}
      </div>

      {/* Main Table */}
      <RoomTable 
        rooms={rooms} 
        onEditClick={handleEditClick} 
        onDeleteClick={handleDeleteClick} 
        onRowClick={handleRowClick} 
      />

      {/* Form Modal (Add / Edit) */}
      <RoomFormModal 
        isOpen={isFormModalOpen} 
        onClose={() => setIsFormModalOpen(false)} 
        onSubmit={handleFormSubmit}
        initialData={editingRoom}
        isSubmitting={isSubmitting}
      />

      {/* Details & PDF Drawer */}
      <RoomDetailsDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        room={selectedRoom} 
      />

    </div>
  );
}
