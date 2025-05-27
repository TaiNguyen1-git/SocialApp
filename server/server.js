const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Cấu hình CORS cho Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*", // Cho phép tất cả origins (chỉ dùng cho development)
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Lưu trữ thông tin users và messages trong memory (chỉ để test)
const connectedUsers = new Map(); // userId -> socketId
const userProfiles = new Map(); // userId -> user info
const conversations = new Map(); // userId -> array of conversations
const messages = new Map(); // roomId -> array of messages

// API endpoint để kiểm tra server
app.get('/', (req, res) => {
  res.json({
    message: 'SocialApp Chat Server đang chạy!',
    connectedUsers: connectedUsers.size,
    timestamp: new Date().toISOString()
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Xử lý khi user join
  socket.on('join', (userData) => {
    const { userId, username } = userData;

    // Lưu thông tin user
    connectedUsers.set(userId, socket.id);
    userProfiles.set(userId, { userId, username, socketId: socket.id });

    // Join user vào room riêng của họ
    socket.join(userId);

    console.log(`User ${username} (${userId}) joined`);

    // Thông báo cho tất cả users khác về user online
    socket.broadcast.emit('user_status', {
      userId,
      username,
      isOnline: true
    });

    // Gửi danh sách users online cho user mới
    const onlineUsers = {};
    userProfiles.forEach((profile, id) => {
      if (id !== userId) {
        onlineUsers[id] = true;
      }
    });
    socket.emit('user_status', onlineUsers);
  });

  // Xử lý gửi tin nhắn
  socket.on('send_message', (data) => {
    const { senderId, receiverId, message, type, timestamp } = data;

    // Lấy thông tin người gửi
    const senderProfile = userProfiles.get(senderId);
    const senderName = senderProfile?.username || `User ${senderId}`;

    // Tạo room ID từ 2 user ID
    const roomId = [senderId, receiverId].sort().join('_');

    // Tạo message object
    const messageData = {
      id: Date.now().toString(),
      senderId,
      receiverId,
      message,
      type: type || 'text',
      timestamp: timestamp || new Date().toISOString(),
      roomId,
      senderName
    };

    // Lưu tin nhắn
    if (!messages.has(roomId)) {
      messages.set(roomId, []);
    }
    messages.get(roomId).push(messageData);

    // Gửi tin nhắn cho cả sender và receiver
    io.to(senderId).emit('new_message', messageData);
    io.to(receiverId).emit('new_message', messageData);

    // Cập nhật conversation cho cả 2 users
    updateConversation(senderId, receiverId, messageData);
    updateConversation(receiverId, senderId, messageData);

    console.log(`Message from ${senderId} to ${receiverId}: ${message}`);
  });

  // Xử lý typing status
  socket.on('typing', (data) => {
    const { senderId, receiverId, isTyping } = data;

    // Gửi typing status cho receiver
    io.to(receiverId).emit('user_typing', {
      senderId,
      isTyping
    });
  });

  // Xử lý join room
  socket.on('join_room', (data) => {
    const { roomId, userId } = data;
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
  });

  // Xử lý leave room
  socket.on('leave_room', (data) => {
    const { roomId, userId } = data;
    socket.leave(roomId);
    console.log(`User ${userId} left room ${roomId}`);
  });

  // Xử lý lấy lịch sử tin nhắn
  socket.on('get_message_history', (data) => {
    const { userId, otherUserId, page = 1, limit = 50 } = data;

    const roomId = [userId, otherUserId].sort().join('_');
    const roomMessages = messages.get(roomId) || [];

    // Phân trang (đơn giản)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMessages = roomMessages.slice(startIndex, endIndex);

    socket.emit('message_history', {
      otherUserId,
      messages: paginatedMessages,
      page,
      hasMore: endIndex < roomMessages.length
    });
  });

  // Xử lý lấy danh sách conversations
  socket.on('get_conversations', (data) => {
    const { userId } = data;
    const userConversations = conversations.get(userId) || [];

    socket.emit('conversations_list', {
      conversations: userConversations
    });
  });

  // Xử lý disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Tìm và xóa user khỏi danh sách connected
    let disconnectedUserId = null;
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        connectedUsers.delete(userId);
        userProfiles.delete(userId);
        break;
      }
    }

    // Thông báo cho các users khác về user offline
    if (disconnectedUserId) {
      socket.broadcast.emit('user_status', {
        userId: disconnectedUserId,
        isOnline: false
      });
    }
  });
});

// Helper function để cập nhật conversation
function updateConversation(userId, otherUserId, messageData) {
  if (!conversations.has(userId)) {
    conversations.set(userId, []);
  }

  const userConversations = conversations.get(userId);
  const otherUserProfile = userProfiles.get(otherUserId);

  // Tìm conversation hiện có
  let conversation = userConversations.find(conv => conv.userId === otherUserId);

  if (!conversation) {
    // Tạo conversation mới
    conversation = {
      userId: otherUserId,
      username: otherUserProfile?.username || `User ${otherUserId}`,
      avatar: null,
      lastMessage: messageData.message,
      lastMessageTime: messageData.timestamp,
      unreadCount: messageData.senderId === otherUserId ? 1 : 0
    };
    userConversations.unshift(conversation);

    console.log(`Created new conversation for ${userId} with ${otherUserId} (${conversation.username})`);
  } else {
    // Cập nhật conversation hiện có
    conversation.lastMessage = messageData.message;
    conversation.lastMessageTime = messageData.timestamp;

    // Cập nhật username nếu có thông tin mới
    if (otherUserProfile?.username && conversation.username.startsWith('User ')) {
      conversation.username = otherUserProfile.username;
    }

    // Chỉ tăng unread count nếu tin nhắn từ người khác và người nhận không đang trong room
    if (messageData.senderId === otherUserId) {
      const receiverSocketId = connectedUsers.get(userId);
      const roomId = [userId, otherUserId].sort().join('_');

      // Kiểm tra xem receiver có đang trong room không
      let isInRoom = false;
      if (receiverSocketId) {
        const receiverSocket = io.sockets.sockets.get(receiverSocketId);
        isInRoom = receiverSocket && receiverSocket.rooms.has(roomId);
      }

      // Chỉ tăng unread count nếu không đang trong room
      if (!isInRoom) {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
      }
    }

    // Di chuyển conversation lên đầu
    const index = userConversations.indexOf(conversation);
    if (index > 0) {
      userConversations.splice(index, 1);
      userConversations.unshift(conversation);
    }
  }

  // Gửi cập nhật conversations cho user
  const userSocketId = connectedUsers.get(userId);
  if (userSocketId) {
    io.to(userSocketId).emit('conversations_list', {
      conversations: userConversations
    });
  }
}

// Lấy địa chỉ IP của máy
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const results = {};

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Bỏ qua địa chỉ internal và non-IPv4
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  // Trả về IP đầu tiên tìm được
  for (const name of Object.keys(results)) {
    if (results[name].length > 0) {
      return results[name][0];
    }
  }

  return 'localhost';
}

const PORT = process.env.PORT || 3001;
const localIP = getLocalIP();

server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 SocialApp Chat Server đang chạy!');
  console.log('='.repeat(50));
  console.log(`📱 Localhost: http://localhost:${PORT}`);
  console.log(`🌐 Local IP: http://${localIP}:${PORT}`);
  console.log('='.repeat(50));
  console.log('💡 Để test trên thiết bị thật:');
  console.log(`   Cập nhật serverUrl trong socketService.js thành: http://${localIP}:${PORT}`);
  console.log('💡 IP hiện tại đã được cấu hình: http://192.168.0.102:3001');
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
