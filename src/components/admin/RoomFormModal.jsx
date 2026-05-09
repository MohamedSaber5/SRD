import React, { useState, useEffect } from 'react';

export default function RoomFormModal({ isOpen, onClose, onSubmit, initialData, isSubmitting }) {
  const [formData, setFormData] = useState({
    roomNumber: '',
    type: 'fixed',
    building: '',
    floor: 1,
    capacity: 20,
    status: 'available'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        roomNumber: '',
        type: 'fixed',
        building: '',
        floor: 1,
        capacity: 20,
        status: 'available'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isEditMode = !!initialData;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm rtl" dir="rtl">
      <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-xl relative border border-gray-100 animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>

        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isEditMode ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <span className="material-symbols-outlined text-[28px]">
              {isEditMode ? 'edit_square' : 'add_business'}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-headline font-black text-[#001e40]">
              {isEditMode ? 'تعديل بيانات القاعة' : 'إضافة قاعة جديدة'}
            </h2>
            <p className="text-sm font-bold text-[#5a7698]">
              {isEditMode ? 'قم بتحديث المعلومات الأساسية للقاعة.' : 'أدخل تفاصيل القاعة الجديدة لضمها للنظام.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-bold text-[#5a7698] uppercase">الاسم / الرقم التعريفي</label>
              <input 
                required 
                type="text" 
                placeholder="مثال: A-402 أو قاعة المؤتمرات"
                value={formData.roomNumber}
                onChange={e => setFormData({...formData, roomNumber: e.target.value})}
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#5a7698] uppercase">نوع القاعة</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none"
              >
                <option value="fixed">قاعة عادية</option>
                <option value="multi">متعددة الأغراض</option>
              </select>
            </div>

            {isEditMode && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#5a7698] uppercase">الحالة</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                >
                  <option value="available">متاحة</option>
                  <option value="unavailable">مغلقة للصيانة</option>
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#5a7698] uppercase">المبنى</label>
              <input 
                required 
                type="text" 
                placeholder="A, B, C..."
                value={formData.building}
                onChange={e => setFormData({...formData, building: e.target.value})}
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none text-center" dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#5a7698] uppercase">الدور</label>
              <input 
                required 
                type="number" 
                min="0" 
                placeholder="1, 2, 3..."
                value={formData.floor}
                onChange={e => setFormData({...formData, floor: e.target.value})}
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none text-center" dir="ltr"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-bold text-[#5a7698] uppercase">سعة القاعة (أفراد)</label>
              <input 
                required 
                type="number" 
                min="5" 
                placeholder="50"
                value={formData.capacity}
                onChange={e => setFormData({...formData, capacity: e.target.value})}
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-black focus:ring-2 focus:ring-[#1e3a5f] outline-none text-center" dir="ltr"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors w-1/3"
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`flex-1 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-400' : (isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-1')}`}
            >
               <span className="material-symbols-outlined">{isEditMode ? 'save' : 'add'}</span>
               {isSubmitting ? 'جاري الحفظ...' : (isEditMode ? 'حفظ التعديلات' : 'إضافة القاعة')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
