import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../utils/AuthContext';
import { useTheme } from '../utils/ThemeContext';
import * as LocalStorage from '../services/localStorage';
import * as Firebase from '../services/firebase';

const ProfileScreen = ({ navigation }) => {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [changingAvatar, setChangingAvatar] = useState(false);
  
  const { user, useFirebase, updateAvatar } = useAuth();
  const { theme } = useTheme();
  
  // Fetch user posts
  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      let allPosts;
      
      if (useFirebase) {
        allPosts = await Firebase.getPosts();
      } else {
        allPosts = await LocalStorage.getPosts();
      }
      
      // Filter posts by user ID
      const filteredPosts = allPosts.filter(post => post.userId === user.id);
      setUserPosts(filteredPosts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchUserPosts();
  }, [useFirebase]);
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchUserPosts();
  };
  
  // Change avatar
  const changeAvatar = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to change your avatar.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setChangingAvatar(true);
        
        try {
          let avatarUrl;
          
          if (useFirebase) {
            // Upload to Firebase Storage
            const imagePath = `avatars/${user.id}`;
            avatarUrl = await Firebase.uploadImage(result.assets[0].uri, imagePath);
          } else {
            // For local storage, just use the local URI
            avatarUrl = result.assets[0].uri;
          }
          
          // Update user avatar
          await updateAvatar(avatarUrl);
          
          Alert.alert('Success', 'Avatar updated successfully!');
        } catch (error) {
          console.error('Error updating avatar:', error);
          Alert.alert('Error', 'Failed to update avatar. Please try again.');
        } finally {
          setChangingAvatar(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  // Navigate to post detail
  const navigateToPostDetail = (post) => {
    navigation.navigate('PostDetail', { post });
  };
  
  // Render post item
  const renderPostItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={[styles.postItem, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => navigateToPostDetail(item)}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
        ) : (
          <View style={[styles.postTextOnly, { backgroundColor: theme.primary }]}>
            <Text style={styles.postTextOnlyContent} numberOfLines={2}>
              {item.text}
            </Text>
          </View>
        )}
        <View style={styles.postItemFooter}>
          <View style={styles.postItemStats}>
            <Ionicons name="heart" size={16} color={theme.accent} />
            <Text style={[styles.postItemStatsText, { color: theme.text }]}>
              {item.likes ? item.likes.length : 0}
            </Text>
          </View>
          <View style={styles.postItemStats}>
            <Ionicons name="chatbubble" size={16} color={theme.primary} />
            <Text style={[styles.postItemStatsText, { color: theme.text }]}>
              {item.comments ? item.comments.length : 0}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render empty state
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={80} color={theme.placeholder} />
      <Text style={[styles.emptyText, { color: theme.text }]}>No posts yet</Text>
      <Text style={[styles.emptySubtext, { color: theme.placeholder }]}>
        Your posts will appear here
      </Text>
      <TouchableOpacity 
        style={[styles.createButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('Create')}
      >
        <Text style={styles.createButtonText}>Create Post</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.profileHeader, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.profileInfo}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={changeAvatar}
            disabled={changingAvatar}
          >
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            {changingAvatar ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="white" />
              </View>
            ) : (
              <View style={[styles.changeAvatarButton, { backgroundColor: theme.primary }]}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.userInfo}>
            <Text style={[styles.displayName, { color: theme.text }]}>{user.displayName}</Text>
            <Text style={[styles.email, { color: theme.placeholder }]}>{user.email}</Text>
          </View>
        </View>
        
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{userPosts.length}</Text>
            <Text style={[styles.statLabel, { color: theme.placeholder }]}>Posts</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.postsContainer}>
        <View style={[styles.postsHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.postsTitle, { color: theme.text }]}>My Posts</Text>
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={userPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderPostItem}
            numColumns={2}
            contentContainerStyle={styles.postsList}
            columnWrapperStyle={styles.postsRow}
            ListEmptyComponent={renderEmptyComponent}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    padding: 20,
    borderBottomWidth: 1,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  postsContainer: {
    flex: 1,
  },
  postsHeader: {
    padding: 15,
    borderBottomWidth: 1,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postsList: {
    padding: 10,
  },
  postsRow: {
    justifyContent: 'space-between',
  },
  postItem: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  postImage: {
    width: '100%',
    height: 150,
  },
  postTextOnly: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  postTextOnlyContent: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  postItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  postItemStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postItemStatsText: {
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
    marginBottom: 20,
  },
  createButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
