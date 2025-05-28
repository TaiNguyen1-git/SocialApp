import React, { createContext, useContext, useState, useEffect } from 'react';
import * as LocalStorage from '../services/localStorage';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';
import { useNavigation } from '@react-navigation/native';

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
      setupSocketListeners();

      // Set up interval để check notifications mới mỗi 30 giây (giảm tần suất vì có real-time)
      const interval = setInterval(() => {
        loadNotifications();
      }, 30000);

      return () => {
        clearInterval(interval);
        cleanupSocketListeners();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
      cleanupSocketListeners();
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

  // ==================== SOCKET NOTIFICATION FUNCTIONS ====================

  /**
   * Thiết lập socket listeners cho notifications
   */
  const setupSocketListeners = () => {
    // Lắng nghe notification mới từ socket
    socketService.on('new_notification', handleNewNotification);
  };

  /**
   * Dọn dẹp socket listeners
   */
  const cleanupSocketListeners = () => {
    socketService.off('new_notification', handleNewNotification);
  };

  /**
   * Xử lý notification mới từ socket
   * @param {Object} notificationData - Dữ liệu notification từ socket
   */
  const handleNewNotification = async (notificationData) => {
    try {
      console.log('Nhận notification real-time:', notificationData);

      // Lưu notification vào local storage
      await LocalStorage.addNotification(
        user.id,
        notificationData.type,
        notificationData.message,
        notificationData.data
      );

      // Cập nhật state ngay lập tức
      await loadNotifications();

      // Hiển thị notification trực tiếp
      console.log(`🔔 ${notificationData.message}`);

      // TODO: Có thể thêm toast notification hoặc push notification ở đây
      // Alert.alert('Thông báo mới', notificationData.message);

    } catch (error) {
      console.error('Lỗi khi xử lý notification real-time:', error);
    }
  };

  /**
   * Navigate trực tiếp đến chi tiết notification
   * @param {Object} notification - Notification object
   */
  const navigateToNotification = async (notification) => {
    try {
      // Đánh dấu đã đọc
      await markAsRead(notification.id);

      // Navigate dựa trên loại notification
      if (notification.type === 'message') {
        // Xử lý thông báo chat - đã có trong NotificationScreen
        return;
      } else if (notification.data?.postId) {
        // Navigate đến PostDetailScreen
        const LocalStorage = require('../services/localStorage');
        const posts = await LocalStorage.getPosts();
        const post = posts.find(p => p.id === notification.data.postId);

        if (post) {
          // TODO: Implement navigation to PostDetailScreen
          console.log('Navigate to post:', post.id);
        }
      }
    } catch (error) {
      console.error('Lỗi khi navigate notification:', error);
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
    addNotification,
    navigateToNotification
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
