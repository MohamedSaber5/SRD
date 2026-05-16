import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id) => {
    try {
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, { read: true });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    const promises = unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }));
    await Promise.all(promises);
  };

  return (
    <div className="fixed top-4 left-4 md:top-6 md:left-6 z-[60] rtl" dir="rtl" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-gray-100 dark:border-slate-700 hover:scale-105 transition-transform"
      >
        <span className="material-symbols-outlined text-primary dark:text-slate-200">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col animate-in slide-in-from-top-2 fade-in duration-200 max-h-[80vh]">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
            <h3 className="font-bold text-[#001e40] dark:text-slate-100">الإشعارات</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs text-primary hover:text-primary-container font-medium transition-colors"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl opacity-50">notifications_off</span>
                <p className="text-sm">لا توجد إشعارات حالياً</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  className={`p-3 rounded-xl transition-colors cursor-pointer flex items-start gap-3 ${notification.read ? 'hover:bg-gray-50 dark:hover:bg-slate-800/50 opacity-70' : 'bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${notification.type === 'modification' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {notification.type === 'modification' ? 'edit_notifications' : 'info'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-sm ${!notification.read ? 'font-bold text-[#001e40] dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300'}`}>
                        {notification.message}
                      </p>
                      {!notification.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {notification.createdAt?.toDate().toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Footer Link (Optional: view all) */}
          <div className="p-3 border-t border-gray-100 dark:border-slate-800 text-center bg-gray-50/50 dark:bg-slate-800/50">
            <span className="text-xs text-gray-500">إشعارات النظام التلقائية</span>
          </div>
        </div>
      )}
    </div>
  );
}
