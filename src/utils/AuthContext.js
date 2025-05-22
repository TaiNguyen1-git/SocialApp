import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalStorage from '../services/localStorage';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Create context
export const AuthContext = createContext();

// Context provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useFirebase, setUseFirebase] = useState(false);

  useEffect(() => {
    // Check if user wants to use Firebase
    const checkStorageMethod = async () => {
      try {
        const method = await AsyncStorage.getItem('@SocialApp:storageMethod');
        setUseFirebase(method === 'firebase');
      } catch (error) {
        console.error('Error checking storage method:', error);
      }
    };

    checkStorageMethod();

    // Set up authentication listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (useFirebase && firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else if (!useFirebase) {
        // Check local storage for user
        LocalStorage.getCurrentUser()
          .then(localUser => {
            setUser(localUser);
          })
          .catch(error => {
            console.error('Error getting current user from local storage:', error);
          });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [useFirebase]);

  // Set storage method
  const setStorageMethod = async (method) => {
    try {
      await AsyncStorage.setItem('@SocialApp:storageMethod', method);
      setUseFirebase(method === 'firebase');
    } catch (error) {
      console.error('Error setting storage method:', error);
    }
  };

  // Register user
  const register = async (email, password, displayName) => {
    try {
      if (useFirebase) {
        // Use Firebase
        const firebaseUser = await import('../services/firebase').then(module => 
          module.registerUser(email, password, displayName)
        );
        return firebaseUser;
      } else {
        // Use local storage
        const localUser = await LocalStorage.registerUser(email, password, displayName);
        setUser(localUser);
        return localUser;
      }
    } catch (error) {
      throw error;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      if (useFirebase) {
        // Use Firebase
        const firebaseUser = await import('../services/firebase').then(module => 
          module.loginUser(email, password)
        );
        return firebaseUser;
      } else {
        // Use local storage
        const localUser = await LocalStorage.loginUser(email, password);
        setUser(localUser);
        return localUser;
      }
    } catch (error) {
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      if (useFirebase) {
        // Use Firebase
        await import('../services/firebase').then(module => module.logoutUser());
      } else {
        // Use local storage
        await LocalStorage.logoutUser();
        setUser(null);
      }
    } catch (error) {
      throw error;
    }
  };

  // Update user avatar
  const updateAvatar = async (avatarUrl) => {
    try {
      if (user) {
        if (useFirebase) {
          // Use Firebase
          // This would be implemented in a real app
        } else {
          // Use local storage
          await LocalStorage.updateUserAvatar(user.id, avatarUrl);
          setUser({ ...user, avatarUrl });
        }
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        useFirebase,
        setStorageMethod,
        register,
        login,
        logout,
        updateAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
