import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function RoomTable({ rooms, onEditClick, onDeleteClick, onRowClick }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [minCapacity, setMinCapacity] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
      const matchesType = typeFilter === 'all' || room.type === typeFilter;
      const matchesCapacity = !minCapacity || Number(room.capacity) >= Number(minCapacity);
      return matchesSearch && matchesStatus && matchesType && matchesCapacity;
    });
  }, [rooms, searchTerm, statusFilter, typeFilter, minCapacity]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, minCapacity, rooms]);

  const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE);
  const paginatedRooms = filteredRooms.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const hasFilters = searchTerm || minCapacity || typeFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-slate-800 p-8 w-full rtl" dir="rtl">
      
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Text Search */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">search</span>
            <input 
              type="text" 
              placeholder={t('roomManagement.searchPlaceholder')} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pr-12 pl-4 py-3 text-[#001e40] dark:text-slate-200 font-bold focus:ring-2 focus:ring-[#1e3a5f] outline-none"
            />
          </div>

          {/* Capacity Filter */}
          <div className="relative w-full md:w-52">
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm">groups</span>
            <input 
              type="number" 
              min="1"
              placeholder={t('roomManagement.minCapacity')}
              value={minCapacity}
              onChange={e => setMinCapacity(e.target.value)}
              className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pr-12 pl-4 py-3 text-[#001e40] dark:text-slate-200 font-bold focus:ring-2 focus:ring-[#1e3a5f] outline-none text-right"
            />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-[#5a7698] dark:text-slate-400 outline-none cursor-pointer"
          >
            <option value="all">{t('common.allTypes')}</option>
            <option value="fixed">{t('requests.hallLectures')}</option>
            <option value="multi">{t('requests.hallMulti')}</option>
          </select>

          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#f8fafc] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-[#5a7698] dark:text-slate-400 outline-none cursor-pointer"
          >
            <option value="all">{t('common.allStatuses')}</option>
            <option value="available">{t('common.statusAvailable')}</option>
            <option value="unavailable">{t('common.statusUnavailable')}</option>
          </select>

          {hasFilters && (
            <button
              onClick={() => { setSearchTerm(''); setMinCapacity(''); setTypeFilter('all'); setStatusFilter('all'); }}
              className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">filter_alt_off</span>
              {t('common.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 mb-2">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-[#f8fafc] to-white dark:from-slate-800 dark:to-slate-900 text-[#5a7698] dark:text-slate-400 text-sm border-b-2 border-gray-100 dark:border-slate-800 shadow-sm">
              <th className="py-5 px-6 font-black uppercase tracking-wider">{t('roomManagement.tableName')}</th>
              <th className="py-5 px-6 font-black uppercase tracking-wider">{t('roomManagement.tableType')}</th>
              <th className="py-5 px-6 font-black uppercase tracking-wider">{t('roomManagement.tableFloor')}</th>
              <th className="py-5 px-6 font-black uppercase tracking-wider">{t('roomManagement.tableCapacity')}</th>
              <th className="py-5 px-6 font-black uppercase tracking-wider">{t('roomManagement.tableStatus')}</th>
              <th className="py-5 px-6 font-black uppercase tracking-wider text-center">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRooms.length > 0 ? (
              paginatedRooms.map(room => (
                <tr 
                  key={room.id} 
                  className="border-b border-gray-50 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                  onClick={() => onRowClick(room)}
                >
                  <td className="py-5 px-6 font-black text-[#001e40] dark:text-white">{room.roomNumber}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${room.type === 'multi' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                      {room.type === 'multi' ? t('requests.hallMulti') : t('requests.hallLectures')}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-gray-600 dark:text-slate-400">{t('common.building')} {room.building} - {t('common.floor')} {room.floor}</td>
                  <td className="py-4 px-6 font-bold text-gray-600 dark:text-slate-400">{room.capacity} {t('common.student')}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 ${room.status === 'available' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {room.status === 'available' ? 'check_circle' : 'cancel'}
                      </span>
                      {room.status === 'available' ? t('common.statusAvailable') : t('common.statusUnavailable')}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditClick(room); }}
                        className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-colors"
                        title={t('common.edit')}
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteClick(room); }}
                        className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-600 dark:hover:bg-red-600 hover:text-white transition-colors"
                        title={t('common.delete')}
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-400 dark:text-slate-500 font-bold bg-gray-50 dark:bg-slate-800/50">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">search_off</span>
                  {t('roomManagement.noRooms')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm font-bold text-gray-500 dark:text-slate-400">
          {t('roomManagement.total')}: {filteredRooms.length} ({t('common.viewing')} {paginatedRooms.length} {t('common.inThisPage')})
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title={t('common.next')}
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            
            <span className="text-sm font-bold text-[#001e40] dark:text-slate-200 px-2 bg-gray-50 dark:bg-slate-800 rounded-lg py-1 border border-gray-100 dark:border-slate-700">
              {currentPage} / {totalPages}
            </span>
            
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title={t('common.prev')}
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
