import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../utils/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as LocalStorage from '../services/localStorage';

/**
 * Component hiển thị một bài đăng trong kết quả tìm kiếm
 */
const SearchPostItem = ({ post, onPress, theme }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <TouchableOpacity
      style={[styles.postItem, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => onPress(post)}
    >
      <View style={styles.postHeader}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={styles.avatarText}>
            {post.displayName ? post.displayName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.postInfo}>
          <Text style={[styles.userName, { color: theme.text }]}>{post.displayName}</Text>
          <Text style={[styles.postDate, { color: theme.placeholder }]}>
            {formatDate(post.createdAt)}
          </Text>
        </View>
      </View>

      <Text style={[styles.postText, { color: theme.text }]} numberOfLines={3}>
        {post.text}
      </Text>

      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
      )}

      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={16} color={theme.placeholder} />
          <Text style={[styles.statText, { color: theme.placeholder }]}>
            {post.likes ? post.likes.length : 0}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color={theme.placeholder} />
          <Text style={[styles.statText, { color: theme.placeholder }]}>
            {post.comments ? post.comments.length : 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Component hiển thị một người dùng trong kết quả tìm kiếm
 */
const SearchUserItem = ({ user, theme }) => {
  return (
    <View style={[styles.userItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
        <Text style={styles.avatarText}>
          {user.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.text }]}>{user.displayName}</Text>
        <Text style={[styles.userEmail, { color: theme.placeholder }]}>{user.email}</Text>
      </View>
    </View>
  );
};

/**
 * Màn hình tìm kiếm
 */
const SearchScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // Mặc định hiển thị users trước
  const [recentSearches, setRecentSearches] = useState([]);

  // Load all users when component mounts
  useEffect(() => {
    loadAllUsers();
  }, []);

  // Debounce search - search ngay khi gõ
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 1) { // Chỉ cần 1 ký tự là search
        performSearch(searchQuery.trim());
      } else {
        // Khi không có query, hiển thị tất cả người dùng
        loadAllUsers();
        setSearchResults([]);
      }
    }, 150); // Giảm xuống 150ms để search rất nhanh

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  /**
   * Load tất cả người dùng khi không có search query
   */
  const loadAllUsers = async () => {
    try {
      const users = await LocalStorage.searchUsers(''); // Empty query sẽ trả về tất cả users
      setUserResults(users);
    } catch (error) {
      console.error('Lỗi khi tải danh sách người dùng:', error);
    }
  };

  /**
   * Thực hiện tìm kiếm
   */
  const performSearch = async (query) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Tìm kiếm người dùng trước (ưu tiên)
      const users = await LocalStorage.searchUsers(query);
      setUserResults(users);

      // Tìm kiếm bài đăng
      const posts = await LocalStorage.searchPosts(query);
      setSearchResults(posts);

      // Tự động chuyển sang tab "Người dùng" nếu tìm thấy người dùng và ít bài đăng hơn
      if (users.length > 0 && (posts.length === 0 || users.length >= posts.length)) {
        setActiveTab('users');
      } else if (posts.length > 0) {
        setActiveTab('posts');
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xử lý khi nhấn vào bài đăng
   */
  const handlePostPress = (post) => {
    navigation.navigate('PostDetail', { post });
  };

  /**
   * Xóa tìm kiếm
   */
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setUserResults([]);
  };

  /**
   * Component hiển thị khi không có kết quả
   */
  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={theme.placeholder} />
          <Text style={[styles.emptyText, { color: theme.placeholder }]}>
            Khám phá người dùng
          </Text>
          <Text style={[styles.emptySubText, { color: theme.placeholder }]}>
            Gõ tên để tìm kiếm hoặc xem tất cả người dùng bên dưới
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={64} color={theme.placeholder} />
        <Text style={[styles.emptyText, { color: theme.placeholder }]}>
          Không tìm thấy kết quả
        </Text>
        <Text style={[styles.emptySubText, { color: theme.placeholder }]}>
          Thử tìm kiếm với từ khóa khác
        </Text>
      </View>
    );
  };

  /**
   * Render tab buttons
   */
  const renderTabButtons = () => (
    <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'posts' && { borderBottomColor: theme.primary }
        ]}
        onPress={() => setActiveTab('posts')}
      >
        <Text style={[
          styles.tabText,
          { color: activeTab === 'posts' ? theme.primary : theme.placeholder }
        ]}>
          Bài đăng ({searchResults.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'users' && { borderBottomColor: theme.primary }
        ]}
        onPress={() => setActiveTab('users')}
      >
        <Text style={[
          styles.tabText,
          { color: activeTab === 'users' ? theme.primary : theme.placeholder }
        ]}>
          Người dùng ({userResults.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={20} color={theme.placeholder} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Nhập tên người dùng hoặc từ khóa..."
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={theme.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Buttons */}
      {(searchResults.length > 0 || userResults.length > 0) && renderTabButtons()}

      {/* Results */}
      <FlatList
        data={activeTab === 'posts' ? searchResults : userResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          activeTab === 'posts' ? (
            <SearchPostItem
              post={item}
              onPress={handlePostPress}
              theme={theme}
            />
          ) : (
            <SearchUserItem
              user={item}
              theme={theme}
            />
          )
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 15,
  },
  postItem: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginVertical: 6,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginVertical: 6,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  postInfo: {
    flex: 1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  postDate: {
    fontSize: 12,
    marginTop: 2,
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  postStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
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

export default SearchScreen;
