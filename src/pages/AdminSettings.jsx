import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { usePopup } from '../contexts/PopupContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const DAYS_OF_WEEK = [
  { id: 'Sunday', name: 'الأحد', nameEn: 'Sunday' },
  { id: 'Monday', name: 'الإثنين', nameEn: 'Monday' },
  { id: 'Tuesday', name: 'الثلاثاء', nameEn: 'Tuesday' },
  { id: 'Wednesday', name: 'الأربعاء', nameEn: 'Wednesday' },
  { id: 'Thursday', name: 'الخميس', nameEn: 'Thursday' },
  { id: 'Friday', name: 'الجمعة', nameEn: 'Friday' },
  { id: 'Saturday', name: 'السبت', nameEn: 'Saturday' },
];

const TIMEZONES = [
  { id: 'Africa/Cairo', name: 'القاهرة (GMT+2)', nameEn: 'Cairo (GMT+2)' },
  { id: 'Asia/Riyadh', name: 'الرياض (GMT+3)', nameEn: 'Riyadh (GMT+3)' },
  { id: 'Asia/Dubai', name: 'دبي (GMT+4)', nameEn: 'Dubai (GMT+4)' },
  { id: 'UTC', name: 'توقيت عالمي (UTC)', nameEn: 'Universal (UTC)' },
];

export default function AdminSettings() {
  const { t, i18n } = useTranslation();
  const { showAlert } = usePopup();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    academyName: 'الأكاديمية العربية',
    academyLogo: '',
    language: 'ar',
    timezone: 'Africa/Cairo',
    timeFormat: '12h',
    dateFormat: 'DD/MM/YYYY',
    workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    workStartTime: '08:00',
    workEndTime: '16:00',
    slotDuration: 60,
    ramadanMode: false,
    darkMode: theme === 'dark',
    minAdvanceBookingHours: 24
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const { darkMode, ...otherSettings } = docSnap.data();
          setSettings(prev => ({ ...prev, ...otherSettings }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        showAlert(t('common.errorOccurred'), "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Keep toggle in sync with global theme changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      darkMode: theme === 'dark'
    }));
  }, [theme]);

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setSettings(prev => ({
      ...prev,
      [name]: newValue
    }));

    if (name === 'darkMode') {
      toggleTheme(newValue ? 'dark' : 'light');
    }

    if (name === 'language') {
      i18n.changeLanguage(value);
    }
    
    // Auto-save toggle states immediately to Firestore
    if (type === 'checkbox' && name !== 'darkMode') {
      try {
        const docRef = doc(db, 'settings', 'general');
        await setDoc(docRef, { [name]: newValue }, { merge: true });
        showAlert(newValue ? t('settings.ramadanEnabled') : t('settings.ramadanDisabled'), "success");
      } catch (error) {
        console.error("Error saving toggle:", error);
      }
    }
  };

  const handleWorkingDaysToggle = (dayId) => {
    setSettings(prev => {
      const currentDays = [...prev.workingDays];
      if (currentDays.includes(dayId)) {
        return { ...prev, workingDays: currentDays.filter(d => d !== dayId) };
      } else {
        return { ...prev, workingDays: [...currentDays, dayId] };
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!settings.academyName.trim()) {
      showAlert(t('settings.nameRequired', 'يرجى إدخال اسم الأكاديمية'), "warning");
      return;
    }
    if (settings.workingDays.length === 0) {
      showAlert(t('settings.workingDaysRequired', 'يجب اختيار يوم عمل واحد على الأقل'), "warning");
      return;
    }

    setIsSaving(true);
    try {
      const { darkMode, ...globalSettings } = settings;
      await setDoc(doc(db, 'settings', 'general'), globalSettings, { merge: true });
      showAlert(t('common.saveSuccess'), "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showAlert(t('common.errorOccurred'), "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="text-right rtl:text-right ltr:text-left">
          <h1 className="text-3xl font-headline font-black text-primary dark:text-blue-300 mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl">settings_applications</span>
            {t('sidebar.systemSettings')}
          </h1>
          <p className="text-on-surface-variant dark:text-slate-400 font-body">
            {t('settings.adminDesc', 'تحكم في ثوابت النظام، مواعيد العمل الرسمية، والإعدادات الإقليمية.')}
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-gradient-to-l from-primary to-primary-container dark:from-blue-600 dark:to-blue-800 text-white rounded-xl font-bold shadow-lg hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <span className="material-symbols-outlined">save</span>
          )}
          {t('settings.save')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right rtl:text-right ltr:text-left">
        
        {/* General Info */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-outline-variant/20 dark:border-slate-800">
          <h2 className="text-xl font-bold text-primary dark:text-blue-300 mb-6 flex items-center gap-2 border-b border-outline-variant/10 dark:border-slate-800 pb-4">
            <span className="material-symbols-outlined text-[#b58b4b] dark:text-[#d4af37]">domain</span>
            {t('settings.facilityInfo')}
          </h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-on-surface dark:text-slate-300 mb-2">{t('settings.academyName')}</label>
                <input 
                  type="text" 
                  name="academyName"
                  value={settings.academyName}
                  onChange={handleChange}
                  className="w-full bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold text-gray-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface dark:text-slate-300 mb-2">{t('settings.academyLogo', 'رابط اللوجو')}</label>
                <input 
                  type="text" 
                  name="academyLogo"
                  value={settings.academyLogo}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold text-gray-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-on-surface dark:text-slate-300 mb-2">{t('settings.defaultLang')}</label>
                <select 
                  name="language"
                  value={settings.language}
                  onChange={handleChange}
                  className="w-full bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary font-medium text-gray-700 dark:text-slate-200"
                >
                  <option value="ar">العربية (Arabic)</option>
                  <option value="en">الإنجليزية (English)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface dark:text-slate-300 mb-2">{t('settings.timezone', 'المنطقة الزمنية')}</label>
                <select 
                  name="timezone"
                  value={settings.timezone}
                  onChange={handleChange}
                  className="w-full bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary font-medium text-gray-700 dark:text-slate-200"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz.id} value={tz.id}>{i18n.language === 'ar' ? tz.name : tz.nameEn}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-on-surface dark:text-slate-300 mb-2">{t('settings.dateFormatLabel', 'تنسيق التاريخ')}</label>
                <select 
                  name="dateFormat"
                  value={settings.dateFormat}
                  onChange={handleChange}
                  className="w-full bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary font-medium text-gray-700 dark:text-slate-200"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface dark:text-slate-300 mb-2">{t('settings.timeFormatLabel')}</label>
                <select 
                  name="timeFormat"
                  value={settings.timeFormat}
                  onChange={handleChange}
                  className="w-full bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary font-medium text-gray-700 dark:text-slate-200"
                >
                  <option value="12h">{t('settings.time12h')}</option>
                  <option value="24h">{t('settings.time24h')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-outline-variant/20 dark:border-slate-800">
          <h2 className="text-xl font-bold text-primary dark:text-blue-300 mb-6 flex items-center gap-2 border-b border-outline-variant/10 dark:border-slate-800 pb-4">
            <span className="material-symbols-outlined text-[#b58b4b] dark:text-[#d4af37]">schedule</span>
            {t('settings.workingHours', 'أيام وساعات العمل الرسمية')}
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-on-surface dark:text-slate-300 mb-3">{t('settings.workingDays', 'أيام العمل المسموح بها للحجز')}</label>
              <div className="flex flex-wrap gap-3">
                {DAYS_OF_WEEK.map(day => {
                  const isSelected = settings.workingDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => handleWorkingDaysToggle(day.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${isSelected ? 'border-primary dark:border-blue-500 bg-primary/10 dark:bg-blue-900/30 text-primary dark:text-blue-300' : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:border-primary/50 dark:hover:border-slate-500'}`}
                    >
                      {i18n.language === 'ar' ? day.name : day.nameEn}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-on-surface dark:text-slate-300 mb-2">{t('settings.workStartTime', 'بداية اليوم الدراسي')}</label>
                <input 
                  type="time" 
                  name="workStartTime"
                  value={settings.workStartTime}
                  onChange={handleChange}
                  className="w-full bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold text-gray-800 dark:text-slate-100 text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface dark:text-slate-300 mb-2">{t('settings.workEndTime', 'نهاية اليوم الدراسي')}</label>
                <input 
                  type="time" 
                  name="workEndTime"
                  value={settings.workEndTime}
                  onChange={handleChange}
                  className="w-full bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold text-gray-800 dark:text-slate-100 text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Booking Rules */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-outline-variant/20 dark:border-slate-800">
          <h2 className="text-xl font-bold text-primary dark:text-blue-300 mb-6 flex items-center gap-2 border-b border-outline-variant/10 dark:border-slate-800 pb-4">
            <span className="material-symbols-outlined text-[#b58b4b] dark:text-[#d4af37]">rule</span>
            {t('settings.bookingRules', 'قواعد وضوابط الحجز')}
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-on-surface dark:text-slate-300 mb-2">{t('settings.defaultSlot', 'مدة المحاضرة الافتراضية (بالدقائق)')}</label>
              <select 
                name="slotDuration"
                value={settings.slotDuration}
                onChange={handleChange}
                className="w-full bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary font-medium text-gray-700 dark:text-slate-200"
              >
                <option value={30}>30 {t('settings.minutes', 'دقيقة')}</option>
                <option value={60}>60 {t('settings.minutes', 'دقيقة')}</option>
                <option value={90}>90 {t('settings.minutes', 'دقيقة')}</option>
                <option value={120}>120 {t('settings.minutes', 'دقيقة')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface dark:text-slate-300 mb-2">{t('settings.minAdvanceTime', 'الحد الأدنى للوقت قبل الحجز (بالساعات)')}</label>
              <input 
                type="number" 
                name="minAdvanceBookingHours"
                value={settings.minAdvanceBookingHours}
                onChange={handleChange}
                min="0"
                className="w-full bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold text-gray-800 dark:text-slate-100"
                placeholder="24"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">{t('settings.minAdvanceDesc', 'يمنع المستخدمين من الحجز في نفس اليوم إذا وضعت 24 ساعة.')}</p>
            </div>
          </div>
        </div>

        {/* Special Modes */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-outline-variant/20 dark:border-slate-800">
          <h2 className="text-xl font-bold text-primary dark:text-blue-300 mb-6 flex items-center gap-2 border-b border-outline-variant/10 dark:border-slate-800 pb-4">
            <span className="material-symbols-outlined text-[#b58b4b] dark:text-[#d4af37]">stars</span>
            {t('settings.specialModes', 'أوضاع استثنائية للموقع')}
          </h2>
          <div className="space-y-4">
            
            {/* Ramadan Mode Toggle */}
            <div
              className={`rounded-2xl border-2 transition-all overflow-hidden ${settings.ramadanMode ? 'border-[#b58b4b] dark:border-[#d4af37]' : 'border-gray-200 dark:border-slate-700'}`}
              style={settings.ramadanMode ? {
                background: 'linear-gradient(135deg, #2d1a00 0%, #3d2800 40%, #1a1000 100%)',
                boxShadow: '0 0 32px rgba(212,175,55,0.18), inset 0 0 40px rgba(212,175,55,0.06)',
              } : {}}
            >
              {/* Mini Ramadan Preview */}
              {settings.ramadanMode && (
                <div
                  style={{
                    position: 'relative',
                    height: '90px',
                    overflow: 'hidden',
                    background: 'linear-gradient(180deg, #0d0700 0%, #1a0e00 100%)',
                    borderBottom: '1px solid rgba(212,175,55,0.3)',
                  }}
                >
                  {/* Stars in preview */}
                  {[10, 25, 40, 55, 70, 82, 90].map((x, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      left: `${x}%`,
                      top: `${15 + (i % 3) * 20}px`,
                      width: i % 2 === 0 ? '6px' : '4px',
                      height: i % 2 === 0 ? '6px' : '4px',
                      borderRadius: '50%',
                      background: '#fff9c4',
                      boxShadow: '0 0 6px #ffdc73',
                      animation: `ramadan-twinkle ${1.5 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                  {/* Crescent in corner */}
                  <div style={{ position: 'absolute', right: '12px', top: '8px', opacity: 0.9 }}>
                    <svg width="28" height="34" viewBox="0 0 40 50" fill="none">
                      <path d="M28 5 C10 8 4 22 8 36 C12 50 26 54 36 48 C20 50 10 38 12 25 C14 12 22 6 28 5 Z" fill="#d4af37" style={{ filter: 'drop-shadow(0 0 6px #ffdc73)' }} />
                    </svg>
                  </div>
                  {/* Mini lanterns falling in preview */}
                  {['#d4af37','#c0392b','#1a7a4a','#7b5ea7','#e07b39'].map((color, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      left: `${10 + i * 18}%`,
                      top: '0',
                      animation: `ramadan-fall-${i % 2 === 0 ? 'left' : 'right'} ${3 + i * 0.5}s linear ${-i * 0.7}s infinite`,
                    }}>
                      <svg width="16" height="24" viewBox="0 0 48 72" fill="none">
                        <rect x="18" y="0" width="12" height="5" rx="2" fill={color} />
                        <line x1="24" y1="5" x2="24" y2="12" stroke={color} strokeWidth="2" />
                        <ellipse cx="24" cy="12" rx="9" ry="3" fill={color} />
                        <path d="M14 16 Q24 12 34 16 L36 52 Q24 58 12 52 Z" fill={color} opacity="0.4" />
                        {[0,1,2,3,4].map(j => <ellipse key={j} cx="24" cy={14+j*10} rx={12} ry="2.5" fill={color} opacity="0.8" />)}
                        <ellipse cx="24" cy="54" rx="10" ry="3" fill={color} />
                      </svg>
                    </div>
                  ))}
                  {/* Banner text */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#d4af37',
                    fontFamily: 'serif',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    textShadow: '0 0 10px #d4af37',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.1em',
                  }}>
                    🌙 رمضان كريم — هذا ما يراه جميع المستخدمين
                  </div>

                  <style>{`
                    @keyframes ramadan-fall-left {
                      0%   { transform: translateY(-30px) translateX(0px); }
                      50%  { transform: translateY(50px) translateX(-8px); }
                      100% { transform: translateY(120px) translateX(0px); }
                    }
                    @keyframes ramadan-fall-right {
                      0%   { transform: translateY(-30px) translateX(0px); }
                      50%  { transform: translateY(50px) translateX(8px); }
                      100% { transform: translateY(120px) translateX(0px); }
                    }
                    @keyframes ramadan-twinkle {
                      0%, 100% { opacity: 1; transform: scale(1); }
                      50% { opacity: 0.2; transform: scale(0.5); }
                    }
                  `}</style>
                </div>
              )}

              {/* Toggle Row */}
              <div className={`p-5 flex items-center justify-between ${!settings.ramadanMode ? 'bg-gray-50 dark:bg-slate-800' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${settings.ramadanMode ? 'text-3xl' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                    {settings.ramadanMode ? '🪔' : <span className="material-symbols-outlined">mosque</span>}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${settings.ramadanMode ? 'text-[#d4af37]' : 'text-gray-700 dark:text-slate-300'}`}>
                      {t('settings.ramadanMode')}
                      {settings.ramadanMode && <span className="mr-2 text-xs font-normal bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-full border border-[#d4af37]/30">مفعّل الآن ✓</span>}
                    </h3>
                    <p className={`text-xs mt-1 ${settings.ramadanMode ? 'text-[#d4af37]/70' : 'text-gray-500 dark:text-slate-400'}`}>
                      {settings.ramadanMode
                        ? 'فوانيس ونجوم تتساقط على شاشة جميع المستخدمين في الوقت الفعلي'
                        : t('settings.ramadanDesc')}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="ramadanMode"
                    checked={settings.ramadanMode}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#b58b4b]/30 rounded-full peer peer-checked:after:-translate-x-7 ltr:peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-[2px] after:right-[2px] ltr:after:right-auto ltr:after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#b58b4b] dark:peer-checked:bg-[#d4af37] shadow-inner"></div>
                </label>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <div className={`p-5 rounded-xl border-2 transition-all ${settings.darkMode ? 'border-primary dark:border-blue-500 bg-primary/5 dark:bg-blue-900/10' : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${settings.darkMode ? 'bg-primary/20 text-primary dark:text-blue-300' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                    <span className="material-symbols-outlined">{settings.darkMode ? 'dark_mode' : 'light_mode'}</span>
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${settings.darkMode ? 'text-primary dark:text-blue-300' : 'text-gray-700 dark:text-slate-300'}`}>{t('settings.darkMode')}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{t('settings.darkModeDesc')}</p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="darkMode"
                    checked={settings.darkMode} 
                    onChange={handleChange}
                    className="sr-only peer" 
                  />
                  <div className="w-14 h-7 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:-translate-x-7 ltr:peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-[2px] after:right-[2px] ltr:after:right-auto ltr:after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary dark:peer-checked:bg-blue-600 shadow-inner"></div>
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* Branch Settings */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-outline-variant/20 dark:border-slate-800 lg:col-span-2">
          <h2 className="text-xl font-bold text-primary dark:text-blue-300 mb-6 flex items-center gap-2 border-b border-outline-variant/10 dark:border-slate-800 pb-4">
            <span className="material-symbols-outlined text-[#b58b4b] dark:text-[#d4af37]">location_city</span>
            {t('settings.branchSettings', 'إعدادات الفروع')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <div className="p-4 bg-surface-container-lowest dark:bg-slate-800 rounded-xl border border-outline-variant/20 dark:border-slate-700 flex justify-between items-center group">
                <div>
                   <div className="font-bold text-on-surface dark:text-white">فرع أبوقير</div>
                   <div className="text-xs text-on-surface-variant dark:text-slate-400">الإسكندرية، مصر</div>
                </div>
                <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-primary dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100">
                   <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
             </div>
             <div className="p-4 bg-surface-container-lowest dark:bg-slate-800 rounded-xl border border-outline-variant/20 dark:border-slate-700 flex justify-between items-center group">
                <div>
                   <div className="font-bold text-on-surface dark:text-white">فرع ميامي</div>
                   <div className="text-xs text-on-surface-variant dark:text-slate-400">الإسكندرية، مصر</div>
                </div>
                <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-primary dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100">
                   <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
             </div>
             <button className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all">
                <span className="material-symbols-outlined">add_circle</span>
                {t('settings.addBranch', 'إضافة فرع جديد')}
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}
