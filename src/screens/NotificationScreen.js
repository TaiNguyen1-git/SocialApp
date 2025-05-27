import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import { useNotifications } from '../utils/NotificationContext';
import { useNavigation } from '@react-navigation/native';

// ==================== NOTIFICATION ITEM COMPONENT ====================
const NotificationItem = ({ notification, onPress, onMarkAsRead, onDelete, theme }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return 'heart';
      case 'comment':
        return 'chatbubble';
      case 'reply':
        return 'chatbubble-outline';
      case 'message':
        return 'chatbubbles';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'like':
        return '#e74c3c';
      case 'comment':
        return '#3498db';
      case 'reply':
        return '#9b59b6';
      default:
        return theme.primary;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Vừa xong';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: notification.isRead ? theme.background : theme.card,
          borderBottomColor: theme.border
        }
      ]}
      onPress={() => onPress(notification)}
    >
      <View style={[
        styles.notificationIcon,
        { backgroundColor: getNotificationColor(notification.type) }
      ]}>
        <Ionicons
          name={getNotificationIcon(notification.type)}
          size={20}
          color="white"
        />
      </View>

      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationMessage,
          {
            color: theme.text,
            fontWeight: notification.isRead ? 'normal' : 'bold'
          }
        ]}>
          {notification.message}
        </Text>
        <Text style={[styles.notificationTime, { color: theme.placeholder }]}>
          {formatDate(notification.createdAt)}
        </Text>
      </View>

      <View style={styles.notificationActions}>
        {!notification.isRead && (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={() => onMarkAsRead(notification.id)}
          >
            <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(notification.id)}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={theme.placeholder}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ==================== MAIN COMPONENT ====================

const NotificationScreen = () => {
  // ==================== HOOKS ====================
  const { theme } = useTheme();
  const navigation = useNavigation();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    refreshNotifications
  } = useNotifications();

  // ==================== EFFECTS ====================

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshNotifications();
    });

    return unsubscribe;
  }, [navigation]);

  // ==================== EVENT HANDLERS ====================

  const handleNotificationPress = async (notification) => {
    // Đánh dấu đã đọc nếu chưa đọc
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Điều hướng dựa trên loại thông báo
    if (notification.type === 'message') {
      // Xử lý thông báo chat
      if (notification.data?.senderId && notification.data?.senderName) {
        navigation.navigate('ChatScreen', {
          userId: notification.data.senderId,
          username: notification.data.senderName,
          avatar: notification.data.avatar || null,
        });
      }
    } else if (notification.data?.postId) {
      try {
        // Lấy thông tin chi tiết bài đăng từ storage
        const LocalStorage = require('../services/localStorage');
        const posts = await LocalStorage.getPosts();
        const post = posts.find(p => p.id === notification.data.postId);

        if (post) {
          // Tạo navigation params với highlight info
          const navigationParams = { post };

          // Thêm highlight info dựa trên loại notification
          if (notification.type === 'reply' && notification.data?.commentId) {
            navigationParams.highlightCommentId = notification.data.commentId;
            if (notification.data?.replyId) {
              navigationParams.highlightReplyId = notification.data.replyId;
            }
          } else if (notification.type === 'comment' && notification.data?.commentId) {
            navigationParams.highlightCommentId = notification.data.commentId;
          }

          // Điều hướng đến chi tiết bài đăng với highlight info
          navigation.navigate('PostDetail', navigationParams);
        } else {
          Alert.alert('Lỗi', 'Không tìm thấy bài đăng này.');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        Alert.alert('Lỗi', 'Không thể tải bài đăng.');
      }
    }
  };

  // Xử lý đánh dấu đã đọc
  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  // Xử lý xóa thông báo riêng lẻ
  const handleDeleteNotification = (notificationId) => {
    Alert.alert(
      'Xóa thông báo',
      'Bạn có chắc chắn muốn xóa thông báo này?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => clearNotification(notificationId),
        },
      ]
    );
  };

  // Xử lý đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) {
      Alert.alert('Thông báo', 'Không có thông báo chưa đọc nào.');
      return;
    }

    Alert.alert(
      'Đánh dấu tất cả đã đọc',
      'Bạn có chắc chắn muốn đánh dấu tất cả thông báo đã đọc?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đồng ý',
          onPress: markAllAsRead,
        },
      ]
    );
  };

  // Xử lý xóa tất cả thông báo
  const handleClearAllNotifications = () => {
    if (notifications.length === 0) {
      Alert.alert('Thông báo', 'Không có thông báo nào để xóa.');
      return;
    }

    Alert.alert(
      'Xóa tất cả thông báo',
      'Bạn có chắc chắn muốn xóa tất cả thông báo?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: clearAllNotifications,
        },
      ]
    );
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color={theme.placeholder} />
      <Text style={[styles.emptyText, { color: theme.placeholder }]}>
        Chưa có thông báo nào
      </Text>
      <Text style={[styles.emptySubText, { color: theme.placeholder }]}>
        Các thông báo về like, comment và reply sẽ hiển thị ở đây
      </Text>
    </View>
  );

  // ==================== MAIN RENDER ====================

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header với các nút action */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Thông báo {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.markAllButton, { backgroundColor: theme.primary }]}
              onPress={handleMarkAllAsRead}
            >
              <Text style={styles.markAllButtonText}>Đánh dấu tất cả</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              style={[styles.clearAllButton, { backgroundColor: '#e74c3c', marginLeft: 8 }]}
              onPress={handleClearAllNotifications}
            >
              <Ionicons name="trash-outline" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Danh sách thông báo */}
      {loading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={handleNotificationPress}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
              theme={theme}
            />
          )}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshNotifications}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
      )}
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  markAllButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markReadButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationScreen;
