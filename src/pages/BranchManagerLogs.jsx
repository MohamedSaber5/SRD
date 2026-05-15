import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, getDocs } from 'firebase/firestore';

export default function BranchManagerLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [userMap, setUserMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch users for mapping
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const mapping = {};
        snap.forEach(doc => {
          const data = doc.data();
          if (data.employeeId) {
            mapping[data.employeeId.toString().toLowerCase()] = data;
            mapping[`${data.employeeId}@aast.edu`.toLowerCase()] = data;
          }
          if (data.email) mapping[data.email.toLowerCase()] = data;
          mapping[doc.id] = data;
        });
        setUserMap(mapping);
      } catch (error) {
        console.error("Error fetching users for logs:", error);
      }
    };
    fetchUsers();
    const qAudit = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
    const auditUnsubscribe = onSnapshot(qAudit, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAuditLogs(logs);
    });

    return () => {
      auditUnsubscribe();
    };
  }, []);

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">سجل النشاط والصلاحيات (Audit Logs)</h1>
          <p className="text-on-surface-variant mt-2 text-lg">مراقبة دقيقة لكل تحركات مدراء النظام والسكرتارية لتحديد المسؤوليات.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-container-high mb-6">
        <div className="relative">
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            type="text" 
            placeholder="البحث في سجل النشاط (بالاسم، الإجراء، أو التفاصيل)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-highest border-none rounded-2xl py-4 pr-12 pl-4 text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-surface-container-high min-h-[500px]">
        <div className="space-y-4">
          {auditLogs.length > 0 ? auditLogs.filter(log => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            const actionByLower = log.actionBy?.toLowerCase() || '';
            const userDetails = userMap[actionByLower] || userMap[actionByLower.split('@')[0]] || null;
            const displayName = userDetails?.displayName || log.actionByName || '';
            
            return (
              displayName.toLowerCase().includes(q) ||
              (log.details && log.details.toLowerCase().includes(q)) ||
              (log.actionType && log.actionType.toLowerCase().includes(q))
            );
          }).map((log) => {
            const actionByLower = log.actionBy?.toLowerCase() || '';
            const userDetails = userMap[actionByLower] || userMap[actionByLower.split('@')[0]] || null;
            
            // Prefer the matched user's name, then the log's saved name (if not generic), then generic fallback
            const isGenericName = log.actionByName === 'Admin' || log.actionByName === 'مستخدم';
            const displayName = userDetails?.displayName || (!isGenericName ? log.actionByName : 'مدير النظام (افتراضي)');
            
            return (
            <div 
              key={log.id} 
              onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600">
                    <span className="material-symbols-outlined text-[24px]">
                      {log.actionType === 'REQUEST_BOOKING' ? 'bookmark_added' : 
                       log.actionType === 'DELEGATE_ADMIN' ? 'admin_panel_settings' : 
                       log.actionType === 'ADD_ROOM' ? 'meeting_room' :
                       log.actionType === 'EDIT_ROOM' ? 'edit_square' :
                       log.actionType === 'DELETE_ROOM' ? 'delete' : 'badge'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1e3a5f] text-lg leading-none mb-1">
                      {displayName}
                    </h3>
                    <div className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block">
                      {log.actionBy || 'بدون معرف'}
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <time className="text-sm font-bold text-gray-400 block">
                    {log.timestamp ? new Date(log.timestamp.toDate()).toLocaleDateString('ar-EG') : 'الآن'}
                  </time>
                  <time className="text-xs font-bold text-gray-400 block mt-1">
                    {log.timestamp ? new Date(log.timestamp.toDate()).toLocaleTimeString('ar-EG') : ''}
                  </time>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-[#1e3a5f] font-black text-md leading-relaxed mb-1">
                  {log.actionType === 'REQUEST_BOOKING' ? 'طلب حجز قاعة' : 
                   log.actionType === 'DELEGATE_ADMIN' ? 'منح تفويض أدمن مؤقت' : 
                   log.actionType === 'ASSIGN_SECRETARY' ? 'تعيين سكرتير كلية' : 
                   log.actionType === 'ADD_ROOM' ? 'إضافة قاعة جديدة' :
                   log.actionType === 'EDIT_ROOM' ? 'تعديل بيانات قاعة' :
                   log.actionType === 'DELETE_ROOM' ? 'إزالة قاعة' : 'إجراء إداري'}
                </p>
                <div className="bg-gray-50 p-1.5 rounded-full text-gray-400 group-hover:text-[#1e3a5f] group-hover:bg-gray-100 transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: selectedLog?.id === log.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    keyboard_arrow_down
                  </span>
                </div>
              </div>
              
              {/* Expandable Details */}
              {selectedLog?.id === log.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                  <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-5 text-sm text-gray-700 font-medium leading-relaxed shadow-inner">
                    <div className="flex items-center gap-2 mb-4 text-[#1e3a5f]">
                      <span className="material-symbols-outlined text-[20px]">info</span>
                      <strong className="block text-lg font-headline">تفاصيل الإجراء الإضافية</strong>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-5 text-gray-600 font-bold leading-relaxed border-r-4 border-r-blue-400">
                      {log.details || 'لا توجد تفاصيل إضافية لهذا الإجراء.'}
                    </div>
                    
                    {userDetails && (
                      <div className="mt-4">
                        <strong className="text-[#1e3a5f] flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-[18px]">badge</span>
                          البيانات الفنية لحساب المستخدم
                        </strong>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                          <div><span className="font-bold text-gray-400 block mb-1">الاسم بالكامل</span> <span className="text-[#1e3a5f] font-black text-sm">{userDetails.displayName}</span></div>
                          <div><span className="font-bold text-gray-400 block mb-1">الرقم الوظيفي</span> <span className="text-[#1e3a5f] font-black text-sm">{userDetails.employeeId}</span></div>
                          <div><span className="font-bold text-gray-400 block mb-1">دور النظام</span> <span className="text-secondary font-black text-sm">{userDetails.role === 'admin' ? 'مدير نظام' : userDetails.role === 'branch_manager' ? 'مدير فرع' : userDetails.role === 'secretary' ? 'سكرتير' : userDetails.role === 'temp_admin' ? 'مدير مؤقت' : 'موظف'}</span></div>
                          {userDetails.collegeName ? <div><span className="font-bold text-gray-400 block mb-1">الجهة / الكلية</span> <span className="text-[#1e3a5f] font-black text-sm">{userDetails.collegeName}</span></div> : <div><span className="font-bold text-gray-400 block mb-1">حالة الحساب</span> <span className="text-green-600 font-black text-sm flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> نشط</span></div>}
                        </div>
                      </div>
                    )}

                    {/* Add any other metadata if available */}
                    {log.targetUserId && (
                      <div className="mt-4 text-xs text-gray-500 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <span className="font-bold text-gray-400">المستخدم المستهدف:</span> <span className="text-gray-800 font-bold">{log.targetUserId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedLog?.id !== log.id && (
                <p className="text-gray-400 font-medium text-sm leading-relaxed truncate mt-2">
                  {log.details}
                </p>
              )}
            </div>
          );
          }) : (
            <div className="text-center py-20 flex flex-col items-center gap-4">
               <span className="material-symbols-outlined text-6xl text-gray-300">history</span>
               <p className="text-xl text-gray-400 font-bold">لا توجد سجلات نشاط مسجلة حتى الآن.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
