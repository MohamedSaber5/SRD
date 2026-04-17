import { Link } from 'react-router-dom';

export default function LoginScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-primary text-on-surface rtl" dir="rtl">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary-container/80 z-10 mix-blend-multiply"></div>
        <img 
          alt="Academic Background" 
          className="w-full h-full object-cover object-center filter blur-[2px] opacity-60" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ1GHscbXb0e0GI3SLErKFr6WZApiCqtuLfbti7AbzO2NxrRpHQFkhFx8HBdE03KVdFnY-dIJ4E5C3Wk9WLZw7a57kAW1Zcf4Jy67_xhKskcfRD25OtHGJdGD64RCDItXuy9mrCMF_rp7UK_MOdLjM1t7mzMTTkrlCVPdskh4XTT9L-MlWJ8bwAMIOY4ht611V2OQmh01dO3lNEuPWOVwHRwgjTXeUW2RoI7bmSumU6vQ8ceE9JFio7LApY5cYnmzYHBkXK9lMsakU"
        />
      </div>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary rounded-full blur-[120px] opacity-30 z-0 pointer-events-none"></div>

      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-16">
        <div className="w-full lg:w-1/2 text-right hidden md:block">
          <h1 className="font-headline font-black text-6xl lg:text-7xl text-on-primary leading-tight tracking-wide mb-6 drop-shadow-lg">
            البوابة الأكاديمية<br/>
            <span className="text-secondary-fixed">لحجز القاعات</span>
          </h1>
          <p className="font-body text-xl lg:text-2xl text-primary-fixed-dim max-w-lg leading-[1.8] opacity-90">
            إدارة المساحات الأكاديمية بدقة وذكاء
          </p>
          <div className="mt-12 flex items-center gap-6 opacity-80">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary-fixed text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>assured_workload</span>
              <span className="text-on-primary font-body text-lg">AASTMT</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md lg:w-1/2">
          <div className="bg-white/85 backdrop-blur-[20px] border border-white/50 rounded-3xl p-10 lg:p-12 shadow-[0_12px_32px_rgba(0,30,64,0.1)] relative overflow-hidden">
            <div className="absolute inset-0 rounded-3xl border border-white/40 pointer-events-none"></div>
            
            <div className="md:hidden text-center mb-8">
              <span className="material-symbols-outlined text-primary text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>assured_workload</span>
              <h2 className="font-headline font-black text-3xl text-primary">البوابة الأكاديمية</h2>
              <p className="text-on-surface-variant font-body text-sm mt-2">إدارة المساحات الأكاديمية بدقة وذكاء</p>
            </div>

            <div className="mb-8 hidden md:block">
              <h2 className="font-headline font-bold text-3xl text-primary mb-2">تسجيل الدخول</h2>
              <p className="text-on-surface-variant font-body text-base">مرحباً بك في البوابة الأكاديمية</p>
            </div>

            <form className="space-y-6">
              <div className="space-y-2 relative text-right">
                <label className="block font-body text-sm font-medium text-on-surface-variant" htmlFor="fullName">الاسم الكامل</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="material-symbols-outlined text-outline">person</span>
                  </span>
                  <input className="block w-full rounded-xl border-0 py-3.5 pr-12 pl-4 text-on-surface bg-surface-container-high focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors text-right font-body placeholder:text-outline-variant" id="fullName" name="fullName" placeholder="أدخل اسمك الكامل" type="text"/>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <label className="block font-body text-sm font-medium text-on-surface-variant" htmlFor="employeeId">الرقم الوظيفي</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="material-symbols-outlined text-outline">badge</span>
                  </span>
                  <input className="block w-full rounded-xl border-0 py-3.5 pr-12 pl-4 text-on-surface bg-surface-container-high focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors text-right font-body placeholder:text-outline-variant" id="employeeId" name="employeeId" placeholder="أدخل الرقم الوظيفي" type="text"/>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <label className="block font-body text-sm font-medium text-on-surface-variant" htmlFor="password">كلمة المرور</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="material-symbols-outlined text-outline">lock</span>
                  </span>
                  <input className="block w-full rounded-xl border-0 py-3.5 pr-12 pl-4 text-on-surface bg-surface-container-high focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors text-right font-body placeholder:text-outline-variant" id="password" name="password" placeholder="••••••••" type="password"/>
                </div>
              </div>

              <div className="pt-4">
                <Link to="/dashboard" className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold text-lg py-4 rounded-xl shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300">
                  تسجيل الدخول
                  <span className="material-symbols-outlined rotate-180 text-xl">arrow_forward</span>
                </Link>
              </div>
              <div className="text-center mt-4 text-sm text-on-surface-variant">
                لا تملك حسايا؟ <Link to="/register" className="text-primary font-bold hover:underline">إنشاء حساب جديد</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
