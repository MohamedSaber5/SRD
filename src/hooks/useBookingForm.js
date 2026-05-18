import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { formatTime } from '../utils/timeUtils';

export const REGULAR_SLOTS = [
  { from: '08:30', to: '10:10', label: `المحاضرة الأولى (${formatTime('08:30')} - ${formatTime('10:10')})` },
  { from: '10:30', to: '12:10', label: `المحاضرة الثانية (${formatTime('10:30')} - ${formatTime('12:10')})` },
  { from: '12:30', to: '14:10', label: `المحاضرة الثالثة (${formatTime('12:30')} - ${formatTime('14:10')})` },
  { from: '14:30', to: '16:10', label: `المحاضرة الرابعة (${formatTime('14:30')} - ${formatTime('16:10')})` },
  { from: '16:30', to: '18:10', label: `المحاضرة الخامسة (${formatTime('16:30')} - ${formatTime('18:10')})` },
  { from: '18:30', to: '20:10', label: `المحاضرة السادسة (${formatTime('18:30')} - ${formatTime('20:10')})` },
  { from: '20:30', to: '22:10', label: `المحاضرة السابعة (${formatTime('20:30')} - ${formatTime('22:10')})` },
  { from: '22:30', to: '00:10', label: `المحاضرة الثامنة (${formatTime('22:30')} - ${formatTime('00:10')})` },
];

export const RAMADAN_SLOTS = [
  { from: '09:30', to: '10:25', label: `الفترة الأولى (${formatTime('09:30')} - ${formatTime('10:25')})` },
  { from: '10:30', to: '11:25', label: `الفترة الثانية (${formatTime('10:30')} - ${formatTime('11:25')})` },
  { from: '11:30', to: '12:25', label: `الفترة الثالثة (${formatTime('11:30')} - ${formatTime('12:25')})` },
  { from: '12:30', to: '13:25', label: `الفترة الرابعة (${formatTime('12:30')} - ${formatTime('13:25')})` },
  { from: '13:30', to: '14:25', label: `الفترة الخامسة (${formatTime('13:30')} - ${formatTime('14:25')})` },
  { from: '14:30', to: '15:30', label: `الفترة السادسة (${formatTime('14:30')} - ${formatTime('15:30')})` },
];

export const getHourOptions = (isRamadanMode = false) => {
  const options = [];
  const startHour = isRamadanMode ? 9 : 8;
  const endHour = isRamadanMode ? 16 : 23;
  for (let i = startHour; i <= endHour; i++) {
    const value = `${i.toString().padStart(2, '0')}:00`;
    options.push({ value, label: formatTime(value) });
  }
  return options;
};


export function useBookingForm({ showAlert } = {}) {
  const _showAlert = showAlert || ((msg) => alert(msg));
  const { userRole, currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.prefill || {};

  const [step, setStep] = useState(1);
  const [minDate, setMinDate] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const [formData, setFormData] = useState({
    roomId: prefill.roomId || '',
    roomType: prefill.roomType || '', 
    hallCategory: prefill.hallCategory || '', 
    date: prefill.date || '',
    selectedSlot: prefill.timeFrom ? { from: prefill.timeFrom, to: prefill.timeTo, label: `${prefill.timeFrom} - ${prefill.timeTo}` } : null,
    timeFrom: prefill.timeFrom || '',
    timeTo: prefill.timeTo || '',
    purpose: prefill.purpose || '',
    requiredCapacity: '', // NEW
    respName: prefill.responsibleName || currentUser?.displayName || '',
    respJob: '', 
    respMobile: prefill.responsibleMobile || '',
    reqMic: false,
    reqMicQty: 1,
    reqLaptop: false,
    reqVideoConf: false,
    reqOther: false, // NEW
    reqOtherDetails: '', // NEW
    isHolidayEvent: prefill.isHolidayEvent || false,
    isOfficialOccasion: prefill.isOfficialOccasion || false
  });

  const [isRamadanMode, setIsRamadanMode] = useState(false);
  const [isLeadTimeError, setIsLeadTimeError] = useState(false);

  // Fetch rooms and setup mode/date constraints
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const q = query(collection(db, 'rooms'));
        const querySnapshot = await getDocs(q);
        const roomsData = querySnapshot.docs.map(doc => ({ ...doc.data() }));
        setRooms(roomsData);

        setFormData(prev => {
          if (prev.roomId && prev.roomId !== 'لم يتم التحديد') {
            const selectedRoom = roomsData.find(r => r.id === prev.roomId);
            if (selectedRoom) {
              return { 
                ...prev, 
                roomType: selectedRoom.type || 'fixed', 
                hallCategory: selectedRoom.type === 'multi' ? 'multi' : 'lecture' 
              };
            }
          }
          return prev;
        });
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();

    const today = new Date();
    let hoursToAdd = 0;
    
    if (userRole === 'secretary') hoursToAdd = 48;
    else if (userRole === 'employee') hoursToAdd = 24;

    const minAllowed = new Date(today.getTime() + hoursToAdd * 60 * 60 * 1000);
    setMinDate(minAllowed.toISOString().split('T')[0]);

    const settingsUnsubscribe = onSnapshot(doc(db, 'settings', 'system'), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setIsRamadanMode(docSnapshot.data().isRamadanMode);
      }
    });

    return () => settingsUnsubscribe();
  }, [userRole]);

  // Validation logic logic centralized
  const checkLeadTimeError = useCallback((dateStr, timeFromStr) => {
     if (!dateStr || !timeFromStr) return false;
     
     const selectedDate = new Date(dateStr);
     const now = new Date();
     
     // Incorporate the exact time selected to be precise
     const [hours, minutes] = timeFromStr.split(':');
     selectedDate.setHours(parseInt(hours, 10), parseInt(minutes || '0', 10));
     
     const diffHours = (selectedDate - now) / (1000 * 60 * 60);
     
     if (userRole === 'employee') {
        return diffHours < 24;
     } else if (userRole === 'secretary') {
        return diffHours < 48;
     }
     return false;
  }, [userRole]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => {
      const nextData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      if (name === 'date' || name === 'timeFrom') {
         // Auto-check lead time error
         setIsLeadTimeError(checkLeadTimeError(nextData.date, nextData.timeFrom));
      }
      return nextData;
    });
  };

  const currentSlots = isRamadanMode ? RAMADAN_SLOTS : REGULAR_SLOTS;
  const isEmployeeLecture = userRole === 'employee' && formData.hallCategory === 'lecture';
  const isMultiPurpose = formData.hallCategory === 'multi' || formData.roomType === 'multi';

  // Specific validation per step
  const validateStep1 = () => {
    if (!formData.roomId || !formData.date || !formData.purpose) return false;
    if (!formData.timeFrom || !formData.timeTo) return false;
    if (!formData.requiredCapacity || isNaN(formData.requiredCapacity) || Number(formData.requiredCapacity) <= 0) return false;
    if (isLeadTimeError) return false;
    
    // For Multi-purpose, check that start < end
    if (isMultiPurpose) {
       const startH = parseInt(formData.timeFrom.split(':')[0], 10);
       const endH = parseInt(formData.timeTo.split(':')[0], 10);
       if (endH <= startH) return false;
       if (isRamadanMode && formData.timeTo > '16:00') return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.respName || !formData.respJob || !formData.respMobile) return false;
    
    // Strict numeric validation for mobile
    const isMobileValid = /^[0-9]+$/.test(formData.respMobile);
    
    // Name must NOT contain numbers
    const isNameValid = !/[0-9]/.test(formData.respName);
    
    // Job/Title MUST contain at least one alphabetical letter (English or Arabic)
    const isJobValid = /[a-zA-Z\u0600-\u06FF]/.test(formData.respJob);
    
    return isMobileValid && isNameValid && isJobValid;
  };

  const validateStep3 = () => {
    // If other is checked, details must be filled
    if (formData.reqOther && !formData.reqOtherDetails.trim()) return false;
    return true;
  };

  const canProceed = () => {
    if (step === 1) return validateStep1();
    if (step === 2) return validateStep2();
    if (step === 3) return validateStep3();
    return true;
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((isEmployeeLecture && !validateStep1()) || (!isEmployeeLecture && (!validateStep1() || !validateStep2() || !validateStep3()))) {
      _showAlert('يرجى التأكد من تعبئة جميع الحقول بشكل صحيح', 'warning');
      return;
    }

    try {
      await addDoc(collection(db, 'bookings'), {
        roomId: formData.roomId,
        roomType: formData.roomType,
        date: formData.date,
        timeFrom: formData.timeFrom,
        timeTo: formData.timeTo,
        purpose: formData.purpose,
        requiredCapacity: Number(formData.requiredCapacity),
        isHolidayEvent: formData.isHolidayEvent,
        isOfficialOccasion: formData.isOfficialOccasion,
        responsibleName: formData.respName,
        responsibleJob: formData.respJob,
        responsibleMobile: formData.respMobile,
        reqMic: formData.reqMic,
        reqMicQty: formData.reqMicQty,
        reqLaptop: formData.reqLaptop,
        reqVideoConf: formData.reqVideoConf,
        reqOther: formData.reqOther,
        reqOtherDetails: formData.reqOtherDetails,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'مستخدم',
        userRole: userRole,
        college: userData?.collegeName || '',
        status: userRole === 'admin' ? 'awaiting_manager_final' : 'pending',
        createdAt: serverTimestamp()
      });

      if (userRole === 'secretary' || userRole === 'temp_admin') {
         await addDoc(collection(db, 'audit_logs'), {
           actionBy: currentUser.email,
           actionByName: currentUser.displayName || 'مستخدم',
           actionType: 'REQUEST_BOOKING',
           details: `قام بإنشاء طلب حجز للقاعة (${formData.roomId}) بتاريخ ${formData.date}`,
           timestamp: serverTimestamp()
         });
      }

      _showAlert('تم إرسال الطلب بنجاح وهو الآن بانتظار الموافقة', 'success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error adding document: ', error);
      _showAlert('حدث خطأ أثناء إرسال الطلب', 'error');
    }
  };

  return {
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
    isRamadanMode,
    handleChange,
    handleNext,
    handlePrev,
    handleSubmit,
    canProceed
  };
}
