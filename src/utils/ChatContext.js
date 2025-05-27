import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

// ==================== CONTEXT SETUP ====================

const ChatContext = createContext();

// ==================== ACTION TYPES ====================

const CHAT_ACTIONS = {
  SET_CONVERSATIONS: 'SET_CONVERSATIONS',
  ADD_CONVERSATION: 'ADD_CONVERSATION',
  UPDATE_CONVERSATION: 'UPDATE_CONVERSATION',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_CURRENT_CHAT: 'SET_CURRENT_CHAT',
  SET_TYPING_USERS: 'SET_TYPING_USERS',
  SET_ONLINE_USERS: 'SET_ONLINE_USERS',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  CLEAR_CHAT_DATA: 'CLEAR_CHAT_DATA',
  MARK_CONVERSATION_READ: 'MARK_CONVERSATION_READ',
};

// ==================== INITIAL STATE ====================

const initialState = {
  conversations: [],
  messages: {},
  currentChatUserId: null,
  typingUsers: {},
  onlineUsers: {},
  isConnected: false,
  connectionError: null,
};

// ==================== REDUCER ====================

const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SET_CONVERSATIONS:
      return {
        ...state,
        conversations: action.payload,
      };

    case CHAT_ACTIONS.ADD_CONVERSATION:
      const existingConv = state.conversations.find(
        conv => conv.userId === action.payload.userId
      );
      if (existingConv) {
        return {
          ...state,
          conversations: state.conversations.map(conv =>
            conv.userId === action.payload.userId
              ? { ...conv, ...action.payload }
              : conv
          ),
        };
      }
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };

    case CHAT_ACTIONS.UPDATE_CONVERSATION:
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.userId === action.payload.userId
            ? { ...conv, ...action.payload }
            : conv
        ),
      };

    case CHAT_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.userId]: action.payload.messages,
        },
      };

    case CHAT_ACTIONS.ADD_MESSAGE:
      const { userId, message } = action.payload;
      const currentMessages = state.messages[userId] || [];

      // Kiểm tra tin nhắn đã tồn tại chưa (tránh duplicate)
      const messageExists = currentMessages.some(
        msg => msg.id === message.id ||
        (msg.timestamp === message.timestamp && msg.senderId === message.senderId)
      );

      if (messageExists) {
        return state;
      }

      return {
        ...state,
        messages: {
          ...state.messages,
          [userId]: [...currentMessages, message].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          ),
        },
      };

    case CHAT_ACTIONS.SET_CURRENT_CHAT:
      return {
        ...state,
        currentChatUserId: action.payload,
      };

    case CHAT_ACTIONS.SET_TYPING_USERS:
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.userId]: action.payload.isTyping,
        },
      };

    case CHAT_ACTIONS.SET_ONLINE_USERS:
      return {
        ...state,
        onlineUsers: action.payload,
      };

    case CHAT_ACTIONS.SET_CONNECTION_STATUS:
      return {
        ...state,
        isConnected: action.payload.connected,
        connectionError: action.payload.error || null,
      };

    case CHAT_ACTIONS.MARK_CONVERSATION_READ:
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.userId === action.payload.userId
            ? { ...conv, unreadCount: 0 }
            : conv
        ),
      };

    case CHAT_ACTIONS.CLEAR_CHAT_DATA:
      return initialState;

    default:
      return state;
  }
};

// ==================== PROVIDER COMPONENT ====================

export const ChatProvider = ({ children }) => {
  // ==================== STATE MANAGEMENT ====================
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // ==================== SOCKET CONNECTION FUNCTIONS ====================

  const connectSocket = useCallback(async () => {
    if (user && !socketService.isSocketConnected()) {
      try {
        await socketService.connect(user);
      } catch (error) {
        console.error('Lỗi kết nối socket:', error);
      }
    }
  }, [user]);

  const disconnectSocket = useCallback(() => {
    socketService.disconnect();
    dispatch({ type: CHAT_ACTIONS.CLEAR_CHAT_DATA });
  }, [dispatch]);

  // ==================== SOCKET EVENT LISTENERS ====================

  useEffect(() => {
    const setupSocketListeners = () => {
      // Trạng thái kết nối
      socketService.on('connection_status', (data) => {
        dispatch({
          type: CHAT_ACTIONS.SET_CONNECTION_STATUS,
          payload: data,
        });
      });

      // Lỗi kết nối
      socketService.on('connection_error', (data) => {
        dispatch({
          type: CHAT_ACTIONS.SET_CONNECTION_STATUS,
          payload: { connected: false, error: data.error },
        });
      });

      // Tin nhắn mới
      socketService.on('new_message', (data) => {
        const otherUserId = data.senderId === user?.id ? data.receiverId : data.senderId;
        const isIncomingMessage = data.senderId !== user?.id;

        // Thêm tin nhắn vào danh sách
        dispatch({
          type: CHAT_ACTIONS.ADD_MESSAGE,
          payload: {
            userId: otherUserId,
            message: data,
          },
        });

        // Cập nhật cuộc trò chuyện
        dispatch({
          type: CHAT_ACTIONS.UPDATE_CONVERSATION,
          payload: {
            userId: otherUserId,
            lastMessage: data.message,
            lastMessageTime: data.timestamp,
            unreadCount: isIncomingMessage ? 1 : 0,
          },
        });

        // Tạo thông báo cho tin nhắn đến (không phải tin nhắn của mình gửi)
        if (isIncomingMessage && user?.id) {
          // Tìm thông tin người gửi từ conversations hoặc dùng senderId
          const senderName = data.senderName || `User ${data.senderId}`;

          addNotification(
            user.id,
            'message',
            `${senderName}: ${data.message}`,
            {
              senderId: data.senderId,
              senderName: senderName,
              chatId: otherUserId,
            }
          );
        }
      });

      // Trạng thái typing
      socketService.on('user_typing', (data) => {
        dispatch({
          type: CHAT_ACTIONS.SET_TYPING_USERS,
          payload: {
            userId: data.senderId,
            isTyping: data.isTyping,
          },
        });
      });

      // Trạng thái online/offline
      socketService.on('user_status', (data) => {
        dispatch({
          type: CHAT_ACTIONS.SET_ONLINE_USERS,
          payload: data,
        });
      });

      // Danh sách cuộc trò chuyện
      socketService.on('conversations_list', (data) => {
        dispatch({
          type: CHAT_ACTIONS.SET_CONVERSATIONS,
          payload: data.conversations || [],
        });
      });

      // Lịch sử tin nhắn
      socketService.on('message_history', (data) => {
        dispatch({
          type: CHAT_ACTIONS.SET_MESSAGES,
          payload: {
            userId: data.otherUserId,
            messages: data.messages || [],
          },
        });
      });
    };

    setupSocketListeners();

    return () => {
      // Cleanup listeners khi component unmount
      socketService.listeners.clear();
    };
  }, []);

  // Kết nối socket khi user đăng nhập
  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [user, connectSocket, disconnectSocket]);

  // ==================== CHAT FUNCTIONS ====================

  const sendMessage = (receiverId, message, type = 'text') => {
    if (!socketService.isSocketConnected()) {
      console.error('Socket chưa kết nối');
      return false;
    }

    const success = socketService.sendMessage(receiverId, message, type);

    if (success) {
      // Thêm tin nhắn vào state local ngay lập tức
      const messageData = {
        id: Date.now().toString(),
        senderId: user.id,
        receiverId,
        message,
        type,
        timestamp: new Date().toISOString(),
      };

      dispatch({
        type: CHAT_ACTIONS.ADD_MESSAGE,
        payload: {
          userId: receiverId,
          message: messageData,
        },
      });

      // Cập nhật cuộc trò chuyện
      dispatch({
        type: CHAT_ACTIONS.UPDATE_CONVERSATION,
        payload: {
          userId: receiverId,
          lastMessage: message,
          lastMessageTime: messageData.timestamp,
        },
      });
    }

    return success;
  };

  const startChat = (otherUserId) => {
    dispatch({
      type: CHAT_ACTIONS.SET_CURRENT_CHAT,
      payload: otherUserId,
    });

    // Mark conversation as read
    dispatch({
      type: CHAT_ACTIONS.MARK_CONVERSATION_READ,
      payload: { userId: otherUserId },
    });

    // Join chat room
    socketService.joinChatRoom(otherUserId);

    // Lấy lịch sử tin nhắn
    socketService.getMessageHistory(otherUserId);
  };

  const endChat = (otherUserId) => {
    if (otherUserId) {
      socketService.leaveChatRoom(otherUserId);
    }

    dispatch({
      type: CHAT_ACTIONS.SET_CURRENT_CHAT,
      payload: null,
    });
  };

  const sendTypingStatus = (receiverId, isTyping) => {
    socketService.sendTypingStatus(receiverId, isTyping);
  };

  const getConversations = () => {
    socketService.getConversations();
  };

  const getMessagesForUser = (userId) => {
    return state.messages[userId] || [];
  };

  const isUserTyping = (userId) => {
    return state.typingUsers[userId] || false;
  };

  const isUserOnline = (userId) => {
    return state.onlineUsers[userId] || false;
  };

  // ==================== CONTEXT VALUE ====================

  const value = {
    // State
    conversations: state.conversations,
    currentChatUserId: state.currentChatUserId,
    isConnected: state.isConnected,
    connectionError: state.connectionError,

    // Functions
    sendMessage,
    startChat,
    endChat,
    sendTypingStatus,
    getConversations,
    getMessagesForUser,
    isUserTyping,
    isUserOnline,
    connectSocket,
    disconnectSocket,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// ==================== CUSTOM HOOK ====================

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat phải được sử dụng trong ChatProvider');
  }
  return context;
};

export default ChatContext;
