import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../utils/AuthContext';
import { useChat } from '../utils/ChatContext';
import { useNotifications } from '../utils/NotificationContext';

const UserListScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isUserOnline } = useChat();
  const { notifications, clearNotification, clearAllNotifications } = useNotifications();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Lọc users theo search query
    if (searchQuery.trim()) {
      const filtered = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      // Lấy danh sách users từ AsyncStorage (mock data)
      const usersData = await AsyncStorage.getItem('@SocialApp:users');
      if (usersData) {
        const allUsers = JSON.parse(usersData);
        // Loại bỏ user hiện tại khỏi danh sách và format lại data
        const otherUsers = allUsers
          .filter(u => u.id !== user.id)
          .map(u => ({
            id: u.id,
            username: u.displayName,
            email: u.email,
            avatar: u.avatarUrl,
          }));
        setUsers(otherUsers);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách users:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleUserPress = (selectedUser) => {
    navigation.navigate('ChatScreen', {
      userId: selectedUser.id,
      username: selectedUser.username,
      avatar: selectedUser.avatar,
    });
  };

  const handleClearAllNotifications = () => {
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
          onPress: () => {
            clearAllNotifications();
            Alert.alert('Thành công', 'Đã xóa tất cả thông báo');
          },
        },
      ]
    );
  };

  // Cập nhật header với nút xóa thông báo
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleClearAllNotifications}
        >
          <Ionicons
            name="trash-outline"
            size={24}
            color={theme.text}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme, notifications]);

  const renderUserItem = ({ item }) => {
    const isOnline = isUserOnline(item.id);

    return (
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: theme.card }]}
        onPress={() => handleUserPress(item)}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={[styles.avatarText, { color: '#fff' }]}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: theme.text }]}>
            {item.username}
          </Text>
          <Text style={[styles.email, { color: theme.placeholder }]}>
            {item.email}
          </Text>
          {isOnline && (
            <Text style={[styles.onlineText, { color: '#2ecc71' }]}>
              Đang online
            </Text>
          )}
        </View>

        <Ionicons
          name="chatbubble-outline"
          size={24}
          color={theme.primary}
        />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="people-outline"
        size={80}
        color={theme.placeholder}
      />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {searchQuery ? 'Không tìm thấy user nào' : 'Chưa có user nào'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
        {searchQuery
          ? 'Thử tìm kiếm với từ khóa khác'
          : 'Hãy đăng ký thêm tài khoản để test chat'
        }
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.placeholder}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchInput,
            {
              color: theme.text,
              backgroundColor: theme.background,
            }
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm kiếm user..."
          placeholderTextColor={theme.placeholder}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.placeholder}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          filteredUsers.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    marginRight: 16,
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2ecc71',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    marginBottom: 2,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default UserListScreen;
