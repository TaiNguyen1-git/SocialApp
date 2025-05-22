import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../utils/AuthContext';
import { useTheme } from '../utils/ThemeContext';
import * as LocalStorage from '../services/localStorage';

/**
 * Component hiển thị một bài đăng
 * @param {Object} item - Dữ liệu bài đăng
 * @param {Function} onLike - Hàm xử lý khi nhấn nút thích
 * @param {Function} onComment - Hàm xử lý khi nhấn nút bình luận
 * @param {Function} onPress - Hàm xử lý khi nhấn vào bài đăng
 * @param {string} currentUserId - ID của người dùng hiện tại
 * @param {Object} theme - Chủ đề hiện tại
 */
const Post = ({ item, onLike, onComment, onPress, currentUserId, theme }) => {
  // Kiểm tra xem người dùng hiện tại đã thích bài đăng chưa
  const isLiked = item.likes && item.likes.includes(currentUserId);
  const likeCount = item.likes ? item.likes.length : 0;
  const commentCount = item.comments ? item.comments.length : 0;

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <TouchableOpacity
      style={[styles.postContainer, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Phần header của bài đăng */}
      <View style={styles.postHeader}>
        <View style={styles.postUser}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {item.displayName ? item.displayName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          {/* Thông tin người đăng */}
          <View>
            <Text style={[styles.userName, { color: theme.text }]}>{item.displayName}</Text>
            <Text style={[styles.postTime, { color: theme.placeholder }]}>
              {item.createdAt ? formatDate(item.createdAt) : 'Vừa xong'}
            </Text>
          </View>
        </View>
      </View>

      {/* Nội dung bài đăng */}
      <Text style={[styles.postText, { color: theme.text }]}>{item.text}</Text>

      {/* Hình ảnh bài đăng (nếu có) */}
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
      )}

      {/* Phần tương tác (thích, bình luận) */}
      <View style={styles.postActions}>
        {/* Nút thích */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike(item.id)}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? theme.accent : theme.text}
          />
          <Text style={[styles.actionText, { color: theme.text }]}>{likeCount}</Text>
        </TouchableOpacity>

        {/* Nút bình luận */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment(item.id)}
        >
          <Ionicons name="chatbubble-outline" size={22} color={theme.text} />
          <Text style={[styles.actionText, { color: theme.text }]}>{commentCount}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Màn hình trang chủ hiển thị danh sách bài đăng
 */
const HomeScreen = ({ navigation }) => {
  // State để lưu trữ danh sách bài đăng
  const [posts, setPosts] = useState([]);
  // State để theo dõi trạng thái đang tải
  const [loading, setLoading] = useState(true);
  // State để theo dõi trạng thái đang làm mới
  const [refreshing, setRefreshing] = useState(false);

  // Lấy thông tin người dùng hiện tại từ AuthContext
  const { user } = useAuth();
  // Lấy chủ đề hiện tại từ ThemeContext
  const { theme } = useTheme();

  // Hàm lấy danh sách bài đăng
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await LocalStorage.getPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bài đăng:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Lấy danh sách bài đăng khi component được tạo
  useEffect(() => {
    fetchPosts();
  }, []);

  // Làm mới danh sách bài đăng khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  // Xử lý khi người dùng kéo xuống để làm mới
  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  // Xử lý khi người dùng thích/bỏ thích bài đăng
  const handleLike = async (postId) => {
    try {
      if (!user) return;

      // Rung nhẹ khi nhấn thích
      Vibration.vibrate(50);

      // Cập nhật UI ngay lập tức (optimistic update)
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          const isLiked = post.likes && post.likes.includes(user.id);
          let likes = post.likes || [];

          if (isLiked) {
            likes = likes.filter(id => id !== user.id);
          } else {
            likes = [...likes, user.id];
          }

          return { ...post, likes };
        }
        return post;
      });

      setPosts(updatedPosts);

      // Cập nhật trong storage
      const post = posts.find(p => p.id === postId);
      const isLiked = post.likes && post.likes.includes(user.id);

      if (isLiked) {
        await LocalStorage.unlikePost(postId, user.id);
      } else {
        await LocalStorage.likePost(postId, user.id);
      }
    } catch (error) {
      console.error('Lỗi khi thích/bỏ thích bài đăng:', error);
      // Khôi phục lại dữ liệu nếu có lỗi
      fetchPosts();
    }
  };

  // Điều hướng đến màn hình chi tiết bài đăng
  const navigateToPostDetail = (post) => {
    navigation.navigate('PostDetail', { post });
  };

  // Component hiển thị khi không có bài đăng nào
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={80} color={theme.placeholder} />
      <Text style={[styles.emptyText, { color: theme.text }]}>Chưa có bài đăng nào</Text>
      <Text style={[styles.emptySubtext, { color: theme.placeholder }]}>
        Hãy là người đầu tiên chia sẻ điều gì đó!
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Hiển thị indicator khi đang tải */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        // Hiển thị danh sách bài đăng
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Post
              item={item}
              onLike={handleLike}
              onComment={() => navigateToPostDetail(item)}
              onPress={() => navigateToPostDetail(item)}
              currentUserId={user?.id}
              theme={theme}
            />
          )}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
        />
      )}
    </View>
  );
};

// Định nghĩa styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  postContainer: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  postTime: {
    fontSize: 12,
  },
  postText: {
    fontSize: 16,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  actionText: {
    marginLeft: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default HomeScreen;
