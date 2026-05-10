import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePopup } from '../contexts/PopupContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function UserSettings() {
  const { t, i18n } = useTranslation();
  const { showAlert } = usePopup();
  const { userData } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    theme: theme || 'light',
    language: i18n.language || 'ar',
    notifications: {
      email: true,
      push: false,
      whatsapp: false
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage if any
    const savedPrefs = localStorage.getItem('userPrefs');
    if (savedPrefs) {
      setSettings(JSON.parse(savedPrefs));
    }
  }, []);

  // Sync with global theme
  useEffect(() => {
    setSettings(prev => ({ ...prev, theme }));
  }, [theme]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('notif_')) {
      const notifKey = name.replace('notif_', '');
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [notifKey]: checked
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate save delay
    setTimeout(() => {
      // Save locally
      localStorage.setItem('userPrefs', JSON.stringify(settings));
      
      // Apply Theme
      toggleTheme(settings.theme);
      
      // Apply Language
      i18n.changeLanguage(settings.language);
      localStorage.setItem('userLanguage', settings.language);
      
      
      showAlert(t('common.saveSuccess'), "success");
      setIsSaving(false);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="text-right rtl:text-right ltr:text-left">
          <h1 className="text-3xl font-headline font-black text-[#1e3a5f] dark:text-blue-300 mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl">manage_accounts</span>
            {t('settings.personal')}
          </h1>
          <p className="text-[#5a7698] dark:text-slate-400 font-body">
            {t('settings.personalDesc')}
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-gradient-to-l from-[#1e3a5f] to-[#001e40] dark:from-blue-600 dark:to-blue-800 text-white rounded-xl font-bold shadow-lg hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <span className="material-symbols-outlined">save</span>
          )}
          {t('settings.save')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
        
        {/* Profile Info Section */}
        <div className="p-6 border-b border-outline-variant/10 bg-[#f8fafc] dark:bg-slate-800/50 flex items-center gap-4 text-right rtl:text-right ltr:text-left">
          <div className="w-16 h-16 rounded-full bg-[#1e3a5f]/10 dark:bg-blue-900/30 flex items-center justify-center text-[#1e3a5f] dark:text-blue-300 text-2xl font-bold border border-[#1e3a5f]/20">
            {userData?.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#001e40] dark:text-white">{userData?.displayName}</h2>
            <p className="text-sm text-[#5a7698] dark:text-slate-400 font-medium">
              {userData?.role === 'admin' ? t('sidebar.roles.admin') : userData?.role === 'employee' ? t('sidebar.roles.employee') : userData?.role}
            </p>
          </div>
        </div>

        <div className="p-0">
          
          {/* Appearance */}
          <div className="p-6 border-b border-outline-variant/10 text-right rtl:text-right ltr:text-left">
            <h3 className="text-sm font-bold text-[#1e3a5f] dark:text-blue-400 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">palette</span>
              {t('settings.appearance')}
            </h3>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className={`flex-1 flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.theme === 'light' ? 'border-[#1e3a5f] bg-[#1e3a5f]/5' : 'border-gray-100 dark:border-slate-800 dark:bg-slate-900'}`} onClick={() => handleChange({ target: { name: 'theme', value: 'light', type: 'radio' } })}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-500">light_mode</span>
                  <span className="font-bold text-gray-800 dark:text-slate-200">{t('settings.light')}</span>
                </div>
                <input type="radio" name="theme" value="light" checked={settings.theme === 'light'} readOnly className="w-5 h-5 accent-[#1e3a5f]" />
              </div>
              
              <div className={`flex-1 flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.theme === 'dark' ? 'border-blue-600 bg-blue-600/5' : 'border-gray-100 dark:border-slate-800 dark:bg-slate-900'}`} onClick={() => handleChange({ target: { name: 'theme', value: 'dark', type: 'radio' } })}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-400">dark_mode</span>
                  <span className="font-bold text-gray-800 dark:text-slate-200">{t('settings.dark')}</span>
                </div>
                <input type="radio" name="theme" value="dark" checked={settings.theme === 'dark'} readOnly className="w-5 h-5 accent-blue-600" />
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="p-6 border-b border-outline-variant/10 text-right rtl:text-right ltr:text-left">
            <h3 className="text-sm font-bold text-[#1e3a5f] dark:text-blue-400 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">translate</span>
              {t('settings.language')}
            </h3>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-[#5a7698] dark:text-slate-400 mb-2">{t('settings.langSelect')}</label>
              <select 
                name="language"
                value={settings.language}
                onChange={handleChange}
                className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] font-bold text-gray-700 dark:text-slate-200 transition-all"
              >
                <option value="ar">العربية (Arabic)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Notifications */}
          <div className="p-6 text-right rtl:text-right ltr:text-left">
            <h3 className="text-sm font-bold text-[#1e3a5f] dark:text-blue-400 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">notifications_active</span>
              {t('settings.notifications')}
            </h3>
            <div className="space-y-3 max-w-md">
              
              <label className="flex items-center justify-between p-4 bg-[#f8fafc] dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#1e3a5f] dark:text-blue-400">mail</span>
                  <span className="font-medium text-gray-700 dark:text-slate-200">{t('settings.email')}</span>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none">
                  <input type="checkbox" name="notif_email" checked={settings.notifications.email} onChange={handleChange} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:border-[#1e3a5f] transition-all duration-200" style={{ right: settings.notifications.email ? '0' : '1.5rem', borderColor: settings.notifications.email ? '#1e3a5f' : '#d1d5db' }} />
                  <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${settings.notifications.email ? 'bg-[#1e3a5f]' : 'bg-gray-300 dark:bg-slate-700'}`}></label>
                </div>
              </label>

              <label className="flex items-center justify-between p-4 bg-[#f8fafc] dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#1e3a5f] dark:text-blue-400">notifications</span>
                  <span className="font-medium text-gray-700 dark:text-slate-200">{t('settings.push')}</span>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none">
                  <input type="checkbox" name="notif_push" checked={settings.notifications.push} onChange={handleChange} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:border-[#1e3a5f] transition-all duration-200" style={{ right: settings.notifications.push ? '0' : '1.5rem', borderColor: settings.notifications.push ? '#1e3a5f' : '#d1d5db' }} />
                  <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${settings.notifications.push ? 'bg-[#1e3a5f]' : 'bg-gray-300 dark:bg-slate-700'}`}></label>
                </div>
              </label>

              <label className="flex items-center justify-between p-4 bg-[#f8fafc] dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 cursor-not-allowed opacity-50">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-600">forum</span>
                  <span className="font-medium text-gray-700 dark:text-slate-200">{t('settings.whatsapp')}</span>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none">
                  <input type="checkbox" disabled className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none border-gray-300 right-6" />
                  <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-slate-700"></label>
                </div>
              </label>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
