import React, { createContext, useContext, useState, useEffect } from 'react';
import * as LocalStorage from '../services/localStorage';
import { useAuth } from './AuthContext';

// Tạo context cho notifications
const NotificationContext = createContext();

/**
 * Provider component cho notification context
 * Quản lý state và logic liên quan đến thông báo
 */
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Tải danh sách thông báo khi user thay đổi
  useEffect(() => {
    if (user) {
      loadNotifications();

      // Set up interval để check notifications mới mỗi 5 giây
      const interval = setInterval(() => {
        loadNotifications();
      }, 5000);

      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  /**
   * Tải danh sách thông báo từ storage
   */
  const loadNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userNotifications = await LocalStorage.getNotifications(user.id);
      setNotifications(userNotifications);

      // Đếm số thông báo chưa đọc
      const unread = userNotifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Đánh dấu thông báo đã đọc
   * @param {string} notificationId - ID của thông báo
   */
  const markAsRead = async (notificationId) => {
    try {
      await LocalStorage.markNotificationAsRead(notificationId);

      // Cập nhật state local
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // Cập nhật số thông báo chưa đọc
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
    }
  };

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  const markAllAsRead = async () => {
    try {
      // Đánh dấu tất cả thông báo chưa đọc
      const unreadNotifications = notifications.filter(n => !n.isRead);

      for (const notification of unreadNotifications) {
        await LocalStorage.markNotificationAsRead(notification.id);
      }

      // Cập nhật state local
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả thông báo đã đọc:', error);
    }
  };

  /**
   * Refresh danh sách thông báo
   */
  const refreshNotifications = () => {
    loadNotifications();
  };

  /**
   * Xóa một thông báo
   * @param {string} notificationId - ID của thông báo cần xóa
   */
  const clearNotification = async (notificationId) => {
    try {
      await LocalStorage.deleteNotification(notificationId);

      // Cập nhật state local
      setNotifications(prev => {
        const updatedNotifications = prev.filter(n => n.id !== notificationId);

        // Cập nhật unread count
        const deletedNotification = prev.find(n => n.id === notificationId);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }

        return updatedNotifications;
      });
    } catch (error) {
      console.error('Lỗi khi xóa thông báo:', error);
    }
  };

  /**
   * Xóa tất cả thông báo
   */
  const clearAllNotifications = async () => {
    if (!user) return;

    try {
      await LocalStorage.clearAllNotifications(user.id);

      // Cập nhật state local
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Lỗi khi xóa tất cả thông báo:', error);
    }
  };

  /**
   * Thêm thông báo mới (được gọi từ các action khác)
   * @param {string} userId - ID người nhận
   * @param {string} type - Loại thông báo
   * @param {string} message - Nội dung thông báo
   * @param {Object} data - Dữ liệu bổ sung
   */
  const addNotification = async (userId, type, message, data = {}) => {
    try {
      await LocalStorage.addNotification(userId, type, message, data);

      // Nếu thông báo cho user hiện tại, cập nhật state
      if (user && userId === user.id) {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Lỗi khi thêm thông báo:', error);
    }
  };

  // Giá trị context
  const contextValue = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    refreshNotifications,
    addNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook để sử dụng notification context
 * @returns {Object} Notification context value
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications phải được sử dụng trong NotificationProvider');
  }
  return context;
};

export default NotificationContext;
