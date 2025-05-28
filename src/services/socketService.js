import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.currentUser = null;

    // Cấu hình server - Tự động thử kết nối nhiều URL
    this.serverUrls = [
      'http://192.168.0.102:3001',   // Điện thoại thật (IP thực tế)
      'http://10.0.2.2:3001',        // Android Emulator
      'http://localhost:3001'        // iOS Simulator/localhost
    ];
    this.currentUrlIndex = 0;
    this.serverUrl = this.serverUrls[0];
  }

  /**
   * Kết nối đến server Socket.IO
   * @param {Object} user - Thông tin user hiện tại
   */
  async connect(user) {
    if (this.socket && this.isConnected) {
      console.log('Socket đã được kết nối');
      return;
    }

    this.currentUser = user;
    return this.tryConnectWithUrls(user);
  }

  /**
   * Thử kết nối với các URL khác nhau
   * @param {Object} user - Thông tin user hiện tại
   */
  async tryConnectWithUrls(user) {
    for (let i = 0; i < this.serverUrls.length; i++) {
      const url = this.serverUrls[i];
      console.log(`Đang thử kết nối đến: ${url}`);

      try {
        const success = await this.attemptConnection(url, user);
        if (success) {
          console.log(`✅ Kết nối thành công đến: ${url}`);
          this.currentUrlIndex = i;
          this.serverUrl = url;
          return true;
        }
      } catch (error) {
        console.log(`❌ Không thể kết nối đến: ${url}`);
      }
    }

    console.error('❌ Không thể kết nối đến bất kỳ server nào');
    this.emit('connection_error', { error: 'Không thể kết nối đến server' });
    return false;
  }

  /**
   * Thử kết nối đến một URL cụ thể
   * @param {string} url - URL server
   * @param {Object} user - Thông tin user
   */
  async attemptConnection(url, user) {
    return new Promise((resolve) => {
      // Tạo kết nối socket với thông tin user
      const socket = io(url, {
        transports: ['websocket'],
        timeout: 5000, // Timeout ngắn hơn để thử nhanh
        query: {
          userId: user.id,
          username: user.displayName || user.username,
        },
      });

      // Xử lý sự kiện kết nối thành công
      socket.on('connect', () => {
        // Lưu socket thành công
        this.socket = socket;
        this.isConnected = true;

        // Gửi thông tin user để join
        socket.emit('join', {
          userId: user.id,
          username: user.displayName || user.username,
        });

        this.setupSocketListeners();
        this.emit('connection_status', { connected: true });
        resolve(true);
      });

      // Xử lý lỗi kết nối
      socket.on('connect_error', () => {
        socket.disconnect();
        resolve(false);
      });

      // Timeout fallback
      setTimeout(() => {
        if (!this.isConnected) {
          socket.disconnect();
          resolve(false);
        }
      }, 5000);
    });
  }

  /**
   * Thiết lập các event listeners cho socket
   */
  setupSocketListeners() {
    if (!this.socket) return;

    // Xử lý sự kiện mất kết nối
    this.socket.on('disconnect', (reason) => {
      console.log('Mất kết nối Socket.IO:', reason);
      this.isConnected = false;
      this.emit('connection_status', { connected: false, reason });
    });

    // Lắng nghe tin nhắn mới
    this.socket.on('new_message', (data) => {
      console.log('Nhận tin nhắn mới:', data);
      this.emit('new_message', data);
    });

    // Lắng nghe trạng thái typing
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    // Lắng nghe user online/offline
    this.socket.on('user_status', (data) => {
      this.emit('user_status', data);
    });

    // Lắng nghe danh sách cuộc trò chuyện
    this.socket.on('conversations_list', (data) => {
      this.emit('conversations_list', data);
    });

    // Lắng nghe lịch sử tin nhắn
    this.socket.on('message_history', (data) => {
      this.emit('message_history', data);
    });

    // Lắng nghe notification mới
    this.socket.on('new_notification', (data) => {
      console.log('Nhận notification mới:', data);
      this.emit('new_notification', data);
    });
  }

  /**
   * Ngắt kết nối socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentUser = null;
      console.log('Đã ngắt kết nối Socket.IO');
    }
  }

  /**
   * Gửi tin nhắn
   * @param {string} receiverId - ID người nhận
   * @param {string} message - Nội dung tin nhắn
   * @param {string} type - Loại tin nhắn (text, image, etc.)
   */
  sendMessage(receiverId, message, type = 'text') {
    if (!this.socket || !this.isConnected) {
      console.error('Socket chưa được kết nối');
      return false;
    }

    const messageData = {
      senderId: this.currentUser.id,
      receiverId,
      message,
      type,
      timestamp: new Date().toISOString(),
    };

    this.socket.emit('send_message', messageData);
    return true;
  }

  /**
   * Gửi trạng thái typing
   * @param {string} receiverId - ID người nhận
   * @param {boolean} isTyping - Có đang gõ hay không
   */
  sendTypingStatus(receiverId, isTyping) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('typing', {
      senderId: this.currentUser.id,
      receiverId,
      isTyping,
    });
  }

  /**
   * Lấy danh sách cuộc trò chuyện
   */
  getConversations() {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('get_conversations', {
      userId: this.currentUser.id,
    });
  }

  /**
   * Lấy lịch sử tin nhắn với một user
   * @param {string} otherUserId - ID user khác
   * @param {number} page - Trang (để phân trang)
   * @param {number} limit - Số tin nhắn mỗi trang
   */
  getMessageHistory(otherUserId, page = 1, limit = 50) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('get_message_history', {
      userId: this.currentUser.id,
      otherUserId,
      page,
      limit,
    });
  }

  /**
   * Join room chat với user khác
   * @param {string} otherUserId - ID user khác
   */
  joinChatRoom(otherUserId) {
    if (!this.socket || !this.isConnected) return;

    const roomId = this.generateRoomId(this.currentUser.id, otherUserId);
    this.socket.emit('join_room', { roomId, userId: this.currentUser.id });
  }

  /**
   * Leave room chat
   * @param {string} otherUserId - ID user khác
   */
  leaveChatRoom(otherUserId) {
    if (!this.socket || !this.isConnected) return;

    const roomId = this.generateRoomId(this.currentUser.id, otherUserId);
    this.socket.emit('leave_room', { roomId, userId: this.currentUser.id });
  }

  /**
   * Tạo room ID từ 2 user ID
   * @param {string} userId1
   * @param {string} userId2
   * @returns {string}
   */
  generateRoomId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
  }

  /**
   * Đăng ký lắng nghe sự kiện
   * @param {string} eventName - Tên sự kiện
   * @param {Function} callback - Hàm callback
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  /**
   * Hủy đăng ký lắng nghe sự kiện
   * @param {string} eventName - Tên sự kiện
   * @param {Function} callback - Hàm callback
   */
  off(eventName, callback) {
    if (this.listeners.has(eventName)) {
      const callbacks = this.listeners.get(eventName);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Phát sự kiện đến các listener
   * @param {string} eventName - Tên sự kiện
   * @param {*} data - Dữ liệu
   */
  emit(eventName, data) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Lỗi trong callback của sự kiện ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   * @returns {boolean}
   */
  isSocketConnected() {
    return this.socket && this.isConnected;
  }

  /**
   * Lấy thông tin user hiện tại
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Gửi notification real-time
   * @param {string} receiverId - ID người nhận
   * @param {string} type - Loại notification (like, comment, reply)
   * @param {string} message - Nội dung notification
   * @param {Object} notificationData - Dữ liệu bổ sung
   */
  sendNotification(receiverId, type, message, notificationData = {}) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket chưa được kết nối');
      return false;
    }

    const notificationPayload = {
      receiverId,
      type,
      message,
      notificationData,
      senderInfo: {
        id: this.currentUser.id,
        name: this.currentUser.displayName || this.currentUser.username,
        avatar: this.currentUser.avatar || null
      }
    };

    this.socket.emit('send_notification', notificationPayload);
    return true;
  }

  /**
   * Cập nhật URL server
   * @param {string} url - URL server mới
   */
  updateServerUrl(url) {
    this.serverUrl = url;
    // Nếu đang kết nối, ngắt và kết nối lại
    if (this.isConnected && this.currentUser) {
      this.disconnect();
      setTimeout(() => {
        this.connect(this.currentUser);
      }, 1000);
    }
  }
}

// Tạo instance singleton
const socketService = new SocketService();

export default socketService;
