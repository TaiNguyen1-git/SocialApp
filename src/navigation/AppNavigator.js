import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// ==================== SCREEN IMPORTS ====================
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationScreen from '../screens/NotificationScreen';
import SearchScreen from '../screens/SearchScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import UserListScreen from '../screens/UserListScreen';

// ==================== CONTEXT IMPORTS ====================
import { useAuth } from '../utils/AuthContext';
import { useTheme } from '../utils/ThemeContext';
import { useNotifications } from '../utils/NotificationContext';

// ==================== NAVIGATOR SETUP ====================
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ==================== AUTH NAVIGATOR ====================

const AuthNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Đăng nhập' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Đăng ký' }}
      />
    </Stack.Navigator>
  );
};

// ==================== MAIN TAB NAVIGATOR ====================

const MainTabNavigator = () => {
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Cấu hình biểu tượng cho từng tab
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        // Cấu hình màu sắc và kiểu dáng cho thanh tab
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.placeholder,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
        // Cấu hình tiêu đề
        headerStyle: {
          backgroundColor: theme.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Trang chủ' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Tìm kiếm' }}
      />
      <Tab.Screen
        name="Create"
        component={CreatePostScreen}
        options={{ title: 'Tạo bài' }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{ title: 'Chat' }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{
          title: 'Thông báo',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#e74c3c',
            color: 'white',
            fontSize: 10,
          }
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
};

// ==================== MAIN STACK NAVIGATOR ====================

const MainStackNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Chi tiết bài đăng' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Cài đặt' }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params?.username || 'Chat',
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen
        name="UserList"
        component={UserListScreen}
        options={{ title: 'Chọn người để chat' }}
      />
    </Stack.Navigator>
  );
};

// ==================== ROOT APP NAVIGATOR ====================

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  // Hiển thị màn hình trống trong khi đang tải
  if (loading) {
    return null;
  }

  return (
    <NavigationContainer
      // Cấu hình chủ đề cho navigation
      theme={{
        dark: theme.mode === 'dark',
        colors: {
          primary: theme.primary,
          background: theme.background,
          card: theme.card,
          text: theme.text,
          border: theme.border,
          notification: theme.accent,
        },
        fonts: {
          regular: {
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
          },
          medium: {
            fontFamily: 'sans-serif-medium',
            fontWeight: 'normal',
          },
          light: {
            fontFamily: 'sans-serif-light',
            fontWeight: 'normal',
          },
          thin: {
            fontFamily: 'sans-serif-thin',
            fontWeight: 'normal',
          },
          bold: {
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
          },
        },
      }}
    >
      {/* Hiển thị MainStackNavigator nếu đã đăng nhập, ngược lại hiển thị AuthNavigator */}
      {user ? <MainStackNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
