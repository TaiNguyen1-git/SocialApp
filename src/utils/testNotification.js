import * as LocalStorage from '../services/localStorage';

/**
 * Test function để debug notification system
 */
export const testNotificationSystem = async () => {
  try {
    console.log('=== TESTING NOTIFICATION SYSTEM ===');
    
    // 1. Test tạo notification trực tiếp
    console.log('1. Testing direct notification creation...');
    await LocalStorage.addNotification(
      '2', // userId của người nhận
      'test',
      'Test notification message',
      { testData: 'test' }
    );
    
    // 2. Kiểm tra notifications đã được lưu
    console.log('2. Checking saved notifications...');
    const notifications = await LocalStorage.getNotifications('2');
    console.log('Notifications for user 2:', notifications);
    
    // 3. Test comment với reply
    console.log('3. Testing comment with reply...');
    
    // Lấy posts hiện tại
    const posts = await LocalStorage.getPosts();
    console.log('Current posts:', posts.length);
    
    if (posts.length > 0) {
      const firstPost = posts[0];
      console.log('First post:', firstPost.id, 'by user:', firstPost.userId);
      console.log('Comments:', firstPost.comments?.length || 0);
      
      if (firstPost.comments && firstPost.comments.length > 0) {
        const firstComment = firstPost.comments[0];
        console.log('First comment:', firstComment.id, 'by user:', firstComment.userId);
        
        // Test reply to this comment
        console.log('4. Testing reply to comment...');
        await LocalStorage.addComment(
          firstPost.id,
          '1', // User 1 replies
          'Test User',
          'This is a test reply',
          firstComment.id // Reply to first comment
        );
        
        // Check notifications again
        console.log('5. Checking notifications after reply...');
        const notificationsAfter = await LocalStorage.getNotifications(firstComment.userId);
        console.log('Notifications for comment owner:', notificationsAfter);
      }
    }
    
    console.log('=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

export default testNotificationSystem;
