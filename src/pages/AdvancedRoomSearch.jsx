import React, { useState, useEffect } from 'react';
import { roomService } from '../services/roomService';
import { REGULAR_SLOTS, getHourOptions } from '../hooks/useBookingForm';
import { usePopup } from '../contexts/PopupContext';

// --- Strategy Pattern & Factory for Search ---

// Base Strategy
class SearchStrategy {
  validateInput(data) { throw new Error('Not implemented'); }
  filterBookings(activeBookings, data) { throw new Error('Not implemented'); }
}

// Multi-Room Strategy
class MultiRoomSearchStrategy extends SearchStrategy {
  validateInput({ timeFrom, timeTo }) {
    if (!timeFrom || !timeTo) return "يرجى تحديد وقت البداية والنهاية.";
    const startH = parseInt(timeFrom.split(':')[0]);
    const endH = parseInt(timeTo.split(':')[0]);
    if (endH <= startH) return "وقت النهاية يجب أن يكون بعد وقت البداية.";
    return null; // Valid
  }

  filterBookings(activeBookings, { timeFrom, timeTo }) {
    return activeBookings.filter(b => {
      const bookingStart = b.timeFrom;
      let bookingEnd = b.timeTo;
      if (!bookingEnd) {
         // Fallback if booking lacks timeTo
         bookingEnd = '22:00'; 
      }
      // Intersect condition
      return timeFrom < bookingEnd && timeTo > bookingStart;
    });
  }
}

// Fixed-Room Strategy (Lecture)
class FixedRoomSearchStrategy extends SearchStrategy {
  validateInput({ selectedSlot }) {
    if (!selectedSlot) return "يرجى اختيار فترة المحاضرة.";
    return null; // Valid
  }

  filterBookings(activeBookings, { selectedSlot }) {
    return activeBookings.filter(b => {
      // Direct match for lecture slots
      return b.timeFrom === selectedSlot.from && b.timeTo === selectedSlot.to;
    });
  }
}

// Factory
class SearchStrategyFactory {
  static createStrategy(roomType) {
    if (roomType === 'multi') return new MultiRoomSearchStrategy();
    if (roomType === 'fixed') return new FixedRoomSearchStrategy();
    throw new Error('Unknown room type strategy');
  }
}

export default function AdvancedRoomSearch() {
  const [rooms, setRooms] = useState([]);
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchRoomType, setSearchRoomType] = useState('multi');
  const [searchCapacity, setSearchCapacity] = useState('');
  const { showAlert } = usePopup();
  
  // Strategy-specific states
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [selectedSlotIdx, setSelectedSlotIdx] = useState('');

  const [emptyRoomsResult, setEmptyRoomsResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const hourOptions = getHourOptions();

  // Observer Pattern to keep rooms in sync
  useEffect(() => {
    const unsubscribe = roomService.subscribeToRooms((fetchedRooms) => {
      setRooms(fetchedRooms);
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = async () => {
    const strategy = SearchStrategyFactory.createStrategy(searchRoomType);
    
    // Validate
    const data = searchRoomType === 'multi' 
        ? { timeFrom, timeTo } 
        : { selectedSlot: selectedSlotIdx !== '' ? REGULAR_SLOTS[selectedSlotIdx] : null };
        
    const errorMsg = strategy.validateInput(data);
    if (errorMsg) {
      return showAlert(errorMsg, 'warning');
    }

    setIsSearching(true);
    try {
      const activeBookings = await roomService.getBookingsByDate(searchDate);
      const overlappingBookings = strategy.filterBookings(activeBookings, data);
      const occupiedRoomIds = overlappingBookings.map(b => b.roomId);

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
    <div className="w-full h-full pb-20 px-4 rtl pt-8 animate-in fade-in" dir="rtl">
      <div className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-[#001e40] tracking-tight">البحث المتقدم للقاعات</h1>
        <p className="text-[#5a7698] mt-2 text-lg">أداة متقدمة للاستعلام الدقيق عن شغور القاعات بناءً على نوعها وسعتها والفترات الزمنية.</p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 w-full mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
           <div className="space-y-2">
             <label className="block text-xs font-bold text-[#5a7698] uppercase">نوع القاعة</label>
             <select 
               value={searchRoomType} 
               onChange={(e) => {
                 setSearchRoomType(e.target.value);
                 setEmptyRoomsResult(null); // Reset results on type change
               }} 
               className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none"
             >
               <option value="multi">متعددة الأغراض</option>
               <option value="fixed">قاعات السكاشن (عادية)</option>
             </select>
           </div>
           
           <div className="space-y-2">
             <label className="block text-xs font-bold text-[#5a7698] uppercase">تاريخ البحث</label>
             <input 
               type="date" 
               value={searchDate} 
               onChange={(e) => setSearchDate(e.target.value)} 
               className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none text-right" 
             />
           </div>

           <div className="space-y-2">
             <label className="block text-xs font-bold text-[#5a7698] uppercase">السعة المطلوبة (اختياري)</label>
             <input 
               type="number" 
               min="1"
               placeholder="مثال: 50"
               value={searchCapacity} 
               onChange={(e) => setSearchCapacity(e.target.value)} 
               className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none text-right" 
             />
           </div>

           {searchRoomType === 'multi' ? (
             <>
               <div className="space-y-2">
                 <label className="block text-xs font-bold text-[#5a7698] uppercase">من الساعة</label>
                 <select 
                   value={timeFrom} 
                   onChange={(e) => setTimeFrom(e.target.value)} 
                   className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none" dir="ltr"
                 >
                   <option value="">اختر وقت البداية...</option>
                   {hourOptions.map(opt => <option key={`from-${opt.value}`} value={opt.value}>{opt.label}</option>)}
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="block text-xs font-bold text-[#5a7698] uppercase">إلى الساعة</label>
                 <select 
                   value={timeTo} 
                   onChange={(e) => setTimeTo(e.target.value)} 
                   className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none" dir="ltr"
                 >
                   <option value="">اختر وقت النهاية...</option>
                   {hourOptions.map(opt => (
                     <option 
                       key={`to-${opt.value}`} 
                       value={opt.value}
                       disabled={timeFrom && parseInt(opt.value.split(':')[0]) <= parseInt(timeFrom.split(':')[0])}
                     >
                       {opt.label}
                     </option>
                   ))}
                 </select>
               </div>
             </>
           ) : (
             <div className="space-y-2 md:col-span-2">
               <label className="block text-xs font-bold text-[#5a7698] uppercase">فترة المحاضرة</label>
               <select 
                 value={selectedSlotIdx} 
                 onChange={(e) => setSelectedSlotIdx(e.target.value)} 
                 className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none"
               >
                 <option value="">اختر فترة المحاضرة...</option>
                 {REGULAR_SLOTS.map((s, idx) => (
                   <option key={idx} value={idx}>{s.label}</option>
                 ))}
               </select>
             </div>
           )}
        </div>

        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full bg-[#001e40] hover:bg-[#1e3a5f] text-white px-6 py-4 rounded-xl font-bold transition-all shadow-md hover:-translate-y-1 flex items-center justify-center gap-2"
        >
           <span className="material-symbols-outlined">{isSearching ? 'hourglass_empty' : 'zoom_in'}</span>
           {isSearching ? 'جاري البحث...' : 'بحث عن القاعات المتاحة'}
        </button>

        {emptyRoomsResult && (
          <div className="mt-8 pt-8 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4">
             <h3 className="text-xl font-headline font-black text-[#001e40] mb-4 flex items-center gap-2">
               نتيجة البحث: <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">{emptyRoomsResult.length} قاعة متاحة</span>
             </h3>
             {emptyRoomsResult.length > 0 ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {emptyRoomsResult.map(r => (
                   <div key={r.id} className="bg-green-50 border border-green-200 rounded-xl p-4 text-center hover:bg-green-100 transition-colors shadow-sm cursor-default">
                     <div className="font-black text-green-800 text-xl font-headline mb-1">{r.roomNumber}</div>
                     <div className="text-xs font-bold text-green-600 mb-1">{r.type === 'multi' ? 'متعددة الأغراض' : 'محاضرات عادية'}</div>
                     <div className="text-xs text-green-700 font-bold bg-green-200/50 rounded py-1">سعة: {r.capacity}</div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">search_off</span>
                  <p className="text-gray-500 font-bold">عذراً، لا توجد قاعات متاحة تطابق معايير البحث.</p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
