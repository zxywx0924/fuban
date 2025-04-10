// sendBackgroundData/index.js
const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('收到发送后台数据请求:', event);
  const wxContext = cloud.getWXContext();
  
  try {
    // 获取数据
    const { data } = event;
    
    if (!data) {
      return {
        success: false,
        error: '未提供数据'
      };
    }
    
    // 调用微信后台获取数据能力
    const result = await cloud.openapi.cloudbase.sendBackgroundFetchData({
      env: cloud.DYNAMIC_CURRENT_ENV,
      openid: event.openid || wxContext.OPENID,
      dataType: 'GetPassThroughInfo',
      data: JSON.stringify(data)
    });
    
    console.log('发送后台数据成功:', result);
    
    return {
      success: true,
      result: result
    };
  } catch (error) {
    console.error('发送后台数据失败:', error);
    
    // 返回详细错误信息
    return {
      success: false,
      error: error.message || '发送后台数据失败',
      details: error.stack || '无详细信息'
    };
  }
};