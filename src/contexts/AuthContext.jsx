import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper macro for turning employee IDs into emails
  const formatEmail = (uid) => `${uid.trim()}@aast.edu`;

  const register = async (name, employeeId, role, password) => {
    setLoading(true);
    try {
      const email = formatEmail(employeeId);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, "users", user.uid), {
        displayName: name,
        employeeId: employeeId,
        role: role,
        createdAt: new Date()
      });
      return user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const login = async (employeeId, password) => {
    setLoading(true);
    const email = formatEmail(employeeId);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            setUserData(data);
            setCurrentUser(user);
          } else {
             setUserRole('employee'); 
             setUserData({ displayName: user.email.split('@')[0] });
             setCurrentUser(user);
          }
        } catch (error) {
           console.error("Error fetching role:", error);
           setUserRole('employee');
           setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userData,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
