import React, { useState, useMemo } from 'react';

export default function RoomTable({ rooms, onEditClick, onDeleteClick, onRowClick }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Filter and Search Logic
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
      const matchesType = typeFilter === 'all' || room.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [rooms, searchTerm, statusFilter, typeFilter]);

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 w-full rtl" dir="rtl">
      
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input 
            type="text" 
            placeholder="ابحث برقم أو اسم القاعة..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl pr-12 pl-4 py-3 text-[#001e40] font-bold focus:ring-2 focus:ring-[#1e3a5f] outline-none"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 font-bold text-[#5a7698] outline-none cursor-pointer flex-1 md:flex-none"
          >
            <option value="all">كل الأنواع</option>
            <option value="fixed">قاعات محاضرات</option>
            <option value="multi">متعددة الأغراض</option>
          </select>

          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 font-bold text-[#5a7698] outline-none cursor-pointer flex-1 md:flex-none"
          >
            <option value="all">كل الحالات</option>
            <option value="available">متاحة</option>
            <option value="unavailable">مغلقة للصيانة</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] text-[#5a7698] text-sm border-b border-gray-100">
              <th className="py-4 px-6 font-bold">اسم / رقم القاعة</th>
              <th className="py-4 px-6 font-bold">النوع</th>
              <th className="py-4 px-6 font-bold">المبنى والدور</th>
              <th className="py-4 px-6 font-bold">السعة</th>
              <th className="py-4 px-6 font-bold">الحالة</th>
              <th className="py-4 px-6 font-bold text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.length > 0 ? (
              filteredRooms.map(room => (
                <tr 
                  key={room.id} 
                  className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  onClick={() => onRowClick(room)}
                >
                  <td className="py-4 px-6 font-black text-[#001e40]">{room.roomNumber}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${room.type === 'multi' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {room.type === 'multi' ? 'متعددة الأغراض' : 'محاضرات عادية'}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-gray-600">مبنى {room.building} - الدور {room.floor}</td>
                  <td className="py-4 px-6 font-bold text-gray-600">{room.capacity} طالب</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 ${room.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {room.status === 'available' ? 'check_circle' : 'cancel'}
                      </span>
                      {room.status === 'available' ? 'متاحة للعمل' : 'مغلقة'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditClick(room); }}
                        className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                        title="تعديل"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteClick(room); }}
                        className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                        title="حذف"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-400 font-bold bg-gray-50">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">search_off</span>
                  لم يتم العثور على قاعات تطابق شروط البحث.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm font-bold text-gray-500">
        إجمالي القاعات المعروضة: {filteredRooms.length}
      </div>
    </div>
  );
}
