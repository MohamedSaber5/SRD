import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function RoomFormModal({ isOpen, onClose, onSubmit, initialData, isSubmitting }) {
  const { t } = useTranslation();
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm rtl" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-8 w-full max-w-xl relative border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 w-8 h-8 flex items-center justify-center bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>

        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-slate-800 pb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isEditMode ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
            <span className="material-symbols-outlined text-[28px]">
              {isEditMode ? 'edit_square' : 'add_business'}
            </span>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-headline font-black text-[#001e40] dark:text-white">
              {isEditMode ? t('roomManagement.editRoom') : t('roomManagement.addRoom')}
            </h2>
            <p className="text-sm font-bold text-[#5a7698] dark:text-slate-400">
              {isEditMode ? t('roomManagement.editRoomDesc') : t('roomManagement.addRoomDesc')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-2 text-right">
              <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400 uppercase">{t('roomManagement.roomNameLabel')}</label>
              <input 
                required 
                type="text" 
                placeholder={t('roomManagement.roomNamePlaceholder')}
                value={formData.roomNumber}
                onChange={e => setFormData({...formData, roomNumber: e.target.value})}
                className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-white font-black focus:ring-2 focus:ring-[#1e3a5f] dark:focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="space-y-2 text-right">
              <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400 uppercase">{t('roomManagement.roomTypeLabel')}</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-white font-black focus:ring-2 focus:ring-[#1e3a5f] dark:focus:ring-blue-600 outline-none"
              >
                <option value="fixed">{t('roomManagement.roomTypeFixed')}</option>
                <option value="multi">{t('roomManagement.roomTypeMulti')}</option>
              </select>
            </div>

            {isEditMode && (
              <div className="space-y-2 text-right">
                <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400 uppercase">{t('roomManagement.statusLabel')}</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-white font-black focus:ring-2 focus:ring-[#1e3a5f] dark:focus:ring-blue-600 outline-none"
                >
                  <option value="available">{t('roomManagement.statusAvailable')}</option>
                  <option value="unavailable">{t('roomManagement.statusUnavailable')}</option>
                </select>
              </div>
            )}

            <div className="space-y-2 text-right">
              <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400 uppercase">{t('roomManagement.buildingLabel')}</label>
              <select 
                required 
                value={formData.building}
                onChange={e => setFormData({...formData, building: e.target.value})}
                className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-white font-black focus:ring-2 focus:ring-[#1e3a5f] dark:focus:ring-blue-600 outline-none text-center" dir="ltr"
              >
                <option value="" disabled>{t('roomManagement.selectBuilding')}</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </div>

            <div className="space-y-2 text-right">
              <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400 uppercase">{t('roomManagement.floorLabel')}</label>
              <select 
                required 
                value={formData.floor}
                onChange={e => setFormData({...formData, floor: Number(e.target.value)})}
                className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-white font-black focus:ring-2 focus:ring-[#1e3a5f] dark:focus:ring-blue-600 outline-none text-center" dir="ltr"
              >
                <option value="" disabled>{t('roomManagement.selectFloor')}</option>
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2 text-right">
              <label className="block text-xs font-bold text-[#5a7698] dark:text-slate-400 uppercase">{t('roomManagement.capacityLabel')}</label>
              <input 
                required 
                type="number" 
                min="5" 
                placeholder="50"
                value={formData.capacity}
                onChange={e => setFormData({...formData, capacity: e.target.value})}
                className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-white font-black focus:ring-2 focus:ring-[#1e3a5f] dark:focus:ring-blue-600 outline-none text-center" dir="ltr"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors w-1/3"
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`flex-1 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-400' : (isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-1')}`}
            >
               <span className="material-symbols-outlined">{isEditMode ? 'save' : 'add'}</span>
               {isSubmitting ? t('common.saving') : (isEditMode ? t('common.save') : t('roomManagement.addRoomBtn'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
