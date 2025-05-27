import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import các context provider và navigator
import { AuthProvider } from './src/utils/AuthContext';
import { ThemeProvider } from './src/utils/ThemeContext';
import { NotificationProvider } from './src/utils/NotificationContext';
import { ChatProvider } from './src/utils/ChatContext';
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
            {/* NotificationProvider quản lý thông báo */}
            <NotificationProvider>
              {/* ChatProvider quản lý chat real-time */}
              <ChatProvider>
                {/* AppNavigator xử lý điều hướng trong ứng dụng */}
                <AppNavigator />
              </ChatProvider>
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
