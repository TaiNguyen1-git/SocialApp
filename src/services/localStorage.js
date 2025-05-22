import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const USERS_KEY = '@SocialApp:users';
const CURRENT_USER_KEY = '@SocialApp:currentUser';
const POSTS_KEY = '@SocialApp:posts';

// User functions
export const registerUser = async (email, password, displayName) => {
  try {
    // Get existing users
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : [];
    
    // Check if email already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      throw new Error('Email already in use');
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password, // In a real app, you would hash this password
      displayName,
      createdAt: new Date().toISOString()
    };
    
    // Save user
    users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    // Get existing users
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : [];
    
    // Find user by email
    const user = users.find(user => user.email === email);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check password
    if (user.password !== password) {
      throw new Error('Incorrect password');
    }
    
    // Save current user
    const { password: _, ...userWithoutPassword } = user;
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    
    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    throw error;
  }
};

export const updateUserAvatar = async (userId, avatarUrl) => {
  try {
    // Get existing users
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : [];
    
    // Find and update user
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return { ...user, avatarUrl };
      }
      return user;
    });
    
    // Save updated users
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    
    // Update current user if it's the same user
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

// Post functions
export const createPost = async (userId, displayName, text, imageUrl) => {
  try {
    // Get existing posts
    const postsJson = await AsyncStorage.getItem(POSTS_KEY);
    const posts = postsJson ? JSON.parse(postsJson) : [];
    
    // Create new post
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
    
    // Save post
    posts.push(newPost);
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    
    return newPost.id;
  } catch (error) {
    throw error;
  }
};

export const getPosts = async () => {
  try {
    const postsJson = await AsyncStorage.getItem(POSTS_KEY);
    const posts = postsJson ? JSON.parse(postsJson) : [];
    
    // Sort by createdAt in descending order
    return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    throw error;
  }
};

export const likePost = async (postId, userId) => {
  try {
    // Get existing posts
    const postsJson = await AsyncStorage.getItem(POSTS_KEY);
    const posts = postsJson ? JSON.parse(postsJson) : [];
    
    // Find and update post
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        // Add userId to likes if not already there
        if (!post.likes.includes(userId)) {
          return { ...post, likes: [...post.likes, userId] };
        }
      }
      return post;
    });
    
    // Save updated posts
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
  } catch (error) {
    throw error;
  }
};

export const unlikePost = async (postId, userId) => {
  try {
    // Get existing posts
    const postsJson = await AsyncStorage.getItem(POSTS_KEY);
    const posts = postsJson ? JSON.parse(postsJson) : [];
    
    // Find and update post
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        // Remove userId from likes
        return { ...post, likes: post.likes.filter(id => id !== userId) };
      }
      return post;
    });
    
    // Save updated posts
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
  } catch (error) {
    throw error;
  }
};

export const addComment = async (postId, userId, displayName, text) => {
  try {
    // Get existing posts
    const postsJson = await AsyncStorage.getItem(POSTS_KEY);
    const posts = postsJson ? JSON.parse(postsJson) : [];
    
    // Find and update post
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        // Add comment
        const newComment = {
          id: Date.now().toString(),
          userId,
          displayName,
          text,
          createdAt: new Date().toISOString()
        };
        return { ...post, comments: [...post.comments, newComment] };
      }
      return post;
    });
    
    // Save updated posts
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
  } catch (error) {
    throw error;
  }
};
