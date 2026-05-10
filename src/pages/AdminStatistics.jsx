import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

// Colors for charts
const COLORS = ['#1e3a5f', '#b58b4b', '#e2c58a', '#5a7698', '#94a3b8', '#cbd5e1'];
const STATUS_COLORS = {
  approved: '#22c55e', // Green
  pending: '#eab308', // Yellow
  awaiting_manager_final: '#f59e0b', // Amber
  rejected: '#ef4444', // Red
  cancelled: '#64748b' // Gray
};

export default function AdminStatistics() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Time Filter State (Optional for future)
  const [timeFilter, setTimeFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookingsSnap = await getDocs(query(collection(db, 'bookings')));
        const roomsSnap = await getDocs(query(collection(db, 'rooms')));
        
        setBookings(bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setRooms(roomsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching stats data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Data Processing for Charts ---

  // 1. Request Status Breakdown
  const statusData = useMemo(() => {
    const counts = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});
    
    return [
      { name: t('dashboard.status.approved'), value: counts.approved || 0, color: STATUS_COLORS.approved },
      { name: t('dashboard.status.pending'), value: counts.pending || 0, color: STATUS_COLORS.pending },
      { name: t('dashboard.status.awaiting_manager_final'), value: counts.awaiting_manager_final || 0, color: STATUS_COLORS.awaiting_manager_final },
      { name: t('dashboard.status.rejected'), value: counts.rejected || 0, color: STATUS_COLORS.rejected },
    ].filter(item => item.value > 0);
  }, [bookings, t]);

  // 2. Most Requested Rooms
  const topRoomsData = useMemo(() => {
    const counts = bookings.reduce((acc, b) => {
      acc[b.roomId] = (acc[b.roomId] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts)
      .map(([roomId, count]) => ({ roomId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }, [bookings]);

  // 3. Peak Hours
  const peakHoursData = useMemo(() => {
    const hours = {};
    bookings.forEach(b => {
      if (b.timeFrom && b.status !== 'rejected' && b.status !== 'cancelled') {
        // Simple extraction of the starting hour
        const hour = parseInt(b.timeFrom.split(':')[0], 10);
        if (!isNaN(hour)) {
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
          const label = `${displayHour} ${ampm}`;
          hours[label] = (hours[label] || 0) + 1;
        }
      }
    });
    
    // Sort appropriately (8 AM to 8 PM)
    const hourOrder = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM'];
    
    return hourOrder.map(h => ({
      hour: h,
      bookings: hours[h] || 0
    }));
  }, [bookings]);

  // 4. Late / Emergency Requests (Booked < 2 days in advance vs Normal)
  const leadTimeData = useMemo(() => {
    let emergency = 0;
    let normal = 0;
    
    bookings.forEach(b => {
      if (b.createdAt && b.date) {
        const createdDate = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        const eventDate = new Date(b.date);
        const diffTime = Math.abs(eventDate - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 2) emergency++;
        else normal++;
      }
    });
    
    return [
      { name: t('adminStatistics.earlyRequest'), value: normal },
      { name: t('adminStatistics.emergencyRequest'), value: emergency }
    ];
  }, [bookings]);


  // 6. Hall Category (Multi vs Lecture)
  const categoryData = useMemo(() => {
    let multi = 0;
    let lecture = 0;
    bookings.forEach(b => {
      if (b.hallCategory === 'multi') multi++;
      else lecture++;
    });
    return [
      { name: t('adminStatistics.multiPurpose'), value: multi },
      { name: t('adminStatistics.lectureHalls'), value: lecture }
    ];
  }, [bookings]);

  // 7. Busiest Days of the Week (الأيام الأكثر ازدحاماً)
  const busiestDaysData = useMemo(() => {
    const daysCount = {
      [t('common.days.sunday')]: 0,
      [t('common.days.monday')]: 0,
      [t('common.days.tuesday')]: 0,
      [t('common.days.wednesday')]: 0,
      [t('common.days.thursday')]: 0,
      [t('common.days.friday')]: 0,
      [t('common.days.saturday')]: 0
    };
    
    bookings.forEach(b => {
      if (b.date && b.status !== 'rejected' && b.status !== 'cancelled') {
        const date = new Date(b.date);
        const dayIndex = date.getDay(); // 0 is Sunday
        const days = [
          t('common.days.sunday'), 
          t('common.days.monday'), 
          t('common.days.tuesday'), 
          t('common.days.wednesday'), 
          t('common.days.thursday'), 
          t('common.days.friday'), 
          t('common.days.saturday')
        ];
        const dayName = days[dayIndex];
        if (dayName) {
          daysCount[dayName]++;
        }
      }
    });

    return [
      { name: t('common.days.saturday'), count: daysCount[t('common.days.saturday')] },
      { name: t('common.days.sunday'), count: daysCount[t('common.days.sunday')] },
      { name: t('common.days.monday'), count: daysCount[t('common.days.monday')] },
      { name: t('common.days.tuesday'), count: daysCount[t('common.days.tuesday')] },
      { name: t('common.days.wednesday'), count: daysCount[t('common.days.wednesday')] },
      { name: t('common.days.thursday'), count: daysCount[t('common.days.thursday')] },
      { name: t('common.days.friday'), count: daysCount[t('common.days.friday')] },
    ];
  }, [bookings, t]);

  // 8. Bookings by Building (حجوزات المباني)
  const buildingData = useMemo(() => {
    const counts = {};
    bookings.forEach(b => {
      const room = rooms.find(r => r.id === b.roomId);
      if (room && room.building) {
        counts[room.building] = (counts[room.building] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name: `${t('common.building')} ${name}`, value })).sort((a,b) => b.value - a.value);
  }, [bookings, rooms, t]);

  // Custom Tooltip formatter for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-gray-100 dark:border-slate-700 shadow-xl rounded-xl rtl">
          <p className="font-bold text-[#001e40] dark:text-white">{label}</p>
          <p className="text-[#5a7698] dark:text-slate-400">{`${t('adminStatistics.countLabel')}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-blue-500">
        <span className="material-symbols-outlined animate-spin text-6xl">sync</span>
      </div>
    );
  }

  // Determine what to show based on role
  const isBranchManager = userRole === 'branch_manager';

  return (
    <div className="rtl pb-20" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-8 px-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-[#1e3a5f] dark:text-blue-300 rtl:rotate-0 ltr:rotate-180">arrow_forward</span>
        </button>
        <div className="text-right rtl:text-right ltr:text-left">
          <h1 className="text-4xl font-headline font-black text-[#001e40] dark:text-blue-300 tracking-tight">{t('adminStatistics.title')}</h1>
          <p className="text-[#5a7698] dark:text-slate-400 mt-2 text-lg">{t('adminStatistics.subtitle')} {isBranchManager ? t('adminStatistics.branchManagerNote') : t('adminStatistics.adminNote')}</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[#5a7698] dark:text-slate-400 font-bold text-sm mb-1">{t('adminStatistics.totalRequests')}</p>
              <h3 className="text-4xl font-black text-[#001e40] dark:text-white">{bookings.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <span className="material-symbols-outlined">analytics</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-green-50 dark:bg-green-900/10 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[#5a7698] dark:text-slate-400 font-bold text-sm mb-1">{t('adminStatistics.approvedRequests')}</p>
              <h3 className="text-4xl font-black text-[#001e40] dark:text-white">{bookings.filter(b => b.status === 'approved').length}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-amber-50 dark:bg-amber-900/10 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[#5a7698] dark:text-slate-400 font-bold text-sm mb-1">{t('adminStatistics.emergencyRequests')}</p>
              <h3 className="text-4xl font-black text-[#001e40] dark:text-white">{leadTimeData.find(d => d.name.includes('طارئ'))?.value || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <span className="material-symbols-outlined">warning</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[#5a7698] dark:text-slate-400 font-bold text-sm mb-1">{t('adminStatistics.mostRequestedRoom')}</p>
              <h3 className="text-2xl font-black text-[#001e40] dark:text-white mt-2">{topRoomsData[0]?.roomId || t('common.none')}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <span className="material-symbols-outlined">meeting_room</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4">
        
        {/* === CHARTS VISIBLE TO BOTH OR ADMIN SPECIFIC === */}
        {/* Peak Hours */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800">
          <h2 className="text-xl font-headline font-black text-[#001e40] dark:text-blue-300 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#b58b4b] dark:text-[#d4af37]">schedule</span>
            {t('adminStatistics.peakHours')}
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={peakHoursData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="bookings" stroke="#1e3a5f" strokeWidth={3} fillOpacity={1} fill="url(#colorBookings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Busiest Days of the week */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 lg:col-span-2">
          <h2 className="text-xl font-headline font-black text-[#001e40] dark:text-blue-300 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#b58b4b] dark:text-[#d4af37]">calendar_month</span>
            {t('adminStatistics.busiestDays')}
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={busiestDaysData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#5a7698', fontSize: 14, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" fill="#1e3a5f" radius={[8, 8, 0, 0]} barSize={50} label={{ position: 'top', fill: '#001e40', fontWeight: 'bold' }}>
                  {busiestDaysData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 4 || index === 5 ? '#e2c58a' : '#1e3a5f'} /> /* highlight weekends/thursday */
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Requested Rooms */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800">
          <h2 className="text-xl font-headline font-black text-[#001e40] dark:text-blue-300 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#b58b4b] dark:text-[#d4af37]">domain</span>
            {t('adminStatistics.mostRequestedRooms')}
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRoomsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="roomId" type="category" axisLine={false} tickLine={false} tick={{fill: '#5a7698', fontSize: 12, fontWeight: 'bold'}} width={80} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" fill="#b58b4b" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings by Building (All roles) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800">
          <h2 className="text-xl font-headline font-black text-[#001e40] dark:text-blue-300 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#b58b4b] dark:text-[#d4af37]">apartment</span>
            {t('adminStatistics.buildingPressure')}
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buildingData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#5a7698', fontSize: 14, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#5a7698" radius={[8, 8, 0, 0]} barSize={60} label={{ position: 'top', fill: '#001e40', fontWeight: 'bold' }}>
                  {buildingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown (Branch Manager or Admin) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800">
          <h2 className="text-xl font-headline font-black text-[#001e40] dark:text-blue-300 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#b58b4b] dark:text-[#d4af37]">donut_large</span>
            {t('adminStatistics.statusDistribution')}
          </h2>
          <div className="h-72 w-full flex items-center justify-center relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+18px)] text-center pointer-events-none">
                <span className="block text-3xl font-black text-[#001e40] dark:text-white">{bookings.length}</span>
                <span className="block text-[10px] text-[#5a7698] dark:text-slate-400 uppercase">{t('adminStatistics.requestLabel')}</span>
             </div>
          </div>
        </div>


        {/* === CHARTS SPECIFIC TO BRANCH MANAGER (OR BOTH IF DESIRED) === */}
        {/* Branch manager cares more about emergency requests, category breakdown, etc. */}
        {/* Late vs Normal Requests */}
        {(isBranchManager) && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800">
            <h2 className="text-xl font-headline font-black text-[#001e40] dark:text-blue-300 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b58b4b] dark:text-[#d4af37]">timer</span>
              {t('adminStatistics.emergencyVsNormal')}
            </h2>
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadTimeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      <Cell fill="#1e3a5f" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {(isBranchManager) && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800">
            <h2 className="text-xl font-headline font-black text-[#001e40] dark:text-blue-300 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b58b4b] dark:text-[#d4af37]">category</span>
              {t('adminStatistics.roomCategoryType')}
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#5a7698', fontSize: 12, fontWeight: 'bold'}} />
                  <YAxis hide />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="value" fill="#e2c58a" radius={[8, 8, 0, 0]} barSize={60} label={{ position: 'top', fill: '#001e40', fontWeight: 'bold' }}>
                     <Cell fill="#b58b4b" />
                     <Cell fill="#1e3a5f" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
