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

/**
 * Component hiển thị một thông báo
 */
const NotificationItem = ({ notification, onPress, onMarkAsRead, theme }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return 'heart';
      case 'comment':
        return 'chatbubble';
      case 'reply':
        return 'chatbubble-outline';
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

      {!notification.isRead && (
        <TouchableOpacity
          style={styles.markReadButton}
          onPress={() => onMarkAsRead(notification.id)}
        >
          <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

/**
 * Màn hình hiển thị danh sách thông báo
 */
const NotificationScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotifications();

  // Tải thông báo khi màn hình được focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshNotifications();
    });

    return unsubscribe;
  }, [navigation]);

  // Xử lý khi nhấn vào thông báo
  const handleNotificationPress = async (notification) => {
    // Đánh dấu đã đọc nếu chưa đọc
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Điều hướng dựa trên loại thông báo
    if (notification.data?.postId) {
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

  // Component hiển thị khi không có thông báo
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header với nút đánh dấu tất cả đã đọc */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Thông báo {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllButton, { backgroundColor: theme.primary }]}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllButtonText}>Đánh dấu tất cả</Text>
          </TouchableOpacity>
        )}
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
  markReadButton: {
    padding: 8,
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
