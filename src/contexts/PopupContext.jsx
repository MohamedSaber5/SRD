import React, { createContext, useContext, useState, useCallback } from 'react';

const PopupContext = createContext(null);

export const usePopup = () => useContext(PopupContext);

export const PopupProvider = ({ children }) => {
  const [popupState, setPopupState] = useState({
    isOpen: false,
    type: 'alert', // 'alert' | 'confirm' | 'prompt'
    message: '',
    alertType: 'info', // 'success' | 'error' | 'info' | 'warning'
    onConfirm: null,
  });

  const [promptInputValue, setPromptInputValue] = useState('');

  const showAlert = useCallback((message, alertType = 'info') => {
    setPopupState({
      isOpen: true,
      type: 'alert',
      message,
      alertType,
      onConfirm: null,
    });
  }, []);

  const showConfirm = useCallback((message, onConfirm) => {
    setPopupState({
      isOpen: true,
      type: 'confirm',
      message,
      alertType: 'warning',
      onConfirm,
    });
  }, []);

  const showPrompt = useCallback((message, onConfirm) => {
    setPromptInputValue('');
    setPopupState({
      isOpen: true,
      type: 'prompt',
      message,
      alertType: 'info',
      onConfirm,
    });
  }, []);

  const closePopup = () => {
    setPopupState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (popupState.onConfirm) {
      if (popupState.type === 'prompt') {
        popupState.onConfirm(promptInputValue);
      } else {
        popupState.onConfirm();
      }
    }
    closePopup();
  };

  const getIcon = () => {
    switch (popupState.alertType) {
      case 'success':
        return <span className="material-symbols-outlined text-[48px] text-green-500 mb-4 animate-bounce">check_circle</span>;
      case 'error':
        return <span className="material-symbols-outlined text-[48px] text-red-500 mb-4 animate-bounce">error</span>;
      case 'warning':
        return <span className="material-symbols-outlined text-[48px] text-orange-500 mb-4 animate-pulse">warning</span>;
      default:
        return <span className="material-symbols-outlined text-[48px] text-blue-500 mb-4 animate-pulse">info</span>;
    }
  };

  return (
    <PopupContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      
      {popupState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm rtl animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white/80 backdrop-blur-md border border-white/40 shadow-2xl rounded-[2rem] p-8 max-w-sm w-full mx-4 text-center transform transition-all animate-in zoom-in-95 duration-200">
            {getIcon()}
            
            <h3 className="text-xl font-black text-[#001e40] mb-2 font-headline">
              {popupState.type === 'confirm' ? 'تأكيد الإجراء' : popupState.type === 'prompt' ? 'مطلوب إدخال' : 'رسالة نظام'}
            </h3>
            
            <p className="text-gray-600 font-bold mb-6 leading-relaxed text-sm">
              {popupState.message}
            </p>

            {popupState.type === 'prompt' && (
              <input
                type="text"
                value={promptInputValue}
                onChange={(e) => setPromptInputValue(e.target.value)}
                autoFocus
                className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-3 text-[#001e40] font-bold mb-6 focus:ring-2 focus:ring-[#1e3a5f] outline-none text-center"
              />
            )}
            
            <div className="flex items-center justify-center gap-3">
              {popupState.type === 'confirm' || popupState.type === 'prompt' ? (
                <>
                  <button
                    onClick={handleConfirm}
                    disabled={popupState.type === 'prompt' && !promptInputValue.trim()}
                    className="flex-1 bg-[#001e40] text-white px-4 py-3 rounded-xl font-bold shadow-md hover:bg-[#1e3a5f] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    تأكيد
                  </button>
                  <button
                    onClick={closePopup}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                </>
              ) : (
                <button
                  onClick={closePopup}
                  className="w-full bg-[#001e40] text-white px-4 py-3 rounded-xl font-bold shadow-md hover:bg-[#1e3a5f] hover:-translate-y-0.5 transition-all"
                >
                  حسناً
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
};
