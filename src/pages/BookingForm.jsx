import { useTranslation } from 'react-i18next';
import { useBookingForm } from '../hooks/useBookingForm';
import { usePopup } from '../contexts/PopupContext';
import BookingStep1BasicInfo from '../components/bookings/BookingStep1BasicInfo';
import BookingStep2Responsible from '../components/bookings/BookingStep2Responsible';
import BookingStep3Requirements from '../components/bookings/BookingStep3Requirements';

export default function BookingForm() {
  const { t } = useTranslation();
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
        <h2 className="text-3xl md:text-4xl font-headline font-bold text-[#001e40] dark:text-white mb-2">{t('booking.title')}</h2>
        <p className="text-[#5a7698] dark:text-slate-400 text-lg">{t('booking.subtitle')}</p>
        {(userRole === 'secretary' || userRole === 'employee' || userRole === 'admin') && (
          <p className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-md mt-2 border border-red-100 dark:border-red-800/30">
            {t('booking.note')} {userRole === 'admin' ? t('booking.noteAdmin') : userRole === 'secretary' ? t('booking.noteSecretary') : t('booking.noteEmployee')}
          </p>
        )}
      </div>

      {/* Stepper UI */}
      {!isEmployeeLecture && (
        <div className="mb-12 relative max-w-2xl mx-auto">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 dark:bg-slate-800 -z-10 -translate-y-1/2 rounded-full"></div>
          <div
            className="absolute top-1/2 right-0 h-1 bg-[#1e3a5f] dark:bg-blue-600 -z-10 -translate-y-1/2 rounded-full transition-all duration-300"
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          ></div>

          <div className="flex justify-between relative z-10 w-full px-2">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors ${step >= 1 ? 'bg-[#1e3a5f] dark:bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-500'}`}>1</div>
              <span className={`font-headline text-sm font-bold ${step >= 1 ? 'text-[#001e40] dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>{t('booking.steps.details')}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors ${step >= 2 ? 'bg-[#1e3a5f] dark:bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-500'}`}>2</div>
              <span className={`font-headline text-sm font-bold ${step >= 2 ? 'text-[#001e40] dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>{t('booking.steps.responsible')}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors ${step >= 3 ? 'bg-[#1e3a5f] dark:bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-500'}`}>3</div>
              <span className={`font-headline text-sm font-bold ${step >= 3 ? 'text-[#001e40] dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>{t('booking.steps.requirements')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-gray-100 dark:border-slate-800 relative overflow-hidden max-w-3xl mx-auto">
        <div className="absolute top-0 right-0 w-2 h-full bg-[#1e3a5f] dark:bg-blue-600"></div>

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

          <div className="mt-10 pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center">
            {step > 1 ? (
              <button onClick={handlePrev} className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-[#001e40] dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" type="button">
                {t('booking.prev')}
              </button>
            ) : <div></div>}

            {(step < 3 && !isEmployeeLecture) ? (
              <button
                onClick={handleNext}
                className="px-8 py-2.5 bg-[#1e3a5f] dark:bg-blue-600 text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-md flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                type="button"
                disabled={!canProceed()}
              >
                <span>{t('booking.next')}</span>
                <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-8 py-2.5 bg-[#b58b4b] dark:bg-amber-600 text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-md flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                type="button"
                disabled={!canProceed()}
              >
                <span>{t('booking.confirm')}</span>
                <span className="material-symbols-outlined text-sm rtl:rotate-180">check_circle</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}