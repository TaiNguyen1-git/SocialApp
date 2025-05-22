import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Định nghĩa chủ đề sáng
export const lightTheme = {
  mode: 'light',
  background: '#FFFFFF', // Màu nền
  text: '#000000', // Màu chữ
  primary: '#6200EE', // Màu chính
  secondary: '#03DAC6', // Màu phụ
  accent: '#FF4081', // Màu nhấn
  error: '#B00020', // Màu lỗi
  border: '#E0E0E0', // Màu viền
  card: '#F5F5F5', // Màu thẻ
  placeholder: '#9E9E9E', // Màu placeholder
};

// Định nghĩa chủ đề tối
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

// Tạo context để quản lý chủ đề
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Lấy chủ đề từ thiết bị
  const deviceTheme = useColorScheme();
  // State để lưu trữ chủ đề hiện tại
  const [theme, setTheme] = useState(deviceTheme === 'dark' ? darkTheme : lightTheme);
  // State để lưu trữ chế độ chủ đề ('system', 'light', hoặc 'dark')
  const [themeMode, setThemeMode] = useState('system');

  // Tải tùy chọn chủ đề đã lưu
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('@SocialApp:themeMode');
        if (savedThemeMode) {
          setThemeMode(savedThemeMode);

          // Áp dụng chủ đề dựa trên chế độ đã lưu
          if (savedThemeMode === 'light') {
            setTheme(lightTheme);
          } else if (savedThemeMode === 'dark') {
            setTheme(darkTheme);
          } else {
            // Sử dụng chủ đề hệ thống
            setTheme(deviceTheme === 'dark' ? darkTheme : lightTheme);
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải tùy chọn chủ đề:', error);
      }
    };

    loadThemePreference();
  }, [deviceTheme]);

  // Cập nhật chủ đề khi chủ đề thiết bị thay đổi
  useEffect(() => {
    if (themeMode === 'system') {
      setTheme(deviceTheme === 'dark' ? darkTheme : lightTheme);
    }
  }, [deviceTheme, themeMode]);

  // Chuyển đổi giữa chủ đề sáng và tối
  const toggleTheme = async () => {
    try {
      const newThemeMode = theme.mode === 'light' ? 'dark' : 'light';
      const newTheme = theme.mode === 'light' ? darkTheme : lightTheme;

      setTheme(newTheme);
      setThemeMode(newThemeMode);

      // Lưu tùy chọn chủ đề
      await AsyncStorage.setItem('@SocialApp:themeMode', newThemeMode);
    } catch (error) {
      console.error('Lỗi khi lưu tùy chọn chủ đề:', error);
    }
  };

  // Đặt chế độ chủ đề cụ thể
  const changeThemeMode = async (mode) => {
    try {
      setThemeMode(mode);

      // Áp dụng chủ đề dựa trên chế độ
      if (mode === 'light') {
        setTheme(lightTheme);
      } else if (mode === 'dark') {
        setTheme(darkTheme);
      } else {
        // Sử dụng chủ đề hệ thống
        setTheme(deviceTheme === 'dark' ? darkTheme : lightTheme);
      }

      // Lưu tùy chọn chủ đề
      await AsyncStorage.setItem('@SocialApp:themeMode', mode);
    } catch (error) {
      console.error('Lỗi khi lưu tùy chọn chủ đề:', error);
    }
  };

  // Cung cấp các giá trị và hàm cho context
  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        toggleTheme,
        setThemeMode: changeThemeMode,
        isDark: theme.mode === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Hook tùy chỉnh để sử dụng ThemeContext
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme phải được sử dụng trong ThemeProvider');
  }
  return context;
};
