import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { useTheme } from '../utils/ThemeContext';
import * as LocalStorage from '../services/localStorage';
import { Vibration } from 'react-native';

// Comment component
const Comment = ({ comment, theme }) => {
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <View style={[styles.commentContainer, { borderColor: theme.border }]}>
      <View style={styles.commentHeader}>
        <View style={[styles.commentAvatar, { backgroundColor: theme.primary }]}>
          <Text style={styles.commentAvatarText}>
            {comment.displayName ? comment.displayName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View>
          <Text style={[styles.commentUserName, { color: theme.text }]}>{comment.displayName}</Text>
          <Text style={[styles.commentTime, { color: theme.placeholder }]}>
            {comment.createdAt ? formatDate(comment.createdAt) : 'Just now'}
          </Text>
        </View>
      </View>
      <Text style={[styles.commentText, { color: theme.text }]}>{comment.text}</Text>
    </View>
  );
};

const PostDetailScreen = ({ route, navigation }) => {
  const { post: initialPost } = route.params;

  const [post, setPost] = useState(initialPost);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const { theme } = useTheme();

  // Check if post is liked by current user
  const isLiked = post.likes && post.likes.includes(user?.id);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Fetch updated post
  const fetchPost = async () => {
    try {
      setRefreshing(true);

      const posts = await LocalStorage.getPosts();

      const updatedPost = posts.find(p => p.id === post.id);
      if (updatedPost) {
        setPost(updatedPost);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle like
  const handleLike = async () => {
    try {
      if (!user) return;

      // Vibrate when liking
      Vibration.vibrate(50);

      // Optimistic update
      const updatedLikes = post.likes || [];
      let newLikes;

      if (isLiked) {
        newLikes = updatedLikes.filter(id => id !== user.id);
      } else {
        newLikes = [...updatedLikes, user.id];
      }

      setPost({ ...post, likes: newLikes });

      // Update in storage
      if (isLiked) {
        await LocalStorage.unlikePost(post.id, user.id);
      } else {
        await LocalStorage.likePost(post.id, user.id);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update on error
      fetchPost();
    }
  };

  // Add comment
  const addComment = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    setLoading(true);

    try {
      // Optimistic update
      const newComment = {
        id: Date.now().toString(),
        userId: user.id,
        displayName: user.displayName,
        text: comment,
        createdAt: new Date().toISOString()
      };

      const updatedComments = [...(post.comments || []), newComment];
      setPost({ ...post, comments: updatedComments });
      setComment('');

      // Update in storage
      await LocalStorage.addComment(post.id, user.id, user.displayName, comment);
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
      // Revert optimistic update on error
      fetchPost();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
      keyboardVerticalOffset={100}
    >
      <View style={styles.postContent}>
        <View style={[styles.postContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.postHeader}>
            <View style={styles.postUser}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>
                  {post.displayName ? post.displayName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
              <View>
                <Text style={[styles.userName, { color: theme.text }]}>{post.displayName}</Text>
                <Text style={[styles.postTime, { color: theme.placeholder }]}>
                  {post.createdAt ? formatDate(post.createdAt) : 'Just now'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.postText, { color: theme.text }]}>{post.text}</Text>

          {post.imageUrl && (
            <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
          )}

          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLike}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={24}
                color={isLiked ? theme.accent : theme.text}
              />
              <Text style={[styles.actionText, { color: theme.text }]}>
                {post.likes ? post.likes.length : 0}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={22} color={theme.text} />
              <Text style={[styles.actionText, { color: theme.text }]}>
                {post.comments ? post.comments.length : 0}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.commentsHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.commentsTitle, { color: theme.text }]}>Comments</Text>
        </View>

        <FlatList
          data={post.comments || []}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item }) => <Comment comment={item} theme={theme} />}
          contentContainerStyle={styles.commentsList}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Text style={[styles.emptyCommentsText, { color: theme.placeholder }]}>
                No comments yet. Be the first to comment!
              </Text>
            </View>
          }
        />
      </View>

      <View style={[styles.commentInputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TextInput
          style={[styles.commentInput, { color: theme.text, backgroundColor: theme.background }]}
          placeholder="Add a comment..."
          placeholderTextColor={theme.placeholder}
          value={comment}
          onChangeText={setComment}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: theme.primary }]}
          onPress={addComment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  postContent: {
    flex: 1,
  },
  postContainer: {
    padding: 15,
    borderBottomWidth: 1,
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
  commentsHeader: {
    padding: 15,
    borderBottomWidth: 1,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentsList: {
    padding: 15,
  },
  commentContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentUserName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    marginLeft: 40,
  },
  emptyComments: {
    padding: 20,
    alignItems: 'center',
  },
  emptyCommentsText: {
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PostDetailScreen;
