import { useState, useEffect, useMemo } from 'react';
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
      { name: 'مقبول', value: counts.approved || 0, color: STATUS_COLORS.approved },
      { name: 'معلق للأدمن', value: counts.pending || 0, color: STATUS_COLORS.pending },
      { name: 'انتظار المدير', value: counts.awaiting_manager_final || 0, color: STATUS_COLORS.awaiting_manager_final },
      { name: 'مرفوض', value: counts.rejected || 0, color: STATUS_COLORS.rejected },
    ].filter(item => item.value > 0);
  }, [bookings]);

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
      { name: 'طلب مبكر (طبيعي)', value: normal },
      { name: 'طلب طارئ (< 48 ساعة)', value: emergency }
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
      { name: 'متعددة الأغراض', value: multi },
      { name: 'قاعات محاضرات', value: lecture }
    ];
  }, [bookings]);

  // 7. Busiest Days of the Week (الأيام الأكثر ازدحاماً)
  const busiestDaysData = useMemo(() => {
    const daysCount = {
      'الأحد': 0,
      'الإثنين': 0,
      'الثلاثاء': 0,
      'الأربعاء': 0,
      'الخميس': 0,
      'الجمعة': 0,
      'السبت': 0
    };
    
    bookings.forEach(b => {
      if (b.date && b.status !== 'rejected' && b.status !== 'cancelled') {
        const date = new Date(b.date);
        const dayIndex = date.getDay(); // 0 is Sunday
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const dayName = days[dayIndex];
        if (dayName) {
          daysCount[dayName]++;
        }
      }
    });

    return [
      { name: 'السبت', count: daysCount['السبت'] },
      { name: 'الأحد', count: daysCount['الأحد'] },
      { name: 'الإثنين', count: daysCount['الإثنين'] },
      { name: 'الثلاثاء', count: daysCount['الثلاثاء'] },
      { name: 'الأربعاء', count: daysCount['الأربعاء'] },
      { name: 'الخميس', count: daysCount['الخميس'] },
      { name: 'الجمعة', count: daysCount['الجمعة'] },
    ];
  }, [bookings]);

  // 8. Bookings by Building (حجوزات المباني)
  const buildingData = useMemo(() => {
    const counts = {};
    bookings.forEach(b => {
      const room = rooms.find(r => r.id === b.roomId);
      if (room && room.building) {
        counts[room.building] = (counts[room.building] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name: `مبنى ${name}`, value })).sort((a,b) => b.value - a.value);
  }, [bookings, rooms]);

  // Custom Tooltip formatter for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl rtl">
          <p className="font-bold text-[#001e40]">{label}</p>
          <p className="text-[#5a7698]">{`العدد: ${payload[0].value}`}</p>
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
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <span className="material-symbols-outlined text-[#1e3a5f]">arrow_forward</span>
        </button>
        <div>
          <h1 className="text-4xl font-headline font-black text-[#001e40] tracking-tight">إحصائيات وتقارير النظام</h1>
          <p className="text-[#5a7698] mt-2 text-lg">تحليل شامل لاستخدام القاعات ومعدلات الطلب {isBranchManager ? '(صلاحيات مدير الفرع)' : '(صلاحيات مسؤول النظام)'}</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 mb-8">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[#5a7698] font-bold text-sm mb-1">إجمالي الطلبات</p>
              <h3 className="text-4xl font-black text-[#001e40]">{bookings.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined">analytics</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-green-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[#5a7698] font-bold text-sm mb-1">الطلبات المقبولة</p>
              <h3 className="text-4xl font-black text-[#001e40]">{bookings.filter(b => b.status === 'approved').length}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-amber-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[#5a7698] font-bold text-sm mb-1">الطلبات الطارئة (متأخرة)</p>
              <h3 className="text-4xl font-black text-[#001e40]">{leadTimeData.find(d => d.name.includes('طارئ'))?.value || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined">warning</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-purple-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[#5a7698] font-bold text-sm mb-1">القاعة الأكثر طلباً</p>
              <h3 className="text-2xl font-black text-[#001e40] mt-2">{topRoomsData[0]?.roomId || 'لا يوجد'}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <span className="material-symbols-outlined">meeting_room</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4">
        
        {/* === CHARTS VISIBLE TO BOTH OR ADMIN SPECIFIC === */}
        {/* Peak Hours */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h2 className="text-xl font-headline font-black text-[#001e40] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#b58b4b]">schedule</span>
            ساعات الذروة
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
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-xl font-headline font-black text-[#001e40] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#b58b4b]">calendar_month</span>
            الأيام الأكثر ازدحاماً (مدار الأسبوع)
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
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h2 className="text-xl font-headline font-black text-[#001e40] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#b58b4b]">domain</span>
            القاعات الأكثر طلباً
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
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h2 className="text-xl font-headline font-black text-[#001e40] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#b58b4b]">apartment</span>
            الضغط على المباني
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
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h2 className="text-xl font-headline font-black text-[#001e40] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#b58b4b]">donut_large</span>
            توزيع حالة الطلبات
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
                <span className="block text-3xl font-black text-[#001e40]">{bookings.length}</span>
                <span className="block text-[10px] text-[#5a7698] uppercase">طلب</span>
             </div>
          </div>
        </div>


        {/* === CHARTS SPECIFIC TO BRANCH MANAGER (OR BOTH IF DESIRED) === */}
        {/* Branch manager cares more about emergency requests, category breakdown, etc. */}
        {/* Late vs Normal Requests */}
        {(isBranchManager) && (
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-headline font-black text-[#001e40] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b58b4b]">timer</span>
              الطلبات الطارئة مقابل الطبيعية
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
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-headline font-black text-[#001e40] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b58b4b]">category</span>
              نوع القاعات المطلوبة
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
