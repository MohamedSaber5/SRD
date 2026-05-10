import { useTranslation } from 'react-i18next';

export default function BookingStep3Requirements({ formData, handleChange }) {
  const { t } = useTranslation();
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
       <h3 className="text-xl font-headline font-bold text-[#001e40] dark:text-white mb-6 border-b border-gray-100 dark:border-slate-800 pb-4">{t('booking.steps.requirements')}</h3>
       
       <div className="space-y-4">
          <label className="flex items-start gap-4 p-4 border border-gray-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            <input type="checkbox" name="reqLaptop" checked={formData.reqLaptop} onChange={handleChange} className="mt-1 w-5 h-5 accent-[#1e3a5f] dark:accent-blue-600 rounded focus:ring-[#1e3a5f]" />
            <div>
              <div className="font-bold text-[#1e3a5f] dark:text-blue-400">{t('booking.requirementsLaptop')}</div>
              <div className="text-sm text-[#5a7698] dark:text-slate-400">توفير جهاز آلي متصل بشاشة العرض.</div>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 border border-gray-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            <input type="checkbox" name="reqVideoConf" checked={formData.reqVideoConf} onChange={handleChange} className="mt-1 w-5 h-5 accent-[#1e3a5f] dark:accent-blue-600 rounded focus:ring-[#1e3a5f]" />
            <div>
              <div className="font-bold text-[#1e3a5f] dark:text-blue-400">{t('booking.requirementsVideo')}</div>
              <div className="text-sm text-[#5a7698] dark:text-slate-400">تجهيز كاميرات ومعدات البث للتحضير لاجتماع عن بعد.</div>
            </div>
          </label>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-gray-100 dark:border-slate-800 rounded-xl transition-colors">
            <label className="flex items-start gap-4 cursor-pointer flex-1">
              <input type="checkbox" name="reqMic" checked={formData.reqMic} onChange={handleChange} className="mt-1 w-5 h-5 accent-[#1e3a5f] dark:accent-blue-600 rounded focus:ring-[#1e3a5f]" />
              <div>
                <div className="font-bold text-[#1e3a5f] dark:text-blue-400">{t('booking.requirementsMic')}</div>
                <div className="text-sm text-[#5a7698] dark:text-slate-400">توفير ميكروفونات لاسلكية للأسئلة أو الحوار.</div>
              </div>
            </label>
            {formData.reqMic && (
              <div className="flex items-center gap-2 animate-in fade-in">
                <span className="text-sm font-bold text-[#5a7698] dark:text-slate-400">{t('booking.qty')}:</span>
                <input name="reqMicQty" min="1" max="10" value={formData.reqMicQty} onChange={handleChange} type="number" className="w-20 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 py-2 text-center font-bold text-[#001e40] dark:text-slate-200" />
              </div>
            )}
          </div>

          {/* New Option: Other Requirements */}
          <div className="flex flex-col gap-4 p-4 border border-gray-100 dark:border-slate-800 rounded-xl transition-colors">
            <label className="flex items-start gap-4 cursor-pointer">
              <input type="checkbox" name="reqOther" checked={formData.reqOther} onChange={handleChange} className="mt-1 w-5 h-5 accent-[#1e3a5f] dark:accent-blue-600 rounded focus:ring-[#1e3a5f]" />
              <div>
                <div className="font-bold text-[#1e3a5f] dark:text-blue-400">{t('booking.requirementsOther')}</div>
                <div className="text-sm text-[#5a7698] dark:text-slate-400">أي متطلبات لوجستية أو تقنية غير مذكورة أعلاه.</div>
              </div>
            </label>
            {formData.reqOther && (
              <div className="animate-in fade-in w-full pl-9">
                 <textarea 
                   name="reqOtherDetails"
                   value={formData.reqOtherDetails}
                   onChange={handleChange}
                   required={formData.reqOther}
                   className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-[#001e40] dark:text-slate-200 focus:ring-2 focus:ring-[#1e3a5f] resize-none outline-none font-bold" 
                   placeholder="يرجى كتابة المتطلبات الأخرى بالتفصيل هنا..." 
                   rows={3}
                 ></textarea>
              </div>
            )}
          </div>
       </div>
    </div>
  );
}
