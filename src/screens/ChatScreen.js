import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import { useChat } from '../utils/ChatContext';
import { useAuth } from '../utils/AuthContext';

const ChatScreen = ({ route, navigation }) => {
  const { userId, username, avatar } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    sendMessage,
    startChat,
    endChat,
    getMessagesForUser,
    sendTypingStatus,
    isUserTyping,
    isUserOnline,
    isConnected,
  } = useChat();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Bắt đầu chat và lấy tin nhắn
    startChat(userId);

    // Cập nhật header với thông tin user
    navigation.setOptions({
      title: username,
      headerRight: () => (
        <View style={styles.headerRight}>
          {isUserOnline(userId) && (
            <View style={styles.onlineIndicator} />
          )}
        </View>
      ),
    });

    return () => {
      // Kết thúc chat khi rời khỏi màn hình
      endChat(userId);
    };
  }, [userId, username]);

  useEffect(() => {
    // Cập nhật danh sách tin nhắn khi có tin nhắn mới
    const userMessages = getMessagesForUser(userId);
    setMessages(userMessages);

    // Scroll xuống cuối khi có tin nhắn mới
    if (userMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [getMessagesForUser(userId)]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    if (!isConnected) {
      Alert.alert('Lỗi', 'Không có kết nối mạng');
      return;
    }

    const success = sendMessage(userId, message.trim());
    if (success) {
      setMessage('');
      // Dừng typing
      handleTypingStop();
    } else {
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn');
    }
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingStatus(userId, true);
    }

    // Reset timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Dừng typing sau 3 giây không gõ
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  };

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      sendTypingStatus(userId, false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.senderId === user.id;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDate = !previousMessage ||
      new Date(item.timestamp).toDateString() !== new Date(previousMessage.timestamp).toDateString();

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={[styles.dateText, { color: theme.placeholder }]}>
              {formatDate(item.timestamp)}
            </Text>
          </View>
        )}

        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}>
          <View style={[
            styles.messageBubble,
            isMyMessage
              ? [styles.myMessageBubble, { backgroundColor: theme.primary }]
              : [styles.otherMessageBubble, { backgroundColor: theme.card }]
          ]}>
            <Text style={[
              styles.messageText,
              { color: isMyMessage ? '#fff' : theme.text }
            ]}>
              {item.message}
            </Text>
            <Text style={[
              styles.messageTime,
              { color: isMyMessage ? 'rgba(255,255,255,0.7)' : theme.placeholder }
            ]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isUserTyping(userId)) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={[styles.typingBubble, { backgroundColor: theme.card }]}>
          <Text style={[styles.typingText, { color: theme.placeholder }]}>
            {username} đang gõ...
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.placeholder }]}>
        Bắt đầu cuộc trò chuyện với {username}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={renderMessage}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      {renderTypingIndicator()}

      <View style={[
        styles.inputContainer,
        {
          backgroundColor: theme.card,
          paddingBottom: Math.max(insets.bottom, 12)
        }
      ]}>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.background,
              color: theme.text,
              borderColor: theme.border,
            }
          ]}
          value={message}
          onChangeText={(text) => {
            setMessage(text);
            if (text.trim()) {
              handleTypingStart();
            } else {
              handleTypingStop();
            }
          }}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor={theme.placeholder}
          multiline
          maxLength={1000}
          onBlur={handleTypingStop}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: message.trim() ? theme.primary : theme.placeholder,
            }
          ]}
          onPress={handleSendMessage}
          disabled={!message.trim() || !isConnected}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ecc71',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageContainer: {
    marginVertical: 2,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;
