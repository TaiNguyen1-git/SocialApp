import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import { useChat } from '../utils/ChatContext';
import { useAuth } from '../utils/AuthContext';

const ChatListScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    conversations,
    isConnected,
    connectionError,
    getConversations,
    isUserOnline,
  } = useChat();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Lấy danh sách cuộc trò chuyện khi màn hình load
    if (isConnected) {
      getConversations();
    }
  }, [isConnected]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isConnected) {
      getConversations();
    }
    setRefreshing(false);
  };

  const handleChatPress = (conversation) => {
    navigation.navigate('ChatScreen', {
      userId: conversation.userId,
      username: conversation.username,
      avatar: conversation.avatar,
    });
  };

  const handleNewChatPress = () => {
    navigation.navigate('UserList');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('vi-VN', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const renderConversationItem = ({ item }) => {
    const isOnline = isUserOnline(item.userId);

    return (
      <TouchableOpacity
        style={[styles.conversationItem, { backgroundColor: theme.card }]}
        onPress={() => handleChatPress(item)}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={[styles.avatarText, { color: '#fff' }]}>
              {item.username ? item.username.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.username, { color: theme.text }]}>
              {item.username || 'Unknown User'}
            </Text>
            <Text style={[styles.timestamp, { color: theme.placeholder }]}>
              {formatTime(item.lastMessageTime)}
            </Text>
          </View>

          <View style={styles.messagePreview}>
            <Text
              style={[
                styles.lastMessage,
                { color: theme.placeholder },
                item.unreadCount > 0 && { fontWeight: 'bold', color: theme.text }
              ]}
              numberOfLines={1}
            >
              {item.lastMessage || 'Chưa có tin nhắn'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.unreadCount}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="chatbubbles-outline"
        size={80}
        color={theme.placeholder}
      />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        Chưa có cuộc trò chuyện nào
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
        Bắt đầu trò chuyện với bạn bè của bạn
      </Text>
      <TouchableOpacity
        style={[styles.newChatButton, { backgroundColor: theme.primary }]}
        onPress={handleNewChatPress}
      >
        <Text style={styles.newChatButtonText}>Bắt đầu trò chuyện</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <View style={[styles.connectionStatus, { backgroundColor: '#e74c3c' }]}>
          <Ionicons name="wifi-outline" size={16} color="#fff" />
          <Text style={styles.connectionText}>
            {connectionError ? 'Lỗi kết nối' : 'Đang kết nối...'}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {renderConnectionStatus()}

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.userId}
        renderItem={renderConversationItem}
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
          conversations.length === 0 ? styles.emptyListContainer : null
        }
      />

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.primary,
            bottom: 20 + insets.bottom
          }
        ]}
        onPress={handleNewChatPress}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  connectionText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
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
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    marginBottom: 24,
  },
  newChatButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default ChatListScreen;
