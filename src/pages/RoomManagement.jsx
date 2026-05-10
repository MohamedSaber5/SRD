import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { roomService } from '../services/roomService';
import RoomTable from '../components/admin/RoomTable';
import RoomFormModal from '../components/admin/RoomFormModal';
import RoomDetailsDrawer from '../components/admin/RoomDetailsDrawer';
import { usePopup } from '../contexts/PopupContext';

export default function RoomManagement() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { showAlert, showConfirm, showPrompt } = usePopup();
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

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
    // Uniqueness check for room name
    const trimmedName = (formData.roomNumber || '').trim().toLowerCase();
    const duplicate = rooms.find(r => {
      if (editingRoom && r.id === editingRoom.id) return false; // skip self when editing
      return (r.roomNumber || '').trim().toLowerCase() === trimmedName;
    });
    if (duplicate) {
      showAlert(`اسم القاعة "${formData.roomNumber}" مستخدم بالفعل. يرجى اختيار اسم مختلف.`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRoom) {
        await roomService.updateRoom(editingRoom.id, formData, currentUser);
        showAlert('تم تحديث القاعة بنجاح', 'success');
      } else {
        // Force status to available on add
        await roomService.addRoom({ ...formData, status: 'available' }, currentUser);
        showAlert('تم إضافة القاعة بنجاح', 'success');
      }
      setIsFormModalOpen(false);
    } catch (error) {
      console.error(error);
      showAlert('حدث خطأ أثناء حفظ القاعة', 'error');
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
        showPrompt(msg, async (input) => {
          if (!input) return; // User cancelled
          
          // Find room by number
          const altRoom = rooms.find(r => r.roomNumber.toLowerCase() === input.trim().toLowerCase());
          if (!altRoom) {
            return showAlert('القاعة البديلة غير موجودة!', 'error');
          }
          if (altRoom.id === room.id) {
            return showAlert('لا يمكن أن تكون القاعة البديلة هي نفسها القاعة المراد حذفها.', 'warning');
          }
          replacementRoomId = altRoom.id;
          
          await proceedWithDeletion(room, replacementRoomId, activeBookings);
        });
      } else {
        showConfirm(`هل أنت متأكد من حذف القاعة ${room.roomNumber} نهائياً؟`, async () => {
          await proceedWithDeletion(room, null, activeBookings);
        });
      }
    } catch (error) {
      console.error(error);
      showAlert(error.message || 'حدث خطأ أثناء فحص الحجوزات.', 'error');
    }
  };

  const proceedWithDeletion = async (room, replacementRoomId, activeBookings) => {
    try {
      await roomService.deleteRoom(room.id, replacementRoomId, activeBookings, currentUser);
      showAlert('تم حذف القاعة بنجاح.', 'success');
      
      if (selectedRoom?.id === room.id) {
        setIsDrawerOpen(false);
      }
    } catch (error) {
      console.error(error);
      showAlert(error.message || 'حدث خطأ أثناء الحذف.', 'error');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full text-[#001e40] dark:text-slate-200 font-bold">{t('common.loading')}</div>;
  }

  return (
    <div className="w-full h-full pb-20 px-4 rtl pt-8" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
        <div>
          <h1 className="text-4xl font-headline font-bold text-[#001e40] dark:text-white tracking-tight">{t('roomManagement.title')}</h1>
          <p className="text-[#5a7698] dark:text-slate-400 mt-2 text-lg">{t('roomManagement.subtitle')}</p>
        </div>
        <button 
          onClick={handleAddNewClick}
          className="mt-4 md:mt-0 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span>
          {t('roomManagement.addBtn')}
        </button>
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
