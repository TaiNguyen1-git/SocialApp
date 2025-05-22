import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import các context provider và navigator
import { AuthProvider } from './src/utils/AuthContext';
import { ThemeProvider } from './src/utils/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeMockData } from './src/data/mockData';

export default function App() {
  // Khởi tạo dữ liệu mẫu khi ứng dụng khởi động
  useEffect(() => {
    const loadMockData = async () => {
      try {
        await initializeMockData();
      } catch (error) {
        console.error('Không thể khởi tạo dữ liệu mẫu:', error);
      }
    };

    loadMockData();
  }, []);

  return (
    // Bọc toàn bộ ứng dụng trong các provider cần thiết
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* AuthProvider quản lý trạng thái đăng nhập */}
        <AuthProvider>
          {/* ThemeProvider quản lý chủ đề sáng/tối */}
          <ThemeProvider>
            {/* AppNavigator xử lý điều hướng trong ứng dụng */}
            <AppNavigator />
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
