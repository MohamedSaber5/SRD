import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';

export default function EditBookingModal({ booking, isOpen, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    date: '',
    timeFrom: '',
    timeTo: '',
    purpose: '',
    reqMic: false,
    reqMicQty: 1,
    reqLaptop: false,
    reqVideoConf: false,
    roomId: '',
    roomType: ''
  });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking) {
      setFormData({
        date: booking.date || '',
        timeFrom: booking.timeFrom || '',
        timeTo: booking.timeTo || '',
        purpose: booking.purpose || '',
        reqMic: booking.reqMic || false,
        reqMicQty: booking.reqMicQty || 1,
        reqLaptop: booking.reqLaptop || false,
        reqVideoConf: booking.reqVideoConf || false,
        roomId: booking.roomId || '',
        roomType: booking.roomType || 'multi'
      });
    }

    const fetchRooms = async () => {
      const q = query(collection(db, 'rooms'), where('type', '==', 'multi'));
      const snap = await getDocs(q);
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchRooms();
  }, [booking]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      
      // 1. Update the booking
      await updateDoc(bookingRef, {
        ...formData,
        modifiedBy: 'branch_manager',
        modifiedAt: serverTimestamp()
      });

      // 2. Create notification for the user
      await addDoc(collection(db, 'notifications'), {
        userId: booking.userId,
        message: "تم تعديل حجزك من قبل مدير الفرع",
        bookingId: booking.id,
        type: 'modification',
        read: false,
        createdAt: serverTimestamp()
      });

      // 3. Create VIP notification for admin
      const qAdmins = query(collection(db, 'users'), where('role', 'in', ['admin', 'super_admin'])); // support admin roles
      const adminsSnap = await getDocs(qAdmins);
      const notifyTasks = adminsSnap.docs.map(aDoc => addDoc(collection(db, 'notifications'), {
           userId: aDoc.id,
           title: 'تعديل على حجز متعدد الإغراض',
           message: `قام مدير الفرع بتعديل بيانات حجز القاعة (${formData.roomId}) الخاص بـ ${booking.responsibleName}`,
           type: 'vip_alert',
           bookingId: booking.id,
           isRead: false,
           createdAt: serverTimestamp()
      }));
      await Promise.all(notifyTasks);

      alert('تم تعديل الحجز وإرسال إشعار للمسؤول');
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء التعديل');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 rtl" dir="rtl">
      <div className="bg-surface-container-lowest rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300 border border-surface-container-high">
        {/* Header Style */}
        <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-headline font-bold">تعديل تفاصيل الحجز</h3>
            <p className="text-white/80 text-sm mt-1">تعديل بيانات الحجز رقم: {booking.id.slice(0,8)}...</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Room Selection */}
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="block text-sm font-bold text-on-surface-variant">تغيير القاعة</label>
              <select 
                name="roomId" 
                value={formData.roomId} 
                onChange={handleChange}
                className="w-full bg-surface-container-high rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary appearance-none border-none"
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.roomNumber} (سعة: {r.capacity})</option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="col-span-1 space-y-2">
              <label className="block text-sm font-bold text-on-surface-variant">التاريخ</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full bg-surface-container-high rounded-xl px-4 py-3 border-none" required />
            </div>

            <div className="col-span-1 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface-variant">من</label>
                <input type="time" name="timeFrom" value={formData.timeFrom} onChange={handleChange} className="w-full bg-surface-container-high rounded-xl px-4 py-3 border-none text-center" required />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface-variant">إلى</label>
                <input type="time" name="timeTo" value={formData.timeTo} onChange={handleChange} className="w-full bg-surface-container-high rounded-xl px-4 py-3 border-none text-center" required />
              </div>
            </div>

            {/* Purpose */}
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="block text-sm font-bold text-on-surface-variant">الغرض من الاستخدام</label>
              <textarea 
                name="purpose" 
                value={formData.purpose} 
                onChange={handleChange} 
                rows="3" 
                className="w-full bg-surface-container-high rounded-xl px-4 py-3 border-none resize-none" 
                required
              />
            </div>

            {/* Tech Requirements */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-on-surface-variant mb-4">التجهيزات والمتطلبات</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-surface-container transition-colors">
                  <input type="checkbox" name="reqLaptop" checked={formData.reqLaptop} onChange={handleChange} className="w-5 h-5 text-primary rounded" />
                  <span className="text-sm font-medium">جهاز حاسب آلي</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-surface-container transition-colors">
                  <input type="checkbox" name="reqVideoConf" checked={formData.reqVideoConf} onChange={handleChange} className="w-5 h-5 text-primary rounded" />
                  <span className="text-sm font-medium">Video Conference</span>
                </label>
                <div className="col-span-full flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 border rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input type="checkbox" name="reqMic" checked={formData.reqMic} onChange={handleChange} className="w-5 h-5 text-primary rounded" />
                    <span className="text-sm font-medium">ميكروفونات متحركة</span>
                  </label>
                  {formData.reqMic && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">العدد:</span>
                      <input type="number" name="reqMicQty" min="1" max="10" value={formData.reqMicQty} onChange={handleChange} className="w-16 bg-surface-container-high rounded px-2 py-1 text-center" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex gap-4 border-t pt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-primary text-white rounded-xl py-3 font-bold hover:scale-[1.02] transition-transform shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <span className="animate-spin material-symbols-outlined">sync</span> : <span className="material-symbols-outlined">save</span>}
              حفظ التعديلات وإرسال إشعار
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="px-8 bg-surface-container-highest text-on-surface rounded-xl py-3 font-bold hover:bg-outline-variant/30 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
