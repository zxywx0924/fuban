// getLatestMessages/index.js
const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 初始化数据库
const db = cloud.database();

// 如果数据集合不存在，创建它们
async function ensureCollectionsExist() {
  try {
    // 获取全部集合
    const collections = await db.listCollections().get();
    const collectionNames = collections.data.map(item => item.name);
    
    // 检查并创建 messages 集合
    if (!collectionNames.includes('messages')) {
      await db.createCollection('messages');
      console.log('创建 messages 集合成功');
    }
    
    // 检查并创建 reminders 集合
    if (!collectionNames.includes('reminders')) {
      await db.createCollection('reminders');
      console.log('创建 reminders 集合成功');
    }
  } catch (error) {
    console.error('确保集合存在时出错:', error);
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  // 确保集合存在
  await ensureCollectionsExist();
  
  try {
    // 获取用户的最新消息
    const messagesQuery = await db.collection('messages')
      .where({
        openid: wxContext.OPENID,
        read: false // 未读消息
      })
      .orderBy('createTime', 'desc')
      .limit(10)
      .get();
    
    // 获取用户的最新提醒
    const remindersQuery = await db.collection('reminders')
      .where({
        openid: wxContext.OPENID,
        notified: false, // 未通知的提醒
        remindTime: db.command.lte(new Date()) // 已到提醒时间
      })
      .orderBy('remindTime', 'desc')
      .limit(5)
      .get();
    
    return {
      success: true,
      messages: messagesQuery.data,
      reminders: remindersQuery.data
    };
  } catch (error) {
    console.error('获取最新数据失败:', error);
    return {
      success: false,
      error: error.message || '获取数据失败',
      details: error.stack || '无详细信息'
    };
  }
};