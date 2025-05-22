import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { useTheme } from '../utils/ThemeContext';

/**
 * Màn hình đăng nhập
 */
const LoginScreen = ({ navigation }) => {
  // State để lưu trữ thông tin đăng nhập
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lấy hàm đăng nhập từ AuthContext
  const { login } = useAuth();
  // Lấy chủ đề hiện tại từ ThemeContext
  const { theme } = useTheme();

  /**
   * Xử lý đăng nhập
   */
  const handleLogin = async () => {
    // Kiểm tra các trường đã được nhập đầy đủ chưa
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Vui lòng nhập đúng định dạng email');
      return;
    }

    setLoading(true);

    try {
      // Gọi hàm đăng nhập từ AuthContext
      await login(email, password);
      // Việc điều hướng sẽ được xử lý bởi AuthContext
    } catch (error) {
      // Xử lý các lỗi đăng nhập
      let errorMessage = 'Đã xảy ra lỗi trong quá trình đăng nhập';

      if (error.message.includes('user-not-found') || error.message.includes('User not found') || error.message.includes('Không tìm thấy người dùng')) {
        errorMessage = 'Không tìm thấy người dùng. Vui lòng kiểm tra email hoặc đăng ký tài khoản mới.';
      } else if (error.message.includes('wrong-password') || error.message.includes('Incorrect password') || error.message.includes('Mật khẩu không chính xác')) {
        errorMessage = 'Mật khẩu không chính xác. Vui lòng thử lại.';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Định dạng email không hợp lệ.';
      } else if (error.message.includes('too-many-requests')) {
        errorMessage = 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.';
      }

      Alert.alert('Đăng nhập thất bại', errorMessage);
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
        {/* Phần tiêu đề */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Social App</Text>
          <Text style={[styles.subtitle, { color: theme.placeholder }]}>Kết nối với bạn bè và chia sẻ khoảnh khắc</Text>
        </View>

        {/* Form đăng nhập */}
        <View style={styles.form}>
          {/* Trường nhập email */}
          <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="mail-outline" size={20} color={theme.placeholder} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email"
              placeholderTextColor={theme.placeholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Trường nhập mật khẩu */}
          <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.placeholder} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Mật khẩu"
              placeholderTextColor={theme.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            {/* Nút hiển thị/ẩn mật khẩu */}
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={theme.placeholder}
              />
            </TouchableOpacity>
          </View>

          {/* Nút đăng nhập */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Text>
          </TouchableOpacity>
          
          {/* Phần footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.placeholder }]}>
              Chưa có tài khoản?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>
                Đăng ký
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Định nghĩa styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
  },
  passwordToggle: {
    padding: 10,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    marginRight: 5,
  },
  footerLink: {
    fontWeight: 'bold',
  },
});

export default LoginScreen;
