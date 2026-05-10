import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState(() => {
    // Synchronous initial guess
    const savedGuest = localStorage.getItem('guestTheme');
    if (savedGuest) return savedGuest;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Load user-specific theme once currentUser is available
  useEffect(() => {
    const loadUserTheme = async () => {
      if (!currentUser) {
        // Reset to guest theme or system preference on logout
        const savedGuest = localStorage.getItem('guestTheme');
        if (savedGuest) setTheme(savedGuest);
        return;
      }

      // 1. Try User-specific LocalStorage (Fast)
      const localTheme = localStorage.getItem(`userTheme_${currentUser.uid}`);
      if (localTheme) setTheme(localTheme);

      // 2. Try Firestore (Truth)
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().theme) {
          const cloudTheme = userDoc.data().theme;
          if (cloudTheme !== localTheme) {
            setTheme(cloudTheme);
            localStorage.setItem(`userTheme_${currentUser.uid}`, cloudTheme);
          }
        }
      } catch (e) {
        console.error("Error loading theme from Firestore:", e);
      }
    };

    loadUserTheme();
  }, [currentUser]);

  // Apply theme to DOM and persist
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (currentUser) {
      localStorage.setItem(`userTheme_${currentUser.uid}`, theme);
      // Sync to Firestore (de-bounced or optional)
      const syncTheme = async () => {
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), { theme });
        } catch (e) {
          console.error("Error syncing theme to Firestore:", e);
        }
      };
      syncTheme();
    } else {
      localStorage.setItem('guestTheme', theme);
    }
  }, [theme, currentUser]);

  const toggleTheme = (newTheme) => {
    if (newTheme) {
      setTheme(newTheme);
    } else {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
