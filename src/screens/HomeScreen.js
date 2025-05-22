import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../utils/AuthContext';
import { useTheme } from '../utils/ThemeContext';
import * as LocalStorage from '../services/localStorage';
import * as Firebase from '../services/firebase';
import { Vibration } from 'react-native';

// Post component
const Post = ({ item, onLike, onComment, onPress, currentUserId, theme }) => {
  const isLiked = item.likes && item.likes.includes(currentUserId);
  const likeCount = item.likes ? item.likes.length : 0;
  const commentCount = item.comments ? item.comments.length : 0;
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  return (
    <TouchableOpacity 
      style={[styles.postContainer, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.postHeader}>
        <View style={styles.postUser}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {item.displayName ? item.displayName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View>
            <Text style={[styles.userName, { color: theme.text }]}>{item.displayName}</Text>
            <Text style={[styles.postTime, { color: theme.placeholder }]}>
              {item.createdAt ? formatDate(item.createdAt) : 'Just now'}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.postText, { color: theme.text }]}>{item.text}</Text>
      
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
      )}
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onLike(item.id)}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? theme.accent : theme.text} 
          />
          <Text style={[styles.actionText, { color: theme.text }]}>{likeCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onComment(item.id)}
        >
          <Ionicons name="chatbubble-outline" size={22} color={theme.text} />
          <Text style={[styles.actionText, { color: theme.text }]}>{commentCount}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user, useFirebase } = useAuth();
  const { theme } = useTheme();
  
  // Fetch posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      let fetchedPosts;
      
      if (useFirebase) {
        fetchedPosts = await Firebase.getPosts();
      } else {
        fetchedPosts = await LocalStorage.getPosts();
      }
      
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, [useFirebase]);
  
  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [useFirebase])
  );
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };
  
  // Handle like
  const handleLike = async (postId) => {
    try {
      if (!user) return;
      
      // Vibrate when liking
      Vibration.vibrate(50);
      
      // Optimistic update
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          const isLiked = post.likes && post.likes.includes(user.id);
          let likes = post.likes || [];
          
          if (isLiked) {
            likes = likes.filter(id => id !== user.id);
          } else {
            likes = [...likes, user.id];
          }
          
          return { ...post, likes };
        }
        return post;
      });
      
      setPosts(updatedPosts);
      
      // Update in storage
      if (useFirebase) {
        const post = posts.find(p => p.id === postId);
        const isLiked = post.likes && post.likes.includes(user.id);
        
        if (isLiked) {
          await Firebase.unlikePost(postId, user.id);
        } else {
          await Firebase.likePost(postId, user.id);
        }
      } else {
        const post = posts.find(p => p.id === postId);
        const isLiked = post.likes && post.likes.includes(user.id);
        
        if (isLiked) {
          await LocalStorage.unlikePost(postId, user.id);
        } else {
          await LocalStorage.likePost(postId, user.id);
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update on error
      fetchPosts();
    }
  };
  
  // Navigate to post detail
  const navigateToPostDetail = (post) => {
    navigation.navigate('PostDetail', { post });
  };
  
  // Render empty state
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={80} color={theme.placeholder} />
      <Text style={[styles.emptyText, { color: theme.text }]}>No posts yet</Text>
      <Text style={[styles.emptySubtext, { color: theme.placeholder }]}>
        Be the first to share something!
      </Text>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Post
              item={item}
              onLike={handleLike}
              onComment={() => navigateToPostDetail(item)}
              onPress={() => navigateToPostDetail(item)}
              currentUserId={user?.id}
              theme={theme}
            />
          )}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  postContainer: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  postTime: {
    fontSize: 12,
  },
  postText: {
    fontSize: 16,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  actionText: {
    marginLeft: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default HomeScreen;
