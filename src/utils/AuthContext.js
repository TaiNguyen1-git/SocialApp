import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Các khóa để lưu trữ dữ liệu trong AsyncStorage
const USERS_KEY = '@SocialApp:users';
const CURRENT_USER_KEY = '@SocialApp:currentUser';

// Tạo context để quản lý trạng thái xác thực
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // State để lưu trữ thông tin người dùng hiện tại
  const [user, setUser] = useState(null);
  // State để theo dõi trạng thái đang tải
  const [loading, setLoading] = useState(true);

  // Kiểm tra xem người dùng đã đăng nhập chưa khi ứng dụng khởi động
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Lấy thông tin người dùng từ AsyncStorage
        const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
        const currentUser = userJson ? JSON.parse(userJson) : null;
        setUser(currentUser);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng từ AsyncStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Hàm đăng ký người dùng mới
  const register = async (email, password, displayName) => {
    try {
      // Lấy danh sách người dùng hiện có
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : [];

      // Kiểm tra xem email đã tồn tại chưa
      const existingUser = users.find(user => user.email === email);
      if (existingUser) {
        throw new Error('Email đã được sử dụng');
      }

      // Tạo người dùng mới
      const newUser = {
        id: Date.now().toString(),
        email,
        password, // Trong ứng dụng thực tế, mật khẩu nên được mã hóa
        displayName,
        createdAt: new Date().toISOString()
      };

      // Lưu người dùng mới vào danh sách
      users.push(newUser);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Loại bỏ mật khẩu trước khi lưu vào state và AsyncStorage
      const { password: _, ...userWithoutPassword } = newUser;
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

      // Cập nhật state
      setUser(userWithoutPassword);
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  };

  // Hàm đăng nhập
  const login = async (email, password) => {
    try {
      // Lấy danh sách người dùng
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : [];

      // Tìm người dùng theo email
      const user = users.find(user => user.email === email);
      if (!user) {
        throw new Error('Không tìm thấy người dùng');
      }

      // Kiểm tra mật khẩu
      if (user.password !== password) {
        throw new Error('Mật khẩu không chính xác');
      }

      // Loại bỏ mật khẩu trước khi lưu vào state và AsyncStorage
      const { password: _, ...userWithoutPassword } = user;
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

      // Cập nhật state
      setUser(userWithoutPassword);
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  };

  // Hàm đăng xuất
  const logout = async () => {
    try {
      // Xóa thông tin người dùng hiện tại khỏi AsyncStorage
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      // Đặt lại state người dùng
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  // Hàm cập nhật ảnh đại diện
  const updateAvatar = async (avatarUrl) => {
    try {
      if (user) {
        // Lấy danh sách người dùng
        const usersJson = await AsyncStorage.getItem(USERS_KEY);
        const users = usersJson ? JSON.parse(usersJson) : [];

        // Cập nhật ảnh đại diện cho người dùng hiện tại
        const updatedUsers = users.map(u => {
          if (u.id === user.id) {
            return { ...u, avatarUrl };
          }
          return u;
        });

        // Lưu danh sách người dùng đã cập nhật
        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

        // Cập nhật thông tin người dùng hiện tại
        const updatedUser = { ...user, avatarUrl };
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

        // Cập nhật state
        setUser(updatedUser);
      }
    } catch (error) {
      throw error;
    }
  };

  // Cung cấp các giá trị và hàm cho context
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

// Hook tùy chỉnh để sử dụng AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng trong AuthProvider');
  }
  return context;
};
