import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define themes
export const lightTheme = {
  mode: 'light',
  background: '#FFFFFF',
  text: '#000000',
  primary: '#6200EE',
  secondary: '#03DAC6',
  accent: '#FF4081',
  error: '#B00020',
  border: '#E0E0E0',
  card: '#F5F5F5',
  placeholder: '#9E9E9E',
};

export const darkTheme = {
  mode: 'dark',
  background: '#121212',
  text: '#FFFFFF',
  primary: '#BB86FC',
  secondary: '#03DAC6',
  accent: '#CF6679',
  error: '#CF6679',
  border: '#2D2D2D',
  card: '#1E1E1E',
  placeholder: '#757575',
};

// Create context
export const ThemeContext = createContext();

// Context provider
export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [theme, setTheme] = useState(deviceTheme === 'dark' ? darkTheme : lightTheme);
  const [themeMode, setThemeMode] = useState('system'); // 'system', 'light', or 'dark'

  useEffect(() => {
    // Load saved theme preference
    const loadThemePreference = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('@SocialApp:themeMode');
        if (savedThemeMode) {
          setThemeMode(savedThemeMode);
          
          if (savedThemeMode === 'light') {
            setTheme(lightTheme);
          } else if (savedThemeMode === 'dark') {
            setTheme(darkTheme);
          } else {
            // System default
            setTheme(deviceTheme === 'dark' ? darkTheme : lightTheme);
          }
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, [deviceTheme]);

  // Update theme when device theme changes
  useEffect(() => {
    if (themeMode === 'system') {
      setTheme(deviceTheme === 'dark' ? darkTheme : lightTheme);
    }
  }, [deviceTheme, themeMode]);

  // Toggle between light and dark themes
  const toggleTheme = async () => {
    try {
      const newThemeMode = theme.mode === 'light' ? 'dark' : 'light';
      const newTheme = theme.mode === 'light' ? darkTheme : lightTheme;
      
      setTheme(newTheme);
      setThemeMode(newThemeMode);
      
      await AsyncStorage.setItem('@SocialApp:themeMode', newThemeMode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Set specific theme
  const setThemeMode = async (mode) => {
    try {
      setThemeMode(mode);
      
      if (mode === 'light') {
        setTheme(lightTheme);
      } else if (mode === 'dark') {
        setTheme(darkTheme);
      } else {
        // System default
        setTheme(deviceTheme === 'dark' ? darkTheme : lightTheme);
      }
      
      await AsyncStorage.setItem('@SocialApp:themeMode', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        toggleTheme,
        setThemeMode,
        isDark: theme.mode === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
