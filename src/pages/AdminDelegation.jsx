import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase';
import { collection, query, getDocs, doc, setDoc, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { usePopup } from '../contexts/PopupContext';
import { useAuth } from '../contexts/AuthContext';

const COLLEGES_LIST = [
  "كلية الهندسة والتكنولوجيا",
  "كلية الحاسبات وتكنولوجيا المعلومات",
  "كلية الاثار والتراث الحضاري",
  "كلية الإدارة والتكنولوجيا",
  "كلية النقل الدولي واللوجستيات"
];

const ADMIN_PERMISSIONS = [
  { id: 'rooms', icon: 'meeting_room' },
  { id: 'statistics', icon: 'analytics' },
  { id: 'requests', icon: 'rule' },
  { id: 'settings', icon: 'settings' },
];

export default function AdminDelegation() {
  const { t } = useTranslation();
  const { showAlert } = usePopup();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const [roleToGrant, setRoleToGrant] = useState('temp_admin');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState(ADMIN_PERMISSIONS.map(p => p.id));

  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [activeDelegations, setActiveDelegations] = useState([]);
  const [delegationFilter, setDelegationFilter] = useState('all');
  const { currentUser, userData } = useAuth();

  // Fetch employees and current delegations in real-time
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (qSnapshot) => {
      const allEmployees = [];
      const delegated = [];
      
      qSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.role === 'employee') {
           allEmployees.push({ id: doc.id, ...data });
        } else if (data.role === 'temp_admin' || data.role === 'secretary') {
           delegated.push({ id: doc.id, ...data });
        }
      });
      
      setEmployees(allEmployees);
      setActiveDelegations(delegated);
    }, (error) => {
      console.error("Error fetching users:", error);
    });

    return () => unsubscribe();
  }, []);

  // Handle autocomplete search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
      return;
    }
    
    if (selectedEmployee && (selectedEmployee.displayName === searchTerm || selectedEmployee.employeeId === searchTerm || `${selectedEmployee.displayName} - ${selectedEmployee.employeeId}` === searchTerm)) {
      setSuggestions([]);
      return;
    }

    const lowerTerm = searchTerm.toLowerCase();
    const filtered = employees.filter(emp => 
      (emp.displayName && emp.displayName.toLowerCase().includes(lowerTerm)) || 
      (emp.employeeId && emp.employeeId.toLowerCase().includes(lowerTerm))
    );
    
    setSuggestions(filtered);
  }, [searchTerm, employees, selectedEmployee]);

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setSearchTerm(`${emp.displayName} - ${emp.employeeId}`);
    setSuggestions([]);
    
    // Scroll to top form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGrantDelegation = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) {
      showAlert(t('adminDelegation.selectEmployeeFirst'), "warning");
      return;
    }

    if (roleToGrant === 'temp_admin') {
      if (!startDate || !endDate) {
        showAlert(t('adminDelegation.fillDates'), "warning");
        return;
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        showAlert(t('adminDelegation.invalidDateRange'), "warning");
        return;
      }
    } else if (roleToGrant === 'secretary') {
      if (!collegeName.trim()) {
        showAlert(t('adminDelegation.selectCollege'), "warning");
        return;
      }
      
      // Check if college already has a secretary
      const alreadyAssigned = activeDelegations.some(d => d.role === 'secretary' && d.collegeName === collegeName);
      if (alreadyAssigned) {
        showAlert(t('adminDelegation.alreadyAssigned'), "error");
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = { role: roleToGrant };

      if (roleToGrant === 'temp_admin') {
        payload.tempAccessStart = new Date(startDate).toISOString();
        payload.tempAccessEnd = new Date(endDate).toISOString();
        payload.permissions = selectedPermissions;
      } else {
        payload.collegeName = collegeName;
      }

      await setDoc(doc(db, "users", selectedEmployee.id), payload, { merge: true });
      
      // Audit log
      if (currentUser) {
         await addDoc(collection(db, 'audit_logs'), {
           actionBy: currentUser.email,
           actionByName: userData?.displayName || 'Admin',
           actionType: roleToGrant === 'temp_admin' ? 'DELEGATE_ADMIN' : 'ASSIGN_SECRETARY',
           details: roleToGrant === 'temp_admin' 
             ? `Granted temp admin access to ${selectedEmployee.displayName} until ${new Date(endDate).toLocaleString()}`
             : `Assigned ${selectedEmployee.displayName} as secretary for: ${collegeName}`,
           targetUserId: selectedEmployee.employeeId,
           timestamp: serverTimestamp()
         });
      }
      
      showAlert(t('adminDelegation.grantSuccess'), "success");
      
      // Reset form
      setSelectedEmployee(null);
      setSearchTerm('');
      setStartDate('');
      setEndDate('');
      setCollegeName('');
      setRoleToGrant('temp_admin');
    } catch (error) {
      console.error("Error granting delegation:", error);
      showAlert("حدث خطأ أثناء منح التفويض", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeDelegation = async (emp) => {
    if (!window.confirm(t('adminDelegation.confirmRevoke'))) return;
    
    try {
      await setDoc(doc(db, "users", emp.id), {
        role: 'employee',
        tempAccessStart: null,
        tempAccessEnd: null,
        collegeName: null
      }, { merge: true });
      
      showAlert(t('adminDelegation.revokeSuccess'), "success");
    } catch (error) {
      console.error("Error revoking delegation:", error);
      showAlert(t('common.errorOccurred'), "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* 1. Top Assignment Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-outline-variant/20 relative z-20">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/20">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">manage_accounts</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary dark:text-white">{t('adminDelegation.title')}</h2>
            <p className="text-sm text-[#5a7698] dark:text-slate-400 mt-1">{t('adminDelegation.subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleGrantDelegation} className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-bold text-[#001e40] dark:text-slate-200 mb-2">{t('adminDelegation.searchLabel')}</label>
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#5a7698] dark:text-slate-500">search</span>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedEmployee(null);
                }}
                placeholder={t('adminDelegation.searchPlaceholder')}
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl px-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] transition-all font-bold text-[#1e3a5f] dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-600"
              />
            </div>
            
            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute w-full mt-2 bg-white dark:bg-slate-800 border border-outline-variant/20 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50">
                {suggestions.map((emp) => (
                  <div 
                    key={emp.id} 
                    onClick={() => handleSelectEmployee(emp)}
                    className="px-4 py-3 hover:bg-surface-container-highest cursor-pointer flex items-center justify-between border-b border-outline-variant/10 last:border-0"
                  >
                    <div>
                      <div className="font-bold text-primary dark:text-white">{emp.displayName || 'بدون اسم'}</div>
                      <div className="text-sm text-on-surface-variant">{emp.employeeId}</div>
                    </div>
                    <span className="material-symbols-outlined text-primary/50">person_add</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50/50 dark:bg-slate-800/50 p-5 rounded-xl border border-gray-100 dark:border-slate-800">
            <label className="block text-sm font-bold text-[#001e40] dark:text-slate-200 mb-4">{t('adminDelegation.typeLabel')}</label>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all flex-1 ${roleToGrant === 'temp_admin' ? 'border-[#1e3a5f] dark:border-blue-600 bg-[#1e3a5f]/5 dark:bg-blue-600/5' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#1e3a5f]/50'}`}>
                <input 
                  type="radio" 
                  name="role" 
                  value="temp_admin" 
                  checked={roleToGrant === 'temp_admin'} 
                  onChange={(e) => setRoleToGrant(e.target.value)}
                  className="w-5 h-5 accent-[#1e3a5f] dark:accent-blue-600"
                />
                <div>
                  <div className="font-bold text-sm text-[#001e40] dark:text-slate-200">{t('adminDelegation.tempAdmin')}</div>
                  <div className="text-xs text-[#5a7698] dark:text-slate-400 mt-1">يمنح صلاحيات إدارة النظام لفترة محددة</div>
                </div>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all flex-1 ${roleToGrant === 'secretary' ? 'border-[#1e3a5f] dark:border-blue-600 bg-[#1e3a5f]/5 dark:bg-blue-600/5' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#1e3a5f]/50'}`}>
                <input 
                  type="radio" 
                  name="role" 
                  value="secretary" 
                  checked={roleToGrant === 'secretary'} 
                  onChange={(e) => setRoleToGrant(e.target.value)}
                  className="w-5 h-5 accent-[#1e3a5f] dark:accent-blue-600"
                />
                <div>
                  <div className="font-bold text-sm text-[#001e40] dark:text-slate-200">{t('adminDelegation.secretary')}</div>
                  <div className="text-xs text-[#5a7698] dark:text-slate-400 mt-1">تعيين كممثل لجهة لتقديم الحجوزات</div>
                </div>
              </label>
            </div>

            {roleToGrant === 'temp_admin' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in zoom-in-95 duration-300">
                <div>
                  <label className="block text-sm font-bold text-[#001e40] dark:text-slate-200 mb-2">{t('adminDelegation.startDate')}</label>
                  <input 
                    type="datetime-local" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] transition-all font-medium shadow-sm text-[#001e40] dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#001e40] dark:text-slate-200 mb-2">{t('adminDelegation.endDate')}</label>
                  <input 
                    type="datetime-local" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] transition-all font-medium shadow-sm text-[#001e40] dark:text-slate-200"
                  />
                </div>

                <div className="md:col-span-2 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-[#001e40] dark:text-slate-200">
                      {t('adminDelegation.permissionsLabel', 'صلاحيات الوصول')}
                    </label>
                    <button 
                      type="button"
                      onClick={() => {
                        if (selectedPermissions.length === ADMIN_PERMISSIONS.length) {
                          setSelectedPermissions([]);
                        } else {
                          setSelectedPermissions(ADMIN_PERMISSIONS.map(p => p.id));
                        }
                      }}
                      className="text-xs font-bold text-[#1e3a5f] dark:text-blue-400 hover:underline"
                    >
                      {selectedPermissions.length === ADMIN_PERMISSIONS.length 
                        ? t('adminDelegation.deselectAll', 'إلغاء الكل') 
                        : t('adminDelegation.selectAll', 'تحديد الكل')}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ADMIN_PERMISSIONS.map(permission => (
                      <label 
                        key={permission.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedPermissions.includes(permission.id)
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-[#1e3a5f] dark:text-blue-300'
                            : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <input 
                          type="checkbox"
                          className="hidden"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => {
                            if (selectedPermissions.includes(permission.id)) {
                              setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                            } else {
                              setSelectedPermissions([...selectedPermissions, permission.id]);
                            }
                          }}
                        />
                        <span className="material-symbols-outlined text-[18px]">
                          {permission.icon}
                        </span>
                        <span className="text-xs font-bold whitespace-nowrap">
                          {t(`adminDelegation.perm_${permission.id}`, permission.id)}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedPermissions.length === 0 && (
                    <div className="text-[10px] text-red-500 mt-2 font-bold animate-pulse">
                      * {t('adminDelegation.minOnePermission', 'يجب اختيار صلاحية واحدة على الأقل')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <label className="block text-sm font-bold text-[#001e40] dark:text-slate-200 mb-2">{t('adminDelegation.collegeLabel')}</label>
                <select 
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] transition-all font-bold text-gray-700 dark:text-slate-300 shadow-sm appearance-none"
                >
                  <option value="" disabled>-- {t('adminDelegation.collegeSelect')} --</option>
                  {COLLEGES_LIST.map((college, idx) => {
                    const isAssigned = activeDelegations.some(d => d.role === 'secretary' && d.collegeName === college);
                    return (
                      <option key={idx} value={college} disabled={isAssigned}>
                        {college} {isAssigned ? '(معين مسبقاً)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={isLoading || !selectedEmployee}
              className="px-8 py-3.5 bg-gradient-to-l from-[#1e3a5f] to-[#001e40] dark:from-blue-600 dark:to-blue-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined">add_task</span>
              )}
              {t('adminDelegation.grantBtn')}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Middle Table for Quick Selection */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-outline-variant/20 relative z-10">
        <h2 className="text-lg font-bold text-primary dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#b58b4b]">groups</span>
          {t('adminDelegation.employeeRegistry')}
        </h2>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-outline-variant/20 rounded-xl scrollbar-hide">
          <table className="w-full text-right relative">
            <thead className="sticky top-0 bg-surface-container-highest dark:bg-slate-800 z-10 shadow-sm">
              <tr className="text-on-surface-variant dark:text-slate-400 text-sm border-b border-outline-variant/20">
                <th className="px-4 py-3 font-bold">{t('adminDelegation.employee')}</th>
                <th className="px-4 py-3 font-bold">{t('adminDelegation.employeeId')}</th>
                <th className="px-4 py-3 font-bold text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface dark:text-slate-300 bg-white dark:bg-slate-900">
              {employees.length > 0 ? employees.map((emp) => (
                <tr key={emp.id} className={`hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors ${selectedEmployee?.id === emp.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''}`}>
                  <td className="px-4 py-3 font-bold flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${selectedEmployee?.id === emp.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[18px]">person</span>
                    </div>
                    <span className={selectedEmployee?.id === emp.id ? 'text-blue-700 dark:text-blue-400' : ''}>{emp.displayName || t('common.noName')}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600 dark:text-slate-400">{emp.employeeId}</td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => handleSelectEmployee(emp)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all border ${selectedEmployee?.id === emp.id ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300'}`}
                    >
                      {selectedEmployee?.id === emp.id ? t('common.selected', 'تم التحديد ✓') : t('common.select', 'تحديد')}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="px-4 py-8 text-center text-gray-400 font-bold">
                    {t('adminDelegation.noEmployees')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Active Delegations Table */}
      {activeDelegations.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-outline-variant/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-primary dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b58b4b]">verified_user</span>
              {t('adminDelegation.activeDelegations')}
            </h2>
            
            {/* Filter Buttons */}
            <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
              <button 
                onClick={() => setDelegationFilter('all')}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${delegationFilter === 'all' ? 'bg-white dark:bg-slate-700 text-[#1e3a5f] dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
              >
                {t('common.all')}
              </button>
              <button 
                onClick={() => setDelegationFilter('secretary')}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${delegationFilter === 'secretary' ? 'bg-white dark:bg-slate-700 text-[#1e3a5f] dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
              >
                {t('adminDelegation.secretary')}
              </button>
              <button 
                onClick={() => setDelegationFilter('temp_admin')}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${delegationFilter === 'temp_admin' ? 'bg-white dark:bg-slate-700 text-[#1e3a5f] dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
              >
                {t('adminDelegation.tempAdmin')}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800 text-[#5a7698] dark:text-slate-400 text-sm border-y border-gray-100 dark:border-slate-800">
                  <th className="px-4 py-3 font-bold">{t('adminDelegation.tableUser')}</th>
                  <th className="px-4 py-3 font-bold">{t('adminDelegation.tableRole')}</th>
                  <th className="px-4 py-3 font-bold">{t('adminDelegation.tableDetails')}</th>
                  <th className="px-4 py-3 font-bold text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-on-surface dark:text-slate-300">
                {activeDelegations.filter(d => delegationFilter === 'all' || d.role === delegationFilter).length > 0 ? (
                  activeDelegations.filter(d => delegationFilter === 'all' || d.role === delegationFilter).map((delegation) => (
                  <tr key={delegation.id} className="hover:bg-surface-container-highest/30 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-bold text-[#001e40] dark:text-white">{delegation.displayName || t('common.noName')}</div>
                      <div className="text-xs text-[#5a7698] dark:text-slate-500 font-mono mt-0.5">{delegation.employeeId}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-md ${delegation.role === 'temp_admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                        {delegation.role === 'temp_admin' ? t('adminDelegation.tempAdmin') : t('adminDelegation.secretary')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {delegation.role === 'temp_admin' ? (
                        <div className="text-gray-600 dark:text-slate-400 text-xs">
                          {t('common.from')}: <span dir="ltr" className="font-bold">{delegation.tempAccessStart ? new Date(delegation.tempAccessStart).toLocaleString() : '-'}</span><br/>
                          {t('common.to')}: <span dir="ltr" className="font-bold">{delegation.tempAccessEnd ? new Date(delegation.tempAccessEnd).toLocaleString() : '-'}</span>
                        </div>
                      ) : (
                        <div className="text-gray-700 dark:text-slate-300 font-bold">
                          {delegation.collegeName || t('common.notSpecified')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => handleRevokeDelegation(delegation)}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors flex items-center gap-1 mx-auto"
                        title={t('adminDelegation.revokeBtn')}
                      >
                        <span className="material-symbols-outlined text-[16px]">person_remove</span>
                        {t('adminDelegation.revokeBtn')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500 font-bold">
                    {t('adminDelegation.noMatchingDelegations')}
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
