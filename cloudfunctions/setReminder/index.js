// setReminder/index.js
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
    // 获取提醒内容
    const { reminder } = event;
    
    if (!reminder || !reminder.content || !reminder.remindTime) {
      return {
        success: false,
        error: '提醒内容或时间不能为空'
      };
    }
    
    // 保存提醒到数据库
    const result = await db.collection('reminders').add({
      data: {
        openid: wxContext.OPENID,
        content: reminder.content,
        remindTime: new Date(reminder.remindTime),
        createTime: new Date(),
        notified: false
      }
    });
    
    return {
      success: true,
      reminderId: result._id
    };
  } catch (error) {
    console.error('设置提醒失败:', error);
    return {
      success: false,
      error: error.message || '设置提醒失败',
      details: error.stack || '无详细信息'
    };
  }
};