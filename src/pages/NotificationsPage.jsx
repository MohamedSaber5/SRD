import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto rtl" dir="rtl">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">الإشعارات</h1>
          <p className="text-on-surface-variant mt-2 text-lg">متابعة تحديثات طلبات الحجز الخاصة بك</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllRead}
            className="text-sm font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-xl transition-colors border border-primary/20"
          >
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`p-6 rounded-2xl border transition-all flex items-start gap-4 ${notification.read ? 'bg-surface border-surface-container-high' : 'bg-primary/5 border-primary/20 shadow-sm'}`}
            onClick={() => !notification.read && markAsRead(notification.id)}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === 'modification' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
              <span className="material-symbols-outlined">
                {notification.type === 'modification' ? 'edit_notifications' : 'info'}
              </span>
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className={`font-bold text-lg ${notification.read ? 'text-on-surface' : 'text-primary'}`}>
                  {notification.message}
                </h3>
                <span className="text-[10px] text-on-surface-variant font-medium opacity-60">
                  {notification.createdAt?.toDate().toLocaleString('ar-EG')}
                </span>
              </div>
              <p className="text-on-surface-variant mt-1 text-sm leading-relaxed">
                تم تحديث بيانات الحجز الخاص بك ليتوافق مع الجدول الزمني أو المتطلبات التشغيلية. يرجى مراجعة تفاصيل الحجز في لوحة التحكم.
              </p>
              {!notification.read && (
                <div className="mt-3 flex items-center gap-1 text-[10px] font-black text-secondary uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
                   جديد
                </div>
              )}
            </div>
          </div>
        ))}

        {!loading && notifications.length === 0 && (
          <div className="py-32 text-center opacity-40 flex flex-col items-center gap-4">
             <span className="material-symbols-outlined text-7xl font-light">notifications_off</span>
             <p className="text-xl font-bold">لا يوجد أي إشعارات حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}
