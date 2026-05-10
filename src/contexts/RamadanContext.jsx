import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const RamadanContext = createContext();

export function RamadanProvider({ children }) {
  const [ramadanMode, setRamadanMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'general'),
      (docSnap) => {
        if (docSnap.exists()) {
          setRamadanMode(!!docSnap.data().ramadanMode);
        }
      },
      (error) => {
        console.error('Error listening to ramadan settings:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  return (
    <RamadanContext.Provider value={{ ramadanMode }}>
      {children}
    </RamadanContext.Provider>
  );
}

export function useRamadan() {
  return useContext(RamadanContext);
}
