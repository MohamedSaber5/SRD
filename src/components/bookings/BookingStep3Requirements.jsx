export default function BookingStep3Requirements({ formData, handleChange }) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
       <h3 className="text-xl font-headline font-bold text-primary mb-6 border-b border-surface-container-high pb-4">المتطلبات التقنية واللوجستية</h3>
       
       <div className="space-y-4">
          <label className="flex items-start gap-4 p-4 border border-surface-variant rounded-xl cursor-pointer hover:bg-surface-container-lowest transition-colors">
            <input type="checkbox" name="reqLaptop" checked={formData.reqLaptop} onChange={handleChange} className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary" />
            <div>
              <div className="font-bold text-primary">جهاز حاسب آلي (Laptop)</div>
              <div className="text-sm text-on-surface-variant">توفير جهاز آلي متصل بشاشة العرض.</div>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 border border-surface-variant rounded-xl cursor-pointer hover:bg-surface-container-lowest transition-colors">
            <input type="checkbox" name="reqVideoConf" checked={formData.reqVideoConf} onChange={handleChange} className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary" />
            <div>
              <div className="font-bold text-primary">نظام الـ Video Conference</div>
              <div className="text-sm text-on-surface-variant">تجهيز كاميرات ومعدات البث للتحضير لاجتماع عن بعد.</div>
            </div>
          </label>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-surface-variant rounded-xl transition-colors">
            <label className="flex items-start gap-4 cursor-pointer flex-1">
              <input type="checkbox" name="reqMic" checked={formData.reqMic} onChange={handleChange} className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary" />
              <div>
                <div className="font-bold text-primary">ميكروفونات متحركة</div>
                <div className="text-sm text-on-surface-variant">توفير ميكروفونات لاسلكية للأسئلة أو الحوار.</div>
              </div>
            </label>
            {formData.reqMic && (
              <div className="flex items-center gap-2 animate-in fade-in">
                <span className="text-sm font-bold text-on-surface-variant">العدد:</span>
                <input name="reqMicQty" min="1" max="10" value={formData.reqMicQty} onChange={handleChange} type="number" className="w-20 rounded-lg border-surface-variant py-2 text-center" />
              </div>
            )}
          </div>

          {/* New Option: Other Requirements */}
          <div className="flex flex-col gap-4 p-4 border border-surface-variant rounded-xl transition-colors">
            <label className="flex items-start gap-4 cursor-pointer">
              <input type="checkbox" name="reqOther" checked={formData.reqOther} onChange={handleChange} className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary" />
              <div>
                <div className="font-bold text-primary">متطلبات أخرى</div>
                <div className="text-sm text-on-surface-variant">أي متطلبات لوجستية أو تقنية غير مذكورة أعلاه.</div>
              </div>
            </label>
            {formData.reqOther && (
              <div className="animate-in fade-in w-full pl-9">
                 <textarea 
                   name="reqOtherDetails"
                   value={formData.reqOtherDetails}
                   onChange={handleChange}
                   required={formData.reqOther}
                   className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary resize-none" 
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
