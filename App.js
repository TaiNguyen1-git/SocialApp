import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import context providers
import { AuthProvider } from './src/utils/AuthContext';
import { ThemeProvider } from './src/utils/ThemeContext';

// Import navigation
import AppNavigator from './src/navigation/AppNavigator';

// Import mock data
import { initializeMockData } from './src/data/mockData';

export default function App() {
  // Initialize mock data when the app starts
  useEffect(() => {
    const loadMockData = async () => {
      try {
        await initializeMockData();
      } catch (error) {
        console.error('Failed to initialize mock data:', error);
      }
    };

    loadMockData();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppNavigator />
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
