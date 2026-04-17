import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

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
    console.log("Starting registration for:", employeeId);
    try {
      const email = formatEmail(employeeId);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Auth user created:", user.uid);
      
      const userDataObj = {
        displayName: name,
        employeeId: employeeId,
        role: role,
        createdAt: new Date()
      };

      await setDoc(doc(db, "users", user.uid), userDataObj);
      console.log("Firestore document created for user");
      
      // Update local state immediately to speed up navigation
      setUserRole(role);
      setUserData(userDataObj);
      setCurrentUser(user);

      return user;
    } catch (error) {
      console.error("Registration error:", error);
      setLoading(false);
      throw error;
    }
  };

  const login = async (employeeId, password) => {
    const email = formatEmail(employeeId);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? user.uid : "no user");
      
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (user) {
        setCurrentUser(user);
        setLoading(false); 

        // Role Auto-Promotion Mapping
        const rolesMap = {
          'admin@aast.edu': { role: 'admin', name: 'المسؤول العام' },
          'manager@aast.edu': { role: 'branch_manager', name: 'مدير الفرع' },
          'employee@aast.edu': { role: 'employee', name: 'موظف تجريبي' },
          'secretary@aast.edu': { role: 'secretary', name: 'سكرتير الكلية' }
        };

        let forcedRole = null;
        if (rolesMap[user.email]) {
          const { role, name } = rolesMap[user.email];
          forcedRole = role;
          console.log(`Auto-promoting ${user.email} to ${role}...`);
          setUserRole(role);
          setDoc(doc(db, "users", user.uid), { 
            role: role, 
            email: user.email,
            displayName: name 
          }, { merge: true });
        }

        const timeoutId = setTimeout(() => {
          setUserRole(prev => {
            if (!prev) {
              console.warn("Firestore role fetch timed out, defaulting to", forcedRole || 'employee');
              return forcedRole || 'employee';
            }
            return prev;
          });
        }, 2000);

        try {
          unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), async (userDoc) => {
            clearTimeout(timeoutId);
            if (userDoc.exists()) {
              const data = userDoc.data();
              console.log("User role found:", data.role);
              
              // Delegation / Temporary Access check
              let activeRole = data.role;
              if (activeRole === 'temp_admin' && data.tempAccessEnd) {
                const now = new Date();
                const endDate = new Date(data.tempAccessEnd);
                if (now > endDate) {
                  // Expired!
                  console.log("Temporary admin access expired! Reverting to employee...");
                  activeRole = 'employee';
                  // Auto-revoke in firestore to keep state consistent
                  try {
                    await setDoc(doc(db, "users", user.uid), { 
                      role: 'employee', 
                      tempAccessEnd: null,
                      collegeName: null
                    }, { merge: true });
                  } catch (e) {
                    console.error("Failed to revoke in DB", e);
                  }
                }
              }

              setUserData({...data, role: activeRole});
              setUserRole(activeRole);
            } else {
              setUserRole(forcedRole || 'employee');
            }
          }, (error) => {
            console.error("Snapshot error:", error);
            clearTimeout(timeoutId);
            setUserRole(prev => prev || forcedRole || 'employee');
          });
        } catch (error) {
          clearTimeout(timeoutId);
          setUserRole(prev => prev || forcedRole || 'employee');
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
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
