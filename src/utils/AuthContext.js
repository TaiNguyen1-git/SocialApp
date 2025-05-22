import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const USERS_KEY = '@SocialApp:users';
const CURRENT_USER_KEY = '@SocialApp:currentUser';

// Create context
export const AuthContext = createContext();

// Context provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check AsyncStorage for user
    const loadUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
        const currentUser = userJson ? JSON.parse(userJson) : null;
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting current user from AsyncStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Register user
  const register = async (email, password, displayName) => {
    try {
      // Get existing users
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : [];

      // Check if email already exists
      const existingUser = users.find(user => user.email === email);
      if (existingUser) {
        throw new Error('Email already in use');
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email,
        password, // In a real app, you would hash this password
        displayName,
        createdAt: new Date().toISOString()
      };

      // Save user
      users.push(newUser);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;

      // Save current user
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

      setUser(userWithoutPassword);
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      // Get existing users
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : [];

      // Find user by email
      const user = users.find(user => user.email === email);
      if (!user) {
        throw new Error('User not found');
      }

      // Check password
      if (user.password !== password) {
        throw new Error('Incorrect password');
      }

      // Save current user
      const { password: _, ...userWithoutPassword } = user;
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

      setUser(userWithoutPassword);
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  // Update user avatar
  const updateAvatar = async (avatarUrl) => {
    try {
      if (user) {
        // Get existing users
        const usersJson = await AsyncStorage.getItem(USERS_KEY);
        const users = usersJson ? JSON.parse(usersJson) : [];

        // Find and update user
        const updatedUsers = users.map(u => {
          if (u.id === user.id) {
            return { ...u, avatarUrl };
          }
          return u;
        });

        // Save updated users
        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

        // Update current user
        const updatedUser = { ...user, avatarUrl };
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

        setUser(updatedUser);
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
