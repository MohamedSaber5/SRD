import React, { useState, useEffect } from 'react';
import { roomService } from '../services/roomService';
import { REGULAR_SLOTS, RAMADAN_SLOTS, getHourOptions } from '../hooks/useBookingForm';
import { usePopup } from '../contexts/PopupContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { formatTime } from '../utils/timeUtils';

// --- Strategy Pattern & Factory for Search ---
class SearchStrategy {
  validateInput(data) { throw new Error('Not implemented'); }
  filterBookings(activeBookings, data) { throw new Error('Not implemented'); }
}

class MultiRoomSearchStrategy extends SearchStrategy {
  validateInput({ timeFrom, timeTo }) {
    if (!timeFrom || !timeTo) return "يرجى تحديد وقت البداية والنهاية.";
    if (timeTo <= timeFrom) return "وقت النهاية يجب أن يكون بعد وقت البداية.";
    return null;
  }
  filterBookings(activeBookings, { timeFrom, timeTo }) {
    return activeBookings.filter(b => {
      const bookingEnd = b.timeTo || '23:00';
      return timeFrom < bookingEnd && timeTo > b.timeFrom;
    });
  }
}

class FixedRoomSearchStrategy extends SearchStrategy {
  validateInput({ selectedSlot }) {
    if (!selectedSlot) return "يرجى اختيار فترة المحاضرة.";
    return null;
  }
  filterBookings(activeBookings, { selectedSlot }) {
    return activeBookings.filter(b => b.timeFrom === selectedSlot.from && b.timeTo === selectedSlot.to);
  }
}

class SearchStrategyFactory {
  static createStrategy(roomType) {
    if (roomType === 'multi') return new MultiRoomSearchStrategy();
    if (roomType === 'fixed') return new FixedRoomSearchStrategy();
    throw new Error('Unknown room type strategy');
  }
}

export default function AdvancedRoomSearch() {
  const [rooms, setRooms] = useState([]);
  const [isRamadanMode, setIsRamadanMode] = useState(false);
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchRoomType, setSearchRoomType] = useState('multi');
  const [searchCapacity, setSearchCapacity] = useState('');
  const { showAlert } = usePopup();
  
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [selectedSlotIdx, setSelectedSlotIdx] = useState('');

  const [emptyRoomsResult, setEmptyRoomsResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Determine max end time based on mode
  const multiMaxTime = isRamadanMode ? '17:00' : '23:00';
  const hourOptionsFrom = getHourOptions('23:00');
  const hourOptionsTo   = getHourOptions(multiMaxTime);
  const activeSlots = isRamadanMode ? RAMADAN_SLOTS : REGULAR_SLOTS;

  useEffect(() => {
    const unsubscribeRooms = roomService.subscribeToRooms(setRooms);
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'system'), (snap) => {
      if (snap.exists()) setIsRamadanMode(!!snap.data().isRamadanMode);
    });
    return () => { unsubscribeRooms(); unsubscribeSettings(); };
  }, []);

  // When Ramadan mode changes, reset time selections if they're out of range
  useEffect(() => {
    setTimeFrom('');
    setTimeTo('');
    setSelectedSlotIdx('');
    setEmptyRoomsResult(null);
  }, [isRamadanMode]);

  const handleSearch = async () => {
    const strategy = SearchStrategyFactory.createStrategy(searchRoomType);
    const data = searchRoomType === 'multi' 
        ? { timeFrom, timeTo } 
        : { selectedSlot: selectedSlotIdx !== '' ? activeSlots[Number(selectedSlotIdx)] : null };
        
    const errorMsg = strategy.validateInput(data);
    if (errorMsg) return showAlert(errorMsg, 'warning');

    setIsSearching(true);
    try {
      const activeBookings = await roomService.getBookingsByDate(searchDate);
      const occupiedRoomIds = strategy.filterBookings(activeBookings, data).map(b => b.roomId);

      const available = rooms.filter(r => {
        if (r.status === 'unavailable') return false; 
        if (r.type !== searchRoomType) return false;
        if (searchCapacity && Number(r.capacity) < Number(searchCapacity)) return false;
        if (occupiedRoomIds.includes(r.id)) return false;
        return true;
      });

      setEmptyRoomsResult(available);
    } catch (error) {
      console.error(error);
      showAlert('خطأ أثناء البحث عن القاعات المتاحة', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full h-full pb-20 px-4 rtl pt-8 animate-in fade-in text-on-surface dark:text-slate-100" dir="rtl">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-headline font-black text-primary dark:text-blue-300 tracking-tight">البحث المتقدم للقاعات</h1>
          <p className="text-on-surface-variant dark:text-slate-400 mt-2 text-lg">أداة متقدمة للاستعلام الدقيق عن شغور القاعات بناءً على نوعها وسعتها والفترات الزمنية.</p>
        </div>
        {/* Ramadan mode badge (read-only indicator) */}
        {isRamadanMode && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-800 rounded-xl text-orange-700 dark:text-orange-300 font-bold text-sm">
            <span className="material-symbols-outlined text-[18px]">brightness_high</span>
            وضع رمضان مفعّل — مواعيد المحاضرات مُحدَّثة
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-slate-800 p-8 w-full mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
           <div className="space-y-2">
             <label className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase">نوع القاعة</label>
             <select 
               value={searchRoomType} 
               onChange={(e) => { setSearchRoomType(e.target.value); setEmptyRoomsResult(null); setSelectedSlotIdx(''); setTimeFrom(''); setTimeTo(''); }} 
               className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-100 font-black focus:ring-2 focus:ring-primary outline-none"
             >
               <option value="multi" className="dark:bg-slate-900">متعددة الأغراض</option>
               <option value="fixed" className="dark:bg-slate-900">قاعات السكاشن (عادية)</option>
             </select>
           </div>
           
           <div className="space-y-2">
             <label className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase">تاريخ البحث</label>
             <input 
               type="date" 
               value={searchDate} 
               onChange={(e) => setSearchDate(e.target.value)} 
               className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-100 font-black focus:ring-2 focus:ring-primary outline-none text-right" 
             />
           </div>

           <div className="space-y-2">
             <label className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase">السعة المطلوبة (اختياري)</label>
             <input 
               type="number" 
               min="1"
               placeholder="مثال: 50"
               value={searchCapacity} 
               onChange={(e) => setSearchCapacity(e.target.value)} 
               className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-100 font-black focus:ring-2 focus:ring-primary outline-none text-right placeholder:text-gray-400 dark:placeholder:text-slate-600" 
             />
           </div>

           {searchRoomType === 'multi' ? (
             <>
               <div className="space-y-2">
                 <label className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase">من الساعة</label>
                 <select 
                   value={timeFrom} 
                   onChange={(e) => setTimeFrom(e.target.value)} 
                   className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-100 font-black focus:ring-2 focus:ring-primary outline-none" dir="ltr"
                 >
                   <option value="" className="dark:bg-slate-900">اختر وقت البداية...</option>
                   {hourOptionsFrom.map(opt => <option key={`from-${opt.value}`} value={opt.value} className="dark:bg-slate-900">{opt.label}</option>)}
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase">
                   إلى الساعة {isRamadanMode && <span className="text-orange-500 normal-case">(حد رمضان: {formatTime(multiMaxTime)})</span>}
                 </label>
                 <select 
                   value={timeTo} 
                   onChange={(e) => setTimeTo(e.target.value)} 
                   className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-100 font-black focus:ring-2 focus:ring-primary outline-none" dir="ltr"
                 >
                   <option value="" className="dark:bg-slate-900">اختر وقت النهاية...</option>
                   {hourOptionsTo.map(opt => (
                     <option 
                       key={`to-${opt.value}`} 
                       value={opt.value}
                       disabled={timeFrom && opt.value <= timeFrom}
                       className="dark:bg-slate-900"
                     >
                       {opt.label}
                     </option>
                   ))}
                 </select>
               </div>
             </>
           ) : (
             <div className="space-y-2 md:col-span-2">
               <label className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase">
                 فترة المحاضرة {isRamadanMode && <span className="text-orange-500 normal-case">(جدول رمضان)</span>}
               </label>
               <select 
                 value={selectedSlotIdx} 
                 onChange={(e) => setSelectedSlotIdx(e.target.value)} 
                 className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-100 font-black focus:ring-2 focus:ring-primary outline-none"
               >
                 <option value="" className="dark:bg-slate-900">اختر فترة المحاضرة...</option>
                 {activeSlots.map((s, idx) => (
                   <option key={idx} value={idx} className="dark:bg-slate-900">{s.label}</option>
                 ))}
               </select>
             </div>
           )}
        </div>

        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full bg-primary hover:bg-primary/90 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-md hover:-translate-y-1 flex items-center justify-center gap-2"
        >
           <span className="material-symbols-outlined">{isSearching ? 'hourglass_empty' : 'zoom_in'}</span>
           {isSearching ? 'جاري البحث...' : 'بحث عن القاعات المتاحة'}
        </button>

        {emptyRoomsResult && (
          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4">
             <h3 className="text-xl font-headline font-black text-on-surface dark:text-slate-100 mb-4 flex items-center gap-2">
               نتيجة البحث: <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm">{emptyRoomsResult.length} قاعة متاحة</span>
             </h3>
             {emptyRoomsResult.length > 0 ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {emptyRoomsResult.map(r => (
                   <div key={r.id} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors shadow-sm cursor-default">
                     <div className="font-black text-green-800 dark:text-green-300 text-xl font-headline mb-1">{r.roomNumber}</div>
                     <div className="text-xs font-bold text-green-600 dark:text-green-400 mb-1">{r.type === 'multi' ? 'متعددة الأغراض' : 'محاضرات عادية'}</div>
                     <div className="text-xs text-green-700 dark:text-green-400 font-bold bg-green-200/50 dark:bg-green-800/30 rounded py-1">سعة: {r.capacity}</div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-slate-600 mb-2">search_off</span>
                  <p className="text-gray-500 dark:text-slate-400 font-bold">عذراً، لا توجد قاعات متاحة تطابق معايير البحث.</p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
