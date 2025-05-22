import AsyncStorage from '@react-native-async-storage/async-storage';

// Các khóa để lưu trữ dữ liệu trong AsyncStorage
const USERS_KEY = '@SocialApp:users';
const CURRENT_USER_KEY = '@SocialApp:currentUser';
const POSTS_KEY = '@SocialApp:posts';

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
 * Thích một bài đăng
 * @param {string} postId - ID của bài đăng
 * @param {string} userId - ID của người dùng thích bài đăng
 */
export const likePost = async (postId, userId) => {
  try {
    // Lấy danh sách bài đăng
    const postsJson = await AsyncStorage.getItem(POSTS_KEY);
    const posts = postsJson ? JSON.parse(postsJson) : [];
    
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
 */
export const addComment = async (postId, userId, displayName, text) => {
  try {
    // Lấy danh sách bài đăng
    const postsJson = await AsyncStorage.getItem(POSTS_KEY);
    const posts = postsJson ? JSON.parse(postsJson) : [];
    
    // Cập nhật bình luận cho bài đăng
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        // Tạo bình luận mới
        const newComment = {
          id: Date.now().toString(),
          userId,
          displayName,
          text,
          createdAt: new Date().toISOString()
        };
        // Thêm bình luận vào danh sách
        return { ...post, comments: [...post.comments, newComment] };
      }
      return post;
    });
    
    // Lưu danh sách bài đăng đã cập nhật
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
  } catch (error) {
    throw error;
  }
};
