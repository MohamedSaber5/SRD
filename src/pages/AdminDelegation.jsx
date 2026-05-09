import React, { useState, useEffect } from 'react';
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

export default function AdminDelegation() {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const [roleToGrant, setRoleToGrant] = useState('temp_admin');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [collegeName, setCollegeName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [activeDelegations, setActiveDelegations] = useState([]);
  const [delegationFilter, setDelegationFilter] = useState('all');
  const { showPopup } = usePopup();
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
      showPopup("يرجى اختيار موظف أولاً", "warning");
      return;
    }

    if (roleToGrant === 'temp_admin') {
      if (!startDate || !endDate) {
        showPopup("يرجى تعبئة تاريخ البداية والنهاية للمدير المؤقت", "warning");
        return;
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        showPopup("تاريخ النهاية يجب أن يكون بعد تاريخ البداية", "warning");
        return;
      }
    } else if (roleToGrant === 'secretary') {
      if (!collegeName.trim()) {
        showPopup("يرجى اختيار الكلية أو الجهة للسكرتير", "warning");
        return;
      }
      
      // Check if college already has a secretary
      const alreadyAssigned = activeDelegations.some(d => d.role === 'secretary' && d.collegeName === collegeName);
      if (alreadyAssigned) {
        showPopup("هذه الكلية لديها سكرتير معين بالفعل. لا يمكن تعيين أكثر من سكرتير لنفس الجهة.", "error");
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = { role: roleToGrant };

      if (roleToGrant === 'temp_admin') {
        payload.tempAccessStart = new Date(startDate).toISOString();
        payload.tempAccessEnd = new Date(endDate).toISOString();
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
             ? `قام بمنح صلاحية مدير مؤقت للموظف ${selectedEmployee.displayName} حتى ${new Date(endDate).toLocaleString('ar-EG')}`
             : `قام بتعيين الموظف ${selectedEmployee.displayName} كسكرتير لجهة: ${collegeName}`,
           targetUserId: selectedEmployee.employeeId,
           timestamp: serverTimestamp()
         });
      }
      
      showPopup("تم منح التفويض بنجاح", "success");
      
      // Reset form
      setSelectedEmployee(null);
      setSearchTerm('');
      setStartDate('');
      setEndDate('');
      setCollegeName('');
      setRoleToGrant('temp_admin');
    } catch (error) {
      console.error("Error granting delegation:", error);
      showPopup("حدث خطأ أثناء منح التفويض", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeDelegation = async (emp) => {
    if (!window.confirm("هل أنت متأكد من سحب الصلاحيات من هذا الموظف؟")) return;
    
    try {
      await setDoc(doc(db, "users", emp.id), {
        role: 'employee',
        tempAccessStart: null,
        tempAccessEnd: null,
        collegeName: null
      }, { merge: true });
      
      showPopup("تم سحب الصلاحيات بنجاح", "success");
    } catch (error) {
      console.error("Error revoking delegation:", error);
      showPopup("حدث خطأ أثناء سحب التفويض", "error");
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
            <h2 className="text-xl font-bold text-primary dark:text-white">منح الصلاحيات (تفويض وتعيين)</h2>
            <p className="text-sm text-on-surface-variant mt-1">ابحث عن الموظف أو اختره من الجدول أدناه لمنحه صلاحيات إدارية</p>
          </div>
        </div>

        <form onSubmit={handleGrantDelegation} className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-bold text-on-surface mb-2">ابحث عن الموظف (الاسم أو الرقم الوظيفي)</label>
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">search</span>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedEmployee(null);
                }}
                placeholder="ابحث هنا أو اختر من الجدول بالأسفل..."
                className="w-full bg-surface-container-highest/30 border border-outline-variant/30 rounded-xl px-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-primary placeholder:text-on-surface-variant/50"
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

          <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
            <label className="block text-sm font-bold text-on-surface mb-4">نوع الصلاحية الممنوحة</label>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all flex-1 ${roleToGrant === 'temp_admin' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-primary/50'}`}>
                <input 
                  type="radio" 
                  name="role" 
                  value="temp_admin" 
                  checked={roleToGrant === 'temp_admin'} 
                  onChange={(e) => setRoleToGrant(e.target.value)}
                  className="w-5 h-5 text-primary focus:ring-primary"
                />
                <div>
                  <div className="font-bold text-sm text-gray-800">أدمن مؤقت</div>
                  <div className="text-xs text-gray-500 mt-1">يمنح صلاحيات إدارة النظام لفترة محددة</div>
                </div>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all flex-1 ${roleToGrant === 'secretary' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-primary/50'}`}>
                <input 
                  type="radio" 
                  name="role" 
                  value="secretary" 
                  checked={roleToGrant === 'secretary'} 
                  onChange={(e) => setRoleToGrant(e.target.value)}
                  className="w-5 h-5 text-primary focus:ring-primary"
                />
                <div>
                  <div className="font-bold text-sm text-gray-800">سكرتير جهة / كلية</div>
                  <div className="text-xs text-gray-500 mt-1">تعيين كممثل لجهة لتقديم الحجوزات</div>
                </div>
              </label>
            </div>

            {roleToGrant === 'temp_admin' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in zoom-in-95 duration-300">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">تاريخ البداية</label>
                  <input 
                    type="datetime-local" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-outline-variant/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">تاريخ النهاية</label>
                  <input 
                    type="datetime-local" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-outline-variant/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium shadow-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <label className="block text-sm font-bold text-on-surface mb-2">الكلية / الجهة التابع لها</label>
                <select 
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full bg-white border border-outline-variant/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-gray-700 shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:left_1rem_center]"
                >
                  <option value="" disabled>-- اختر الكلية من القائمة --</option>
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
              className="px-8 py-3.5 bg-gradient-to-l from-primary to-primary-container text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined">add_task</span>
              )}
              منح واعتماد الصلاحية
            </button>
          </div>
        </form>
      </div>

      {/* 2. Middle Table for Quick Selection */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-outline-variant/20 relative z-10">
        <h2 className="text-lg font-bold text-primary dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#b58b4b]">groups</span>
          سجل الموظفين (للاختيار السريع)
        </h2>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-outline-variant/20 rounded-xl scrollbar-hide">
          <table className="w-full text-right relative">
            <thead className="sticky top-0 bg-surface-container-highest z-10 shadow-sm">
              <tr className="text-on-surface-variant text-sm border-b border-outline-variant/20">
                <th className="px-4 py-3 font-bold">الموظف</th>
                <th className="px-4 py-3 font-bold">الرقم الوظيفي</th>
                <th className="px-4 py-3 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface bg-white">
              {employees.length > 0 ? employees.map((emp) => (
                <tr key={emp.id} className={`hover:bg-blue-50/50 transition-colors ${selectedEmployee?.id === emp.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                  <td className="px-4 py-3 font-bold flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${selectedEmployee?.id === emp.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <span className="material-symbols-outlined text-[18px]">person</span>
                    </div>
                    <span className={selectedEmployee?.id === emp.id ? 'text-blue-700' : ''}>{emp.displayName || 'بدون اسم'}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">{emp.employeeId}</td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => handleSelectEmployee(emp)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all border ${selectedEmployee?.id === emp.id ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300'}`}
                    >
                      {selectedEmployee?.id === emp.id ? 'تم التحديد ✓' : 'تحديد'}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="px-4 py-8 text-center text-gray-400 font-bold">
                    لا يوجد موظفين مسجلين حالياً.
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
              أصحاب الصلاحيات الإدارية الحالية
            </h2>
            
            {/* Filter Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setDelegationFilter('all')}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${delegationFilter === 'all' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                الكل
              </button>
              <button 
                onClick={() => setDelegationFilter('secretary')}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${delegationFilter === 'secretary' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                سكرتارية الجهات
              </button>
              <button 
                onClick={() => setDelegationFilter('temp_admin')}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${delegationFilter === 'temp_admin' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                الأدمن المؤقت
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-surface-container-highest/50 text-on-surface-variant text-sm border-y border-outline-variant/20">
                  <th className="px-4 py-3 font-bold">المستخدم</th>
                  <th className="px-4 py-3 font-bold">الصلاحية</th>
                  <th className="px-4 py-3 font-bold">تفاصيل / المدة</th>
                  <th className="px-4 py-3 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-on-surface dark:text-slate-300">
                {activeDelegations.filter(d => delegationFilter === 'all' || d.role === delegationFilter).length > 0 ? (
                  activeDelegations.filter(d => delegationFilter === 'all' || d.role === delegationFilter).map((delegation) => (
                  <tr key={delegation.id} className="hover:bg-surface-container-highest/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-bold text-gray-800">{delegation.displayName || 'بدون اسم'}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{delegation.employeeId}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-md ${delegation.role === 'temp_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {delegation.role === 'temp_admin' ? 'أدمن مؤقت' : 'سكرتير جهة'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {delegation.role === 'temp_admin' ? (
                        <div className="text-gray-600 text-xs">
                          من: <span dir="ltr" className="font-bold">{delegation.tempAccessStart ? new Date(delegation.tempAccessStart).toLocaleString('ar-EG') : '-'}</span><br/>
                          إلى: <span dir="ltr" className="font-bold">{delegation.tempAccessEnd ? new Date(delegation.tempAccessEnd).toLocaleString('ar-EG') : '-'}</span>
                        </div>
                      ) : (
                        <div className="text-gray-700 font-bold">
                          {delegation.collegeName || 'غير محدد'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => handleRevokeDelegation(delegation)}
                        className="px-3 py-1.5 text-xs font-bold text-error bg-error/10 hover:bg-error/20 rounded-lg transition-colors flex items-center gap-1 mx-auto"
                        title="سحب الصلاحية والعودة كموظف"
                      >
                        <span className="material-symbols-outlined text-[16px]">person_remove</span>
                        سحب الصلاحية
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500 font-bold">
                    لا يوجد أصحاب صلاحيات مطابقين للفلتر المختار.
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
