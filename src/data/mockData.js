import AsyncStorage from '@react-native-async-storage/async-storage';

// Các khóa để lưu trữ dữ liệu trong AsyncStorage
const USERS_KEY = '@SocialApp:users';
const CURRENT_USER_KEY = '@SocialApp:currentUser';
const POSTS_KEY = '@SocialApp:posts';

// Dữ liệu mẫu cho người dùng
const sampleUsers = [
  {
    id: '1',
    email: 'john@example.com',
    password: 'password123', // Trong ứng dụng thực tế, mật khẩu nên được mã hóa
    displayName: 'John Doe',
    avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    createdAt: new Date(2023, 0, 15).toISOString()
  },
  {
    id: '2',
    email: 'jane@example.com',
    password: 'password123',
    displayName: 'Jane Smith',
    avatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
    createdAt: new Date(2023, 1, 20).toISOString()
  },
  {
    id: '3',
    email: 'bob@example.com',
    password: 'password123',
    displayName: 'Bob Johnson',
    avatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
    createdAt: new Date(2023, 2, 10).toISOString()
  },
  {
    id: '4',
    email: 'alice@example.com',
    password: 'password123',
    displayName: 'Alice Williams',
    avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
    createdAt: new Date(2023, 3, 5).toISOString()
  },
  {
    id: '5',
    email: 'demo@example.com',
    password: 'demo123',
    displayName: 'Demo User',
    avatarUrl: 'https://randomuser.me/api/portraits/lego/1.jpg',
    createdAt: new Date(2023, 4, 1).toISOString()
  }
];

// Dữ liệu mẫu cho bài đăng
const samplePosts = [
  {
    id: '1',
    userId: '1',
    displayName: 'John Doe',
    text: 'Just finished a great book! Would highly recommend "The Alchemist" by Paulo Coelho. #reading #books',
    imageUrl: 'https://source.unsplash.com/random/800x600/?book',
    likes: ['2', '3', '4'],
    comments: [
      {
        id: '101',
        userId: '2',
        displayName: 'Jane Smith',
        text: 'I loved that book too! So inspiring.',
        createdAt: new Date(2023, 5, 10, 14, 30).toISOString()
      },
      {
        id: '102',
        userId: '4',
        displayName: 'Alice Williams',
        text: 'Adding it to my reading list!',
        createdAt: new Date(2023, 5, 10, 15, 45).toISOString()
      }
    ],
    createdAt: new Date(2023, 5, 10, 12, 0).toISOString()
  },
  {
    id: '2',
    userId: '2',
    displayName: 'Jane Smith',
    text: 'Beautiful sunset at the beach today! 🌅 #nature #sunset #beach',
    imageUrl: 'https://source.unsplash.com/random/800x600/?sunset,beach',
    likes: ['1', '3', '5'],
    comments: [
      {
        id: '201',
        userId: '3',
        displayName: 'Bob Johnson',
        text: 'Wow, stunning view!',
        createdAt: new Date(2023, 5, 11, 9, 15).toISOString()
      }
    ],
    createdAt: new Date(2023, 5, 11, 8, 0).toISOString()
  },
  {
    id: '3',
    userId: '3',
    displayName: 'Bob Johnson',
    text: 'Just got a new puppy! Meet Max 🐶 #pets #dogs #puppy',
    imageUrl: 'https://source.unsplash.com/random/800x600/?puppy',
    likes: ['1', '2', '4', '5'],
    comments: [
      {
        id: '301',
        userId: '1',
        displayName: 'John Doe',
        text: 'So cute! What breed is he?',
        createdAt: new Date(2023, 5, 12, 11, 30).toISOString()
      },
      {
        id: '302',
        userId: '2',
        displayName: 'Jane Smith',
        text: 'Adorable! 😍',
        createdAt: new Date(2023, 5, 12, 12, 45).toISOString()
      },
      {
        id: '303',
        userId: '5',
        displayName: 'Demo User',
        text: 'Welcome to the family, Max!',
        createdAt: new Date(2023, 5, 12, 14, 20).toISOString()
      }
    ],
    createdAt: new Date(2023, 5, 12, 10, 0).toISOString()
  },
  {
    id: '4',
    userId: '4',
    displayName: 'Alice Williams',
    text: 'Just completed my first marathon! 🏃‍♀️ #running #fitness #achievement',
    imageUrl: 'https://source.unsplash.com/random/800x600/?marathon',
    likes: ['1', '3', '5'],
    comments: [
      {
        id: '401',
        userId: '5',
        displayName: 'Demo User',
        text: 'Congratulations! That\'s a huge accomplishment!',
        createdAt: new Date(2023, 5, 13, 16, 10).toISOString()
      },
      {
        id: '402',
        userId: '1',
        displayName: 'John Doe',
        text: 'Amazing! How long did you train for?',
        createdAt: new Date(2023, 5, 13, 17, 30).toISOString()
      }
    ],
    createdAt: new Date(2023, 5, 13, 15, 0).toISOString()
  },
  {
    id: '5',
    userId: '5',
    displayName: 'Demo User',
    text: 'Trying out a new recipe today - homemade pizza! 🍕 #cooking #food #pizza',
    imageUrl: 'https://source.unsplash.com/random/800x600/?pizza',
    likes: ['2', '4'],
    comments: [
      {
        id: '501',
        userId: '4',
        displayName: 'Alice Williams',
        text: 'Looks delicious! Care to share the recipe?',
        createdAt: new Date(2023, 5, 14, 19, 45).toISOString()
      }
    ],
    createdAt: new Date(2023, 5, 14, 18, 30).toISOString()
  }
];

// Hàm khởi tạo dữ liệu mẫu
export const initializeMockData = async () => {
  try {
    // Kiểm tra xem dữ liệu đã tồn tại chưa
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const postsJson = await AsyncStorage.getItem(POSTS_KEY);
    
    // Chỉ khởi tạo nếu dữ liệu chưa tồn tại
    if (!usersJson) {
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(sampleUsers));
      console.log('Đã khởi tạo dữ liệu người dùng mẫu');
    }
    
    if (!postsJson) {
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(samplePosts));
      console.log('Đã khởi tạo dữ liệu bài đăng mẫu');
    }
    
    return true;
  } catch (error) {
    console.error('Lỗi khi khởi tạo dữ liệu mẫu:', error);
    return false;
  }
};

export default {
  initializeMockData,
  sampleUsers,
  samplePosts
};
