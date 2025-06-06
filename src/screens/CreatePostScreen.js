import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../utils/AuthContext';
import { useTheme } from '../utils/ThemeContext';
import * as LocalStorage from '../services/localStorage';

const CreatePostScreen = ({ navigation }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { theme } = useTheme();

  // Request permissions and pick image from library
  const pickImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Quyền bị từ chối', 'Chúng tôi cần quyền truy cập thư viện ảnh để tải lên hình ảnh.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn hình ảnh. Vui lòng thử lại.');
    }
  };

  // Take a photo with camera
  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Quyền bị từ chối', 'Chúng tôi cần quyền truy cập camera để chụp ảnh.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  };

  // Create post
  const createPost = async () => {
    // Validate inputs
    if (!text && !image) {
      Alert.alert('Lỗi', 'Vui lòng thêm văn bản hoặc hình ảnh vào bài đăng của bạn.');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      // Upload image if selected
      if (image) {
        // For local storage, just use the local URI
        imageUrl = image;
      }

      // Create post
      await LocalStorage.createPost(user.id, user.displayName, text, imageUrl);

      // Reset form and navigate back
      setText('');
      setImage(null);

      // Navigate to Home screen
      navigation.navigate('Home');

      // Show success message
      Alert.alert('Thành công', 'Bài đăng của bạn đã được tạo!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Lỗi', 'Không thể tạo bài đăng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Tạo bài đăng</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.textInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
            placeholder="Bạn đang nghĩ gì?"
            placeholderTextColor={theme.placeholder}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {image && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity
                style={[styles.removeImageButton, { backgroundColor: theme.error }]}
                onPress={() => setImage(null)}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={pickImage}
            >
              <Ionicons name="images-outline" size={24} color={theme.primary} />
              <Text style={[styles.imageButtonText, { color: theme.text }]}>Thư viện</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={takePhoto}
            >
              <Ionicons name="camera-outline" size={24} color={theme.primary} />
              <Text style={[styles.imageButtonText, { color: theme.text }]}>Camera</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={createPost}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Đăng bài</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 20,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    width: '48%',
  },
  imageButtonText: {
    marginLeft: 10,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreatePostScreen;
