import { useBookingForm } from '../hooks/useBookingForm';
import { usePopup } from '../contexts/PopupContext';
import BookingStep1BasicInfo from '../components/bookings/BookingStep1BasicInfo';
import BookingStep2Responsible from '../components/bookings/BookingStep2Responsible';
import BookingStep3Requirements from '../components/bookings/BookingStep3Requirements';

export default function BookingForm() {
  const { showAlert } = usePopup();
  const {
    step,
    formData,
    setFormData,
    rooms,
    loadingRooms,
    minDate,
    isLeadTimeError,
    currentSlots,
    isEmployeeLecture,
    isMultiPurpose,
    userRole,
    handleChange,
    handleNext,
    handlePrev,
    handleSubmit,
    canProceed
  } = useBookingForm({ showAlert });

  return (
    <>
      <div className="mb-10 flex flex-col justify-between items-start gap-2">
        <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2">طلب حجز قاعة جديدة</h2>
        <p className="text-on-surface-variant text-lg">يرجى إكمال تفاصيل الحجز، سيتم مراجعة الطلب بناءً على التوافر.</p>
        {(userRole === 'secretary' || userRole === 'employee' || userRole === 'admin') && (
          <p className="text-sm font-bold text-error bg-error-container/20 px-3 py-1 rounded-md mt-2">
            ملاحظة نظامية: {userRole === 'admin' ? 'يمكن حجز القاعات متعددة الأغراض فقط، وسيتم تحويل الطلب لمدير الفرع مباشرة.' : userRole === 'secretary' ? 'لا يمكن حجز موعد أقل من 48 ساعة ويُسمح فقط بالقاعات متعددة الأغراض.' : 'لا يمكن حجز موعد أقل من 24 ساعة من الآن.'}
          </p>
        )}
      </div>

      {/* Stepper UI */}
      {!isEmployeeLecture && (
        <div className="mb-12 relative max-w-2xl mx-auto">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-surface-container-high -z-10 -translate-y-1/2 rounded-full"></div>
          <div
            className="absolute top-1/2 right-0 h-1 bg-secondary -z-10 -translate-y-1/2 rounded-full transition-all duration-300"
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          ></div>

          <div className="flex justify-between relative z-10 w-full px-2">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors ${step >= 1 ? 'bg-secondary text-white' : 'bg-surface-container border-2 border-surface-container-high text-on-surface-variant'}`}>1</div>
              <span className={`font-headline text-sm font-bold ${step >= 1 ? 'text-primary' : 'text-on-surface-variant'}`}>التفاصيل</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors ${step >= 2 ? 'bg-secondary text-white' : 'bg-surface-container border-2 border-surface-container-high text-on-surface-variant'}`}>2</div>
              <span className={`font-headline text-sm font-bold ${step >= 2 ? 'text-primary' : 'text-on-surface-variant'}`}>المسؤول</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors ${step >= 3 ? 'bg-secondary text-white' : 'bg-surface-container border-2 border-surface-container-high text-on-surface-variant'}`}>3</div>
              <span className={`font-headline text-sm font-bold ${step >= 3 ? 'text-primary' : 'text-on-surface-variant'}`}>التجهيزات</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm relative overflow-hidden max-w-3xl mx-auto">
        <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary to-primary-container"></div>

        <form onSubmit={(step === 3 || isEmployeeLecture) ? handleSubmit : (e) => e.preventDefault()}>

          {step === 1 && (
            <BookingStep1BasicInfo
              formData={formData}
              setFormData={setFormData}
              handleChange={handleChange}
              userRole={userRole}
              rooms={rooms}
              loadingRooms={loadingRooms}
              minDate={minDate}
              isLeadTimeError={isLeadTimeError}
              currentSlots={currentSlots}
              isMultiPurpose={isMultiPurpose}
            />
          )}

          {step === 2 && (
            <BookingStep2Responsible formData={formData} handleChange={handleChange} />
          )}

          {step === 3 && (
            <BookingStep3Requirements formData={formData} handleChange={handleChange} />
          )}

          <div className="mt-10 pt-6 border-t border-surface-container-high flex justify-between items-center">
            {step > 1 ? (
              <button onClick={handlePrev} className="px-6 py-2.5 rounded-xl border border-surface-variant text-on-surface font-bold hover:bg-surface-container-low transition-colors" type="button">
                السابق
              </button>
            ) : <div></div>}

            {(step < 3 && !isEmployeeLecture) ? (
              <button
                onClick={handleNext}
                className="px-8 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-md flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                type="button"
                disabled={!canProceed()}
              >
                <span>التالي</span>
                <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-8 py-2.5 bg-gradient-to-br from-secondary to-[#876a20] text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-md flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                type="button"
                disabled={!canProceed()}
              >
                <span>تأكيد وإرسال الطلب</span>
                <span className="material-symbols-outlined text-sm rtl:rotate-180">check_circle</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}