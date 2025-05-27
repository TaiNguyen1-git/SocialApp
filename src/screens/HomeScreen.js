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

// ==================== POST COMPONENT ====================

const Post = ({ item, onLike, onComment, onPress, currentUserId, theme }) => {
  // Kiểm tra xem người dùng hiện tại đã thích bài đăng chưa
  const isLiked = item.likes && item.likes.includes(currentUserId);
  const likeCount = item.likes ? item.likes.length : 0;

  // Tính tổng số comment bao gồm cả replies
  const getTotalCommentCount = (comments) => {
    if (!comments || comments.length === 0) return 0;

    let total = comments.length; // Đếm comment gốc

    // Đếm thêm replies
    comments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        total += comment.replies.length;
      }
    });

    return total;
  };

  const commentCount = getTotalCommentCount(item.comments);

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
      <Text style={[styles.postText, { color: theme.text, marginBottom: item.imageUrl ? 4 : 2 }]}>{item.text}</Text>

      {/* Hình ảnh bài đăng (nếu có) */}
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
      )}

      {/* Phần tương tác (thích, bình luận) */}
      <View style={[
        styles.postActions,
        { marginTop: item.imageUrl ? 2 : 2 }
      ]}>
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

// ==================== MAIN COMPONENT ====================

const HomeScreen = ({ navigation }) => {
  // ==================== CONSTANTS ====================
  const POSTS_PER_PAGE = 5;

  // ==================== STATE MANAGEMENT ====================
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allPosts, setAllPosts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasMore: false
  });

  // ==================== HOOKS ====================
  const { user } = useAuth();
  const { theme } = useTheme();

  // ==================== DATA FUNCTIONS ====================

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Lấy tất cả bài đăng
      const fetchedPosts = await LocalStorage.getPosts();
      setAllPosts(fetchedPosts);

      // Lấy bài đăng cho trang đầu tiên
      const postsForFirstPage = fetchedPosts.slice(0, POSTS_PER_PAGE);
      setPosts(postsForFirstPage);

      // Cập nhật thông tin phân trang
      setPagination({
        currentPage: 1,
        totalPages: Math.ceil(fetchedPosts.length / POSTS_PER_PAGE),
        totalPosts: fetchedPosts.length,
        hasMore: fetchedPosts.length > POSTS_PER_PAGE
      });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bài đăng:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Hàm tải thêm bài đăng (trang tiếp theo)
  const loadMorePosts = () => {
    // Nếu đang tải hoặc không còn bài đăng để tải, không làm gì cả
    if (loadingMore || !pagination.hasMore) return;

    try {
      setLoadingMore(true);

      // Tính toán vị trí bắt đầu và kết thúc cho trang tiếp theo
      const nextPage = pagination.currentPage + 1;
      const startIndex = (nextPage - 1) * POSTS_PER_PAGE;
      const endIndex = nextPage * POSTS_PER_PAGE;

      // Lấy bài đăng cho trang tiếp theo
      const postsForNextPage = allPosts.slice(startIndex, endIndex);

      // Thêm bài đăng mới vào danh sách hiện tại
      setPosts(prevPosts => [...prevPosts, ...postsForNextPage]);

      // Cập nhật thông tin phân trang
      setPagination(prev => ({
        ...prev,
        currentPage: nextPage,
        hasMore: endIndex < allPosts.length
      }));
    } catch (error) {
      console.error('Lỗi khi tải thêm bài đăng:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // ==================== EFFECTS ====================

  useEffect(() => {
    fetchPosts();
  }, []);

  // Làm mới danh sách bài đăng khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  // ==================== EVENT HANDLERS ====================

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

  // ==================== RENDER FUNCTIONS ====================

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
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.loadingMoreText, { color: theme.placeholder }]}>
                  Đang tải thêm bài viết...
                </Text>
              </View>
            ) : pagination.hasMore ? (
              <View style={styles.loadingMoreContainer}>
                <Text style={[styles.loadingMoreText, { color: theme.placeholder }]}>
                  Kéo xuống để tải thêm
                </Text>
              </View>
            ) : posts.length > 0 ? (
              <View style={styles.loadingMoreContainer}>
                <Text style={[styles.loadingMoreText, { color: theme.placeholder }]}>
                  Đã hiển thị tất cả bài viết
                </Text>
              </View>
            ) : null
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
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  postTime: {
    fontSize: 11,
    marginTop: 1,
  },
  postContent: {
    marginBottom: 0,
  },
  postText: {
    fontSize: 15,
    marginBottom: 0,
    lineHeight: 20,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 4,
    marginBottom: 0,
  },
  countsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 0,
    minHeight: 14,
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countIcon: {
    marginRight: 4,
  },
  countText: {
    fontSize: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 0.5,
    paddingTop: 2,
    paddingHorizontal: 5,
    marginTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '500',
  },
  // Animation styles
  actionButtonAnimating: {
    transform: [{ scale: 1.05 }],
  },
  likeIconAnimating: {
    transform: [{ scale: 1.3 }],
  },
  actionTextAnimating: {
    fontWeight: 'bold',
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
  loadingMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    marginTop: 5,
  },
});

export default HomeScreen;
