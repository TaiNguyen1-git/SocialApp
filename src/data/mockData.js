import AsyncStorage from '@react-native-async-storage/async-storage';

// Các khóa để lưu trữ dữ liệu trong AsyncStorage
const USERS_KEY = '@SocialApp:users';
const CURRENT_USER_KEY = '@SocialApp:currentUser';
const POSTS_KEY = '@SocialApp:posts';

// Dữ liệu mẫu cho người dùng
const sampleUsers = [
  {
    id: '1',
    email: 'minh@example.com',
    password: 'password123', // Trong ứng dụng thực tế, mật khẩu nên được mã hóa
    displayName: 'Nguyễn Văn Minh',
    avatarUrl: null,
    createdAt: new Date(2023, 0, 15).toISOString()
  },
  {
    id: '2',
    email: 'linh@example.com',
    password: 'password123',
    displayName: 'Trần Thị Linh',
    avatarUrl: null,
    createdAt: new Date(2023, 1, 20).toISOString()
  },
  {
    id: '3',
    email: 'duc@example.com',
    password: 'password123',
    displayName: 'Lê Văn Đức',
    avatarUrl: null,
    createdAt: new Date(2023, 2, 10).toISOString()
  },
  {
    id: '4',
    email: 'hoa@example.com',
    password: 'password123',
    displayName: 'Phạm Thị Hoa',
    avatarUrl: null,
    createdAt: new Date(2023, 3, 5).toISOString()
  },
  {
    id: '5',
    email: 'demo@example.com',
    password: 'demo123',
    displayName: 'Người dùng Demo',
    avatarUrl: null,
    createdAt: new Date(2023, 4, 1).toISOString()
  }
];

// Dữ liệu mẫu cho bài đăng
const samplePosts = [
  {
    id: '1',
    userId: '1',
    displayName: 'Nguyễn Văn Minh',
    text: 'Hôm nay đi thăm vịnh Hạ Long. Cảnh đẹp quá trời! 🌊 #dulich #halong #vietnam #canh_dep',
    likes: ['2', '3', '4'],
    comments: [
      {
        id: '101',
        userId: '2',
        displayName: 'Trần Thị Linh',
        text: 'Tuyệt vời quá! Mình cũng muốn đi một lần.',
        parentCommentId: null,
        replies: [
          {
            id: '101-1',
            userId: '1',
            displayName: 'Nguyễn Văn Minh',
            text: '@Trần Thị Linh Bạn nên đi vào mùa hè, thời tiết đẹp lắm!',
            parentCommentId: '101',
            replies: [],
            createdAt: new Date(2023, 5, 10, 14, 45).toISOString()
          }
        ],
        createdAt: new Date(2023, 5, 10, 14, 30).toISOString()
      },
      {
        id: '102',
        userId: '4',
        displayName: 'Phạm Thị Hoa',
        text: 'Thêm vào danh sách du lịch của mình ngay!',
        parentCommentId: null,
        replies: [],
        createdAt: new Date(2023, 5, 10, 15, 45).toISOString()
      }
    ],
    createdAt: new Date(2023, 5, 10, 12, 0).toISOString()
  },
  {
    id: '2',
    userId: '2',
    displayName: 'Trần Thị Linh',
    text: 'Hoàng hôn ở biển Nha Trang hôm nay đẹp tuyệt vời! 🌅 Kết thúc một ngày tuyệt vời. #thiennhien #hoang_hon #bien #binh_yen',
    likes: ['1', '3', '5'],
    comments: [
      {
        id: '201',
        userId: '3',
        displayName: 'Lê Văn Đức',
        text: 'Wow, nghe tuyệt vời quá! Không gì bằng một hoàng hôn đẹp.',
        parentCommentId: null,
        replies: [],
        createdAt: new Date(2023, 5, 11, 9, 15).toISOString()
      }
    ],
    createdAt: new Date(2023, 5, 11, 8, 0).toISOString()
  },
  {
    id: '3',
    userId: '3',
    displayName: 'Lê Văn Đức',
    text: 'Vừa mới nuôi thêm một chú chó con! Gặp gỡ Milo nhé 🐶 Nó đã chiếm trọn trái tim và chiếc ghế yêu thích của mình rồi. #thu_cung #cho #cho_con #thanh_vien_moi',
    likes: ['1', '2', '4', '5'],
    comments: [
      {
        id: '301',
        userId: '1',
        displayName: 'Nguyễn Văn Minh',
        text: 'Dễ thương quá! Giống gì vậy bạn?',
        parentCommentId: null,
        replies: [],
        createdAt: new Date(2023, 5, 12, 11, 30).toISOString()
      },
      {
        id: '302',
        userId: '2',
        displayName: 'Trần Thị Linh',
        text: 'Đáng yêu quá! 😍 Chó con là tuyệt nhất!',
        parentCommentId: null,
        replies: [],
        createdAt: new Date(2023, 5, 12, 12, 45).toISOString()
      },
      {
        id: '303',
        userId: '5',
        displayName: 'Người dùng Demo',
        text: 'Chào mừng Milo đến với gia đình!',
        parentCommentId: null,
        replies: [],
        createdAt: new Date(2023, 5, 12, 14, 20).toISOString()
      }
    ],
    createdAt: new Date(2023, 5, 12, 10, 0).toISOString()
  },
  {
    id: '4',
    userId: '4',
    displayName: 'Phạm Thị Hoa',
    text: 'Vừa hoàn thành cuộc chạy marathon đầu tiên! 🏃‍♀️ 42km với sự quyết tâm tuyệt đối. Cảm thấy tự hào và kiệt sức! #chay_bo #the_duc #thanh_tuu #marathon',
    likes: ['1', '3', '5'],
    comments: [
      {
        id: '401',
        userId: '5',
        displayName: 'Người dùng Demo',
        text: 'Chúc mừng! Đó là một thành tựu tuyệt vời!',
        parentCommentId: null,
        replies: [],
        createdAt: new Date(2023, 5, 13, 16, 10).toISOString()
      },
      {
        id: '402',
        userId: '1',
        displayName: 'Nguyễn Văn Minh',
        text: 'Tuyệt vời! Bạn tập luyện bao lâu vậy?',
        parentCommentId: null,
        replies: [],
        createdAt: new Date(2023, 5, 13, 17, 30).toISOString()
      }
    ],
    createdAt: new Date(2023, 5, 13, 15, 0).toISOString()
  },
  {
    id: '5',
    userId: '5',
    displayName: 'Người dùng Demo',
    text: 'Hôm nay thử làm pizza tại nhà! 🍕 Bột làm ra hoàn hảo và topping tươi từ vườn nhà. #nau_an #do_an #pizza #tu_lam',
    likes: ['2', '4'],
    comments: [
      {
        id: '501',
        userId: '4',
        displayName: 'Phạm Thị Hoa',
        text: 'Nghe ngon quá! Chia sẻ công thức được không?',
        parentCommentId: null,
        replies: [],
        createdAt: new Date(2023, 5, 14, 19, 45).toISOString()
      }
    ],
    createdAt: new Date(2023, 5, 14, 18, 30).toISOString()
  },
  {
    id: '6',
    userId: '1',
    displayName: 'Nguyễn Văn Minh',
    text: 'Buổi sáng cà phê và code ☕️ Đang làm một dự án React Native mới. Yêu cảm giác flow khi mọi thứ đều ăn khớp! #lap_trinh #reactnative #ca_phe #hieu_qua',
    likes: ['3', '5'],
    comments: [],
    createdAt: new Date(2023, 5, 15, 9, 0).toISOString()
  },
  {
    id: '7',
    userId: '2',
    displayName: 'Trần Thị Linh',
    text: 'Cuộc phiêu lưu leo núi cuối tuần! 🥾 Khám phá được một thác nước ẩn tuyệt đẹp sau 3 tiếng leo núi. Thiên nhiên luôn làm mình kinh ngạc. #leo_nui #thien_nhien #phieu_luu #cuoi_tuan',
    likes: ['1', '4'],
    comments: [
      {
        id: '701',
        userId: '1',
        displayName: 'Nguyễn Văn Minh',
        text: 'Nghe tuyệt vời quá! Chỗ này ở đâu vậy bạn?',
        parentCommentId: null,
        replies: [],
        createdAt: new Date(2023, 5, 15, 16, 20).toISOString()
      }
    ],
    createdAt: new Date(2023, 5, 15, 15, 30).toISOString()
  }
];

// Hàm khởi tạo dữ liệu mẫu
export const initializeMockData = async () => {
  try {
    // Xóa dữ liệu cũ và khởi tạo lại với dữ liệu mới
    await AsyncStorage.removeItem(USERS_KEY);
    await AsyncStorage.removeItem(POSTS_KEY);
    await AsyncStorage.removeItem(CURRENT_USER_KEY);

    // Khởi tạo dữ liệu mới
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(sampleUsers));
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(samplePosts));

    console.log('Đã khởi tạo lại dữ liệu mẫu mới');
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
