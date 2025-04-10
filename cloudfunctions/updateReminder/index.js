// updateReminder/index.js
const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 初始化数据库
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  try {
    const { reminderId, notified } = event;
    
    if (!reminderId) {
      return {
        success: false,
        error: '提醒ID不能为空'
      };
    }
    
    // 更新提醒状态
    await db.collection('reminders').doc(reminderId).update({
      data: {
        notified: notified === undefined ? true : notified,
        updateTime: new Date()
      }
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('更新提醒状态失败:', error);
    return {
      success: false,
      error: error.message || '更新提醒状态失败'
    };
  }
};