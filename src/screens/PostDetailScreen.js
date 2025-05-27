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
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { useTheme } from '../utils/ThemeContext';
import { useNotifications } from '../utils/NotificationContext';
import * as LocalStorage from '../services/localStorage';
import { Vibration } from 'react-native';

// ==================== COMMENT COMPONENT ====================
const Comment = ({ comment, theme, onReply, currentUserId, isExpanded, onToggleExpand, highlightCommentId, highlightReplyId }) => {
  const [showReplies, setShowReplies] = useState(isExpanded || false);

  // Sync với isExpanded prop từ parent
  useEffect(() => {
    if (isExpanded) {
      setShowReplies(true);
    }
  }, [isExpanded]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const toggleReplies = () => {
    const newShowReplies = !showReplies;
    setShowReplies(newShowReplies);
    if (onToggleExpand) {
      onToggleExpand(comment.id, newShowReplies);
    }
  };

  // Kiểm tra xem comment hoặc reply có được highlight không
  const isCommentHighlighted = highlightCommentId === comment.id;
  const getReplyHighlightStyle = (replyId) => {
    return highlightReplyId === replyId ? { backgroundColor: theme.accent + '20' } : {};
  };

  return (
    <View style={[
      styles.commentContainer,
      { borderColor: theme.border },
      isCommentHighlighted && { backgroundColor: theme.accent + '20' }
    ]}>
      <View style={styles.commentHeader}>
        <View style={[styles.commentAvatar, { backgroundColor: theme.primary }]}>
          <Text style={styles.commentAvatarText}>
            {comment.displayName ? comment.displayName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.commentInfo}>
          <Text style={[styles.commentUserName, { color: theme.text }]}>{comment.displayName}</Text>
          <Text style={[styles.commentTime, { color: theme.placeholder }]}>
            {comment.createdAt ? formatDate(comment.createdAt) : 'Vừa xong'}
          </Text>
        </View>
      </View>

      <Text style={[styles.commentText, { color: theme.text }]}>{comment.text}</Text>

      {/* Comment actions */}
      <View style={styles.commentActions}>
        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => onReply(comment)}
        >
          <Ionicons name="chatbubble-outline" size={14} color={theme.placeholder} />
          <Text style={[styles.replyButtonText, { color: theme.placeholder }]}>
            Trả lời
          </Text>
        </TouchableOpacity>

        {comment.replies && comment.replies.length > 0 && (
          <TouchableOpacity
            style={styles.showRepliesButton}
            onPress={toggleReplies}
          >
            <Text style={[styles.showRepliesText, { color: theme.primary }]}>
              {showReplies ? 'Ẩn' : 'Xem'} {comment.replies.length} phản hồi
            </Text>
            <Ionicons
              name={showReplies ? "chevron-up" : "chevron-down"}
              size={14}
              color={theme.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <View key={reply.id} style={[
              styles.replyItem,
              { borderLeftColor: theme.border },
              getReplyHighlightStyle(reply.id)
            ]}>
              <View style={styles.replyHeader}>
                <View style={[styles.replyAvatar, { backgroundColor: theme.accent }]}>
                  <Text style={styles.replyAvatarText}>
                    {reply.displayName ? reply.displayName.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
                <View style={styles.replyInfo}>
                  <Text style={[styles.replyUserName, { color: theme.text }]}>{reply.displayName}</Text>
                  <Text style={[styles.replyTime, { color: theme.placeholder }]}>
                    {reply.createdAt ? formatDate(reply.createdAt) : 'Vừa xong'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.replyText, { color: theme.text }]}>{reply.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ==================== MAIN COMPONENT ====================

const PostDetailScreen = ({ route }) => {
  const { post: initialPost, highlightCommentId, highlightReplyId } = route.params;

  // ==================== STATE MANAGEMENT ====================
  const [post, setPost] = useState(initialPost);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedComments, setExpandedComments] = useState(new Set());

  // ==================== HOOKS ====================
  const { user } = useAuth();
  const { theme } = useTheme();
  const { refreshNotifications } = useNotifications();

  // ==================== COMPUTED VALUES ====================
  const isLiked = post.likes && post.likes.includes(user?.id);

  // ==================== UTILITY FUNCTIONS ====================
  const getTotalCommentCount = (comments) => {
    if (!comments || comments.length === 0) return 0;

    let total = comments.length; // Đếm comment gốc

    // Đếm thêm replies
    comments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        total += comment.replies.length;
      }
    });

    return total;
  };

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (highlightCommentId) {
      setExpandedComments(prev => new Set([...prev, highlightCommentId]));
    }
  }, [highlightCommentId]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // ==================== DATA FUNCTIONS ====================

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

  // ==================== INTERACTION HANDLERS ====================

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

  // Add comment or reply
  const addComment = async () => {
    if (!comment.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung bình luận');
      return;
    }

    setLoading(true);

    try {
      // Vibrate when adding comment/reply
      Vibration.vibrate(30);

      // Update in storage first
      await LocalStorage.addComment(
        post.id,
        user.id,
        user.displayName,
        comment,
        replyingTo?.id || null
      );

      // Refresh post data to get updated comments
      await fetchPost();

      // Refresh notifications để cập nhật badge
      refreshNotifications();

      setComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Lỗi', 'Không thể thêm bình luận. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reply to comment
  const handleReply = (comment) => {
    setReplyingTo(comment);
    setComment(`@${comment.displayName} `);
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
    setComment('');
  };

  // Handle toggle expand comment
  const handleToggleExpand = (commentId, isExpanded) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (isExpanded) {
        newSet.add(commentId);
      } else {
        newSet.delete(commentId);
      }
      return newSet;
    });
  };

  // ==================== RENDER ====================

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: theme.background }]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 120}
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

          <Text style={[styles.postText, { color: theme.text, marginBottom: post.imageUrl ? 10 : 0 }]}>{post.text}</Text>

          {post.imageUrl && (
            <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
          )}

          <View style={[
            styles.postActions,
            { marginTop: post.imageUrl ? 5 : 0 }
          ]}>
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
                {getTotalCommentCount(post.comments)}
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
          renderItem={({ item }) => (
            <Comment
              comment={item}
              theme={theme}
              onReply={handleReply}
              currentUserId={user?.id}
              isExpanded={expandedComments.has(item.id)}
              onToggleExpand={handleToggleExpand}
              highlightCommentId={highlightCommentId}
              highlightReplyId={highlightReplyId}
            />
          )}
          contentContainerStyle={styles.commentsList}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Text style={[styles.emptyCommentsText, { color: theme.placeholder }]}>
                Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
              </Text>
            </View>
          }
        />
      </View>

      {/* Reply indicator */}
      {replyingTo && (
        <View style={[styles.replyIndicator, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <Text style={[styles.replyIndicatorText, { color: theme.text }]}>
            Đang trả lời {replyingTo.displayName}
          </Text>
          <TouchableOpacity onPress={cancelReply}>
            <Ionicons name="close" size={20} color={theme.placeholder} />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.commentInputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TextInput
          style={[styles.commentInput, { color: theme.text, backgroundColor: theme.background }]}
          placeholder={replyingTo ? `Trả lời ${replyingTo.displayName}...` : "Thêm bình luận..."}
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
    </SafeAreaView>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
    marginBottom: 5,
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
    // marginBottom được xử lý động trong component dựa trên việc có ảnh hay không
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 0, // Loại bỏ khoảng cách dưới ảnh
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 5, // Giảm padding phía trên
    marginTop: 5, // Thêm margin nhỏ phía trên
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
  commentInfo: {
    flex: 1,
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
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 40,
    marginTop: 4,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  replyButtonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  showRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  showRepliesText: {
    fontSize: 12,
    marginRight: 4,
    fontWeight: 'bold',
  },
  repliesContainer: {
    marginLeft: 40,
    marginTop: 8,
  },
  replyItem: {
    borderLeftWidth: 2,
    paddingLeft: 12,
    marginBottom: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  replyAvatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  replyInfo: {
    flex: 1,
  },
  replyUserName: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  replyTime: {
    fontSize: 10,
  },
  replyText: {
    fontSize: 12,
    marginLeft: 32,
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  replyIndicatorText: {
    fontSize: 14,
    fontStyle: 'italic',
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
    paddingBottom: Platform.OS === 'android' ? 20 : 10, // Thêm padding bottom cho Android
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
