import AsyncStorage from '@react-native-async-storage/async-storage';
import socketService from './socketService';

// ==================== STORAGE KEYS ====================
const USERS_KEY = '@SocialApp:users';
const CURRENT_USER_KEY = '@SocialApp:currentUser';
const POSTS_KEY = '@SocialApp:posts';
const NOTIFICATIONS_KEY = '@SocialApp:notifications';

// ==================== USER AUTHENTICATION FUNCTIONS ====================

/**
 * Đăng ký người dùng mới
 * @param {string} email - Email người dùng
 * @param {string} password - Mật khẩu người dùng
 * @param {string} displayName - Tên hiển thị
 * @returns {Object} Thông tin người dùng đã đăng ký (không bao gồm mật khẩu)
 */
export const registerUser = async (email, password, displayName) => {
  try {
    // Lấy danh sách người dùng hiện có
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : [];

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      throw new Error('Email đã được sử dụng');
    }

    // Tạo người dùng mới
    const newUser = {
      id: Date.now().toString(),
      email,
      password, // Trong ứng dụng thực tế, mật khẩu nên được mã hóa
      displayName,
      createdAt: new Date().toISOString()
    };

    // Lưu người dùng mới vào danh sách
    users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Trả về thông tin người dùng không bao gồm mật khẩu
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
};

/**
 * Đăng nhập người dùng
 * @param {string} email - Email người dùng
 * @param {string} password - Mật khẩu người dùng
 * @returns {Object} Thông tin người dùng đã đăng nhập (không bao gồm mật khẩu)
 */
export const loginUser = async (email, password) => {
  try {
    // Lấy danh sách người dùng
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : [];

    // Tìm người dùng theo email
    const user = users.find(user => user.email === email);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // Kiểm tra mật khẩu
    if (user.password !== password) {
      throw new Error('Mật khẩu không chính xác');
    }

    // Lưu thông tin người dùng hiện tại (không bao gồm mật khẩu)
    const { password: _, ...userWithoutPassword } = user;
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
};

/**
 * Đăng xuất người dùng hiện tại
 */
export const logoutUser = async () => {
  try {
    // Xóa thông tin người dùng hiện tại khỏi AsyncStorage
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy thông tin người dùng hiện tại
 * @returns {Object|null} Thông tin người dùng hiện tại hoặc null nếu chưa đăng nhập
 */
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật ảnh đại diện của người dùng
 * @param {string} userId - ID của người dùng
 * @param {string} avatarUrl - URL của ảnh đại diện mới
 */
export const updateUserAvatar = async (userId, avatarUrl) => {
  try {
    // Lấy danh sách người dùng
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : [];

    // Cập nhật ảnh đại diện cho người dùng
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return { ...user, avatarUrl };
      }
      return user;
    });

    // Lưu danh sách người dùng đã cập nhật
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

    // Cập nhật thông tin người dùng hiện tại nếu cần
    const currentUserJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (currentUserJson) {
      const currentUser = JSON.parse(currentUserJson);
      if (currentUser.id === userId) {
        const updatedCurrentUser = { ...currentUser, avatarUrl };
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrentUser));
      }
    }
  } catch (error) {
    throw error;
  }
};

// ==================== POST MANAGEMENT FUNCTIONS ====================

/**
 * Tạo bài đăng mới
 * @param {string} userId - ID của người dùng tạo bài đăng
 * @param {string} displayName - Tên hiển thị của người dùng
 * @param {string} text - Nội dung bài đăng
 * @param {string|null} imageUrl - URL của hình ảnh (nếu có)
 * @returns {string} ID của bài đăng mới
 */
export const createPost = async (userId, displayName, text, imageUrl) => {
  try {
    // Lấy danh sách bài đăng hiện có
    const postsJson = await AsyncStorage.getItem(POSTS_KEY);
    const posts = postsJson ? JSON.parse(postsJson) : [];

    // Tạo bài đăng mới
    const newPost = {
      id: Date.now().toString(),
      userId,
      displayName,
      text,
      imageUrl,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString()
    };

    // Lưu bài đăng mới vào danh sách
    posts.push(newPost);
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(posts));

    return newPost.id;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách tất cả bài đăng
 * @returns {Array} Danh sách bài đăng đã sắp xếp theo thời gian (mới nhất trước)
 */
export const getPosts = async () => {
  try {
    const postsJson = await AsyncStorage.getItem(POSTS_KEY);
    const posts = postsJson ? JSON.parse(postsJson) : [];

    // Sắp xếp bài đăng theo thời gian tạo (mới nhất trước)
    return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách bài đăng theo trang
 * @param {number} page - Số trang (bắt đầu từ 1)
 * @param {number} limit - Số lượng bài đăng mỗi trang
 * @returns {Object} Đối tượng chứa danh sách bài đăng và thông tin phân trang
 */
export const getPostsByPage = async (page = 1, limit = 5) => {
  try {
    const postsJson = await AsyncStorage.getItem(POSTS_KEY);
    const allPosts = postsJson ? JSON.parse(postsJson) : [];

    // Sắp xếp bài đăng theo thời gian tạo (mới nhất trước)
    const sortedPosts = allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Tính toán vị trí bắt đầu và kết thúc cho trang hiện tại
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Lấy bài đăng cho trang hiện tại
    const posts = sortedPosts.slice(startIndex, endIndex);

    // Thông tin phân trang
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(sortedPosts.length / limit),
      totalPosts: sortedPosts.length,
      hasMore: endIndex < sortedPosts.length
    };

    return { posts, pagination };
  } catch (error) {
    throw error;
  }
};

/**
 * Thích một bài đăng
 * @param {string} postId - ID của bài đăng
 * @param {string} userId - ID của người dùng thích bài đăng
 */
export const likePost = async (postId, userId) => {
  try {
    // Lấy danh sách bài đăng
    const postsJson = await AsyncStorage.getItem(POSTS_KEY);
    const posts = postsJson ? JSON.parse(postsJson) : [];

    // Tìm bài đăng và người dùng để tạo thông báo
    const post = posts.find(p => p.id === postId);
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : [];
    const user = users.find(u => u.id === userId);

    // Cập nhật lượt thích cho bài đăng
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        // Thêm userId vào danh sách likes nếu chưa có
        if (!post.likes.includes(userId)) {
          return { ...post, likes: [...post.likes, userId] };
        }
      }
      return post;
    });

    // Lưu danh sách bài đăng đã cập nhật
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));

    // Tạo thông báo cho chủ bài đăng (nếu không phải chính họ like)
    if (post && post.userId !== userId && user && !post.likes.includes(userId)) {
      const notificationMessage = `${user.displayName} đã thích bài đăng của bạn`;

      // Lưu notification vào local storage
      await addNotification(
        post.userId,
        'like',
        notificationMessage,
        { postId }
      );

      // Gửi notification real-time qua socket
      if (socketService.isSocketConnected()) {
        socketService.sendNotification(
          post.userId,
          'like',
          notificationMessage,
          { postId }
        );
      }
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Bỏ thích một bài đăng
 * @param {string} postId - ID của bài đăng
 * @param {string} userId - ID của người dùng bỏ thích bài đăng
 */
export const unlikePost = async (postId, userId) => {
  try {
    // Lấy danh sách bài đăng
    const postsJson = await AsyncStorage.getItem(POSTS_KEY);
    const posts = postsJson ? JSON.parse(postsJson) : [];

    // Cập nhật lượt thích cho bài đăng
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        // Xóa userId khỏi danh sách likes
        return { ...post, likes: post.likes.filter(id => id !== userId) };
      }
      return post;
    });

    // Lưu danh sách bài đăng đã cập nhật
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
  } catch (error) {
    throw error;
  }
};

/**
 * Thêm bình luận vào bài đăng
 * @param {string} postId - ID của bài đăng
 * @param {string} userId - ID của người dùng bình luận
 * @param {string} displayName - Tên hiển thị của người dùng
 * @param {string} text - Nội dung bình luận
 * @param {string|null} parentCommentId - ID của comment cha (nếu là reply)
 */
export const addComment = async (postId, userId, displayName, text, parentCommentId = null) => {
  try {
    // Lấy danh sách bài đăng
    const postsJson = await AsyncStorage.getItem(POSTS_KEY);
    const posts = postsJson ? JSON.parse(postsJson) : [];

    // Tạo bình luận mới trước
    const newComment = {
      id: Date.now().toString(),
      userId,
      displayName,
      text,
      parentCommentId,
      replies: [],
      createdAt: new Date().toISOString()
    };

    // Cập nhật bình luận cho bài đăng
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        if (parentCommentId) {
          // Nếu là reply, thêm vào replies của comment cha
          const updatedComments = post.comments.map(comment => {
            if (comment.id === parentCommentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newComment]
              };
            }
            return comment;
          });
          return { ...post, comments: updatedComments };
        } else {
          // Nếu là comment gốc, thêm vào danh sách comments
          return { ...post, comments: [...(post.comments || []), newComment] };
        }
      }
      return post;
    });

    // Lưu danh sách bài đăng đã cập nhật
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));

    // Tạo thông báo nếu cần
    if (parentCommentId) {
      // Tìm comment cha để lấy thông tin người được reply
      const originalPost = posts.find(p => p.id === postId);
      const parentComment = originalPost?.comments?.find(c => c.id === parentCommentId);

      console.log('Debug notification - Reply case:');
      console.log('- parentCommentId:', parentCommentId);
      console.log('- originalPost found:', !!originalPost);
      console.log('- parentComment found:', !!parentComment);
      console.log('- parentComment.userId:', parentComment?.userId);
      console.log('- current userId:', userId);

      if (parentComment && parentComment.userId !== userId) {
        console.log('Creating reply notification for user:', parentComment.userId);
        const notificationMessage = `${displayName} đã trả lời bình luận của bạn`;

        // Lưu notification vào local storage
        await addNotification(
          parentComment.userId,
          'reply',
          notificationMessage,
          { postId, commentId: parentCommentId, replyId: newComment.id }
        );

        // Gửi notification real-time qua socket
        if (socketService.isSocketConnected()) {
          socketService.sendNotification(
            parentComment.userId,
            'reply',
            notificationMessage,
            { postId, commentId: parentCommentId, replyId: newComment.id }
          );
        }
      } else {
        console.log('Not creating notification - same user or comment not found');
      }
    } else {
      // Thông báo cho chủ bài đăng về comment mới
      const originalPost = posts.find(p => p.id === postId);
      if (originalPost && originalPost.userId !== userId) {
        console.log('Creating comment notification for post owner:', originalPost.userId);
        const notificationMessage = `${displayName} đã bình luận về bài đăng của bạn`;

        // Lưu notification vào local storage
        await addNotification(
          originalPost.userId,
          'comment',
          notificationMessage,
          { postId, commentId: newComment.id }
        );

        // Gửi notification real-time qua socket
        if (socketService.isSocketConnected()) {
          socketService.sendNotification(
            originalPost.userId,
            'comment',
            notificationMessage,
            { postId, commentId: newComment.id }
          );
        }
      }
    }
  } catch (error) {
    throw error;
  }
};

// ==================== NOTIFICATION FUNCTIONS ====================

/**
 * Thêm thông báo mới
 * @param {string} userId - ID của người nhận thông báo
 * @param {string} type - Loại thông báo (like, comment, reply)
 * @param {string} message - Nội dung thông báo
 * @param {Object} data - Dữ liệu bổ sung
 */
export const addNotification = async (userId, type, message, data = {}) => {
  try {
    console.log('addNotification called with:', { userId, type, message, data });

    // Lấy danh sách thông báo hiện có
    const notificationsJson = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    const notifications = notificationsJson ? JSON.parse(notificationsJson) : [];

    console.log('Current notifications count:', notifications.length);

    // Tạo thông báo mới
    const newNotification = {
      id: Date.now().toString(),
      userId,
      type,
      message,
      data,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    console.log('Created new notification:', newNotification);

    // Thêm thông báo vào danh sách
    notifications.push(newNotification);

    // Lưu danh sách thông báo đã cập nhật
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));

    console.log('Notification saved successfully. Total notifications:', notifications.length);
  } catch (error) {
    console.error('Error in addNotification:', error);
    throw error;
  }
};

/**
 * Lấy danh sách thông báo của người dùng
 * @param {string} userId - ID của người dùng
 * @returns {Array} Danh sách thông báo đã sắp xếp theo thời gian (mới nhất trước)
 */
export const getNotifications = async (userId) => {
  try {
    const notificationsJson = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    const notifications = notificationsJson ? JSON.parse(notificationsJson) : [];

    // Lọc thông báo của người dùng và sắp xếp theo thời gian
    return notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    throw error;
  }
};

/**
 * Đánh dấu thông báo đã đọc
 * @param {string} notificationId - ID của thông báo
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationsJson = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    const notifications = notificationsJson ? JSON.parse(notificationsJson) : [];

    // Cập nhật trạng thái đã đọc
    const updatedNotifications = notifications.map(notification => {
      if (notification.id === notificationId) {
        return { ...notification, isRead: true };
      }
      return notification;
    });

    // Lưu danh sách thông báo đã cập nhật
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa một thông báo
 * @param {string} notificationId - ID của thông báo cần xóa
 */
export const deleteNotification = async (notificationId) => {
  try {
    const notificationsJson = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    const notifications = notificationsJson ? JSON.parse(notificationsJson) : [];

    // Lọc bỏ thông báo cần xóa
    const updatedNotifications = notifications.filter(notification =>
      notification.id !== notificationId
    );

    // Lưu danh sách thông báo đã cập nhật
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa tất cả thông báo của một user
 * @param {string} userId - ID của người dùng
 */
export const clearAllNotifications = async (userId) => {
  try {
    const notificationsJson = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    const notifications = notificationsJson ? JSON.parse(notificationsJson) : [];

    // Lọc bỏ tất cả thông báo của user này
    const updatedNotifications = notifications.filter(notification =>
      notification.userId !== userId
    );

    // Lưu danh sách thông báo đã cập nhật
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
  } catch (error) {
    throw error;
  }
};

/**
 * Đếm số thông báo chưa đọc
 * @param {string} userId - ID của người dùng
 * @returns {number} Số thông báo chưa đọc
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const notifications = await getNotifications(userId);
    return notifications.filter(notification => !notification.isRead).length;
  } catch (error) {
    throw error;
  }
};

// ==================== SEARCH FUNCTIONS ====================

/**
 * Tìm kiếm bài đăng theo từ khóa
 * @param {string} query - Từ khóa tìm kiếm
 * @returns {Array} Danh sách bài đăng phù hợp
 */
export const searchPosts = async (query) => {
  try {
    const posts = await getPosts();
    const lowercaseQuery = query.toLowerCase();

    return posts.filter(post =>
      post.text.toLowerCase().includes(lowercaseQuery) ||
      post.displayName.toLowerCase().includes(lowercaseQuery)
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Tìm kiếm người dùng theo tên
 * @param {string} query - Từ khóa tìm kiếm
 * @returns {Array} Danh sách người dùng phù hợp
 */
export const searchUsers = async (query) => {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : [];

    // Nếu không có query, trả về tất cả users
    if (!query || query.trim() === '') {
      return users.map(user => ({
        id: user.id,
        displayName: user.displayName,
        email: user.email
      })).sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    const lowercaseQuery = query.toLowerCase();

    // Tìm kiếm với độ ưu tiên: tên bắt đầu bằng query > tên chứa query > email chứa query
    const results = users.filter(user =>
      user.displayName.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery)
    ).map(user => ({
      id: user.id,
      displayName: user.displayName,
      email: user.email
    }));

    // Sắp xếp kết quả theo độ ưu tiên
    return results.sort((a, b) => {
      const aNameLower = a.displayName.toLowerCase();
      const bNameLower = b.displayName.toLowerCase();

      // Ưu tiên tên bắt đầu bằng query
      const aStartsWith = aNameLower.startsWith(lowercaseQuery);
      const bStartsWith = bNameLower.startsWith(lowercaseQuery);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // Nếu cả hai đều bắt đầu hoặc không bắt đầu bằng query, sắp xếp theo alphabet
      return aNameLower.localeCompare(bNameLower);
    });
  } catch (error) {
    throw error;
  }
};