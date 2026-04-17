import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterScreen() {
  const navigate = useNavigate();
  const { register, currentUser, userRole } = useAuth();
  
  // Auto-redirect if already logged in
  useEffect(() => {
    if (currentUser && userRole) {
      if (userRole === 'admin') navigate('/admin');
      else if (userRole === 'branch_manager') navigate('/branch_manager');
      else navigate('/dashboard');
    }
  }, [currentUser, userRole, navigate]);

  const [role, setRole] = useState('employee');
  const [name, setName] = useState('');
  const [uid, setUid] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !uid || !password) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await register(name, uid, role, password);
      console.log("Registration successful, navigating...");
      // Standardize navigation to dashboard, Guard will handle the rest
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء التسجيل، ربما الرقم الوظيفي مسجل مسبقاً');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[radial-gradient(circle_at_0%_0%,_#d5e3ff_0%,_transparent_40%),_radial-gradient(circle_at_100%_100%,_#ffdea5_0%,_transparent_40%),_#f7f9fb] min-h-screen flex items-center justify-center p-4 md:p-8 rtl" dir="rtl">
      <main className="w-full max-w-5xl flex flex-col md:flex-row gap-0 overflow-hidden rounded-[2rem] shadow-2xl bg-surface-container-lowest">
        <section className="hidden md:flex md:w-2/5 relative bg-primary overflow-hidden items-center justify-center p-12 text-center">
          <div className="absolute inset-0 opacity-20">
            <img 
              alt="Academy Campus Architecture" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZe0z7YRzJBTvkRxABjY4c00sfpsazuY6yD9xl2j-l6CRXA58Zn4oItLYSFdNUUyNYJJ7cvcbMuuQ9QV2ad6Wfh8nwrYoNgBMgRFukRbqk59GLHSAO8bSnk_p_e8OWlDNBz0LJHaxez-e4IWFAaDlBiGbjKxsBCP1rXzM_ku4_L-eiMdJhmiy2-vLJ7-CTdcIYIg_3TwlPysVhDPwRp0WZ7dBOO12GT8JaU49iD-RNYvagqMZW9ai87BhxH1u7e3hsH2TNfdLNf2SS"
            />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 bg-secondary-fixed rounded-2xl mx-auto flex items-center justify-center shadow-lg transform rotate-3">
              <span className="material-symbols-outlined text-primary text-4xl" data-icon="school">school</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight leading-tight">بوابة الأكاديمية الحديثة</h2>
            <p className="text-primary-fixed-dim text-lg leading-relaxed">انضم إلى المنظومة الرقمية المتطورة لإدارة الموارد والقاعات الدراسية بكل سهولة واحترافية.</p>
          </div>
        </section>

        <section className="w-full md:w-3/5 p-8 md:p-12 lg:p-16 overflow-y-auto max-h-[921px]">
          <div className="max-w-md mx-auto">
            <header className="mb-10 text-right">
              <h1 className="text-4xl font-black text-on-surface tracking-tight mb-2">إنشاء حساب جديد</h1>
              <p className="text-on-surface-variant text-lg">سجل بياناتك للبدء في استخدام النظام</p>
            </header>
            
            {error && <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm text-center mb-4">{error}</div>}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 text-right">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant pr-2" htmlFor="name">الاسم الكامل</label>
                  <div className="relative">
                    <input value={name} onChange={e=>setName(e.target.value)} className="w-full px-5 py-4 rounded-xl bg-surface-container-high border-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/50 text-on-surface" id="name" placeholder="أدخل اسمك كما في الهوية" type="text" required/>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant pr-2" htmlFor="uid">الرقم الوظيفي الفريد (Unique ID)</label>
                  <input value={uid} onChange={e=>setUid(e.target.value)} className="w-full px-5 py-4 rounded-xl bg-surface-container-high border-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/50 text-on-surface" id="uid" placeholder="مثال: 12345" type="text" required/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant pr-2" htmlFor="pass">كلمة المرور</label>
                    <input value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-5 py-4 rounded-xl bg-surface-container-high border-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/50 text-on-surface" id="pass" placeholder="••••••••" type="password" required/>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant pr-2" htmlFor="confirm">تأكيد كلمة المرور</label>
                    <input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full px-5 py-4 rounded-xl bg-surface-container-high border-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/50 text-on-surface" id="confirm" placeholder="••••••••" type="password" required/>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:scale-100">
                  <span>{isLoading ? 'جاري التسجيل...' : 'إنشاء الحساب'}</span>
                  {!isLoading && <span className="material-symbols-outlined" data-icon="person_add">person_add</span>}
                </button>
              </div>

              <div className="text-center mt-4">
                <p className="text-on-surface-variant text-sm">
                  لديك حساب بالفعل؟ <Link to="/login" className="text-primary font-bold hover:underline transition-all">تسجيل الدخول</Link>
                </p>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
