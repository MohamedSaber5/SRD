import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, currentUser, userRole } = useAuth();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (currentUser && userRole) {
      if (userRole === 'admin') navigate('/admin');
      else if (userRole === 'branch_manager') navigate('/branch_manager');
      else navigate('/dashboard');
    }
  }, [currentUser, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId || !password) {
      setError('يرجى إدخال الرقم الوظيفي وكلمة المرور');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      await login(employeeId, password);
      console.log("Login successful, waiting for role validation...");
      // removed blind navigate('/dashboard') to let useEffect handle role-based routing
    } catch (err) {
      console.error("Login Error Details:", err.code, err.message);
      if (err.code === 'auth/user-not-found') {
        setError('هذا الرقم الوظيفي غير مسجل');
      } else if (err.code === 'auth/wrong-password') {
        setError('كلمة المرور غير صحيحة');
      } else {
        setError('رقم وظيفي أو كلمة مرور غير صحيحة');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedUsers = async () => {
    setIsLoading(true);
    const testUsers = [
      { email: 'admin@aast.edu', pass: 'aast1234' },
      { email: 'manager@aast.edu', pass: 'aast1234' },
      { email: 'employee@aast.edu', pass: 'aast1234' },
      { email: 'secretary@aast.edu', pass: 'aast1234' }
    ];

    for (const u of testUsers) {
      try {
        await createUserWithEmailAndPassword(auth, u.email, u.pass);
        console.log(`Created: ${u.email}`);
      } catch (e) {
        console.warn(`${u.email} already exists or failed:`, e.code);
      }
    }
    alert('تمت تهيئة مستخدمي الاختبار بكلمة مرور: aast1234');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-primary text-on-surface">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary-container/80 z-10 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-primary opacity-60"></div>
      </div>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary rounded-full blur-[120px] opacity-30 z-0 pointer-events-none"></div>

      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-16">
        <div className="w-full lg:w-1/2 text-right hidden md:block">
          <h1 className="font-headline font-black text-6xl lg:text-7xl text-on-primary leading-tight tracking-wide mb-6 drop-shadow-lg">
            البوابة الأكاديمية<br/>
            <span className="text-secondary-fixed">لحجز القاعات</span>
          </h1>
          <p className="font-body text-xl lg:text-2xl text-primary-fixed-dim max-w-lg leading-[1.8] opacity-90">
            إدارة المساحات الأكاديمية بالأكاديمية العربية بدقة وذكاء
          </p>
          <div className="mt-12 flex items-center gap-6 opacity-80">
            <div className="flex items-center gap-3">
               <img src="/logo_aast.jpg" alt="AAST" className="w-10 h-10 rounded-full" onError={(e) => e.target.style.display='none'} />
              <span className="text-on-primary font-body text-lg">AASTMT</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md lg:w-1/2">
          <div className="bg-white/95 backdrop-blur-[20px] border border-white/50 rounded-3xl p-10 lg:p-12 shadow-[0_12px_32px_rgba(0,30,64,0.1)] relative overflow-hidden">
            <div className="absolute inset-0 rounded-3xl border border-white/40 pointer-events-none"></div>
            
            <div className="md:hidden text-center mb-8">
              <span className="material-symbols-outlined text-primary text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              <h2 className="font-headline font-black text-3xl text-primary">البوابة الأكاديمية</h2>
              <p className="text-on-surface-variant font-body text-sm mt-2">إدارة المساحات الأكاديمية بدقة وذكاء</p>
            </div>

            <div className="mb-8 hidden md:block text-center">
              <img src="/logo_aast.jpg" alt="AAST Logo" className="w-24 h-24 mx-auto mb-4 rounded-full shadow-md object-cover" onError={(e) => e.target.style.display='none'} />
              <h2 className="font-headline font-bold text-3xl text-primary mb-2">تسجيل الدخول</h2>
              <p className="text-on-surface-variant font-body text-base">مرحباً بك في البوابة الأكاديمية</p>
            </div>

            {error && <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm text-center mb-4">{error}</div>}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2 text-right">
                <label className="block font-body text-sm font-medium text-on-surface-variant" htmlFor="employeeId">الرقم الوظيفي</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="material-symbols-outlined text-outline">badge</span>
                  </span>
                  <input 
                    className="block w-full rounded-xl border-0 py-3.5 pr-12 pl-4 text-on-surface bg-surface-container-high focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors text-right font-body placeholder:text-outline-variant" 
                    id="employeeId" 
                    name="employeeId" 
                    placeholder="أدخل الرقم الوظيفي" 
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 text-right">
                <label className="block font-body text-sm font-medium text-on-surface-variant" htmlFor="password">كلمة المرور</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="material-symbols-outlined text-outline">lock</span>
                  </span>
                  <input 
                    className="block w-full rounded-xl border-0 py-3.5 pr-12 pl-4 text-on-surface bg-surface-container-high focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors text-right font-body placeholder:text-outline-variant" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold text-lg py-4 rounded-xl shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:scale-100"
                >
                  {isLoading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                  {!isLoading && <span className="material-symbols-outlined rotate-180 text-xl">arrow_forward</span>}
                </button>
              </div>
              
              <div className="text-center mt-6 space-y-4">
                <p className="text-on-surface-variant text-sm">
                  ليس لديك حساب؟ <Link to="/register" className="text-primary font-bold hover:underline transition-all">إنشاء حساب جديد</Link>
                </p>
                <div className="pt-4 border-t border-surface-container-high">
                  <button 
                    type="button"
                    onClick={handleSeedUsers} 
                    className="text-[10px] text-on-surface-variant/40 hover:text-primary transition-colors"
                  >
                    تهيئة مستخدمي الاختبار (Dev Only)
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
