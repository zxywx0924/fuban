// 后台数据处理模块

const BackgroundFetchHandler = {
  // 初始化
  init() {
    console.log('初始化后台数据处理...');
    
    try {
      // 检查API是否可用
      if (wx.canIUse('getBackgroundFetchData')) {
        console.log('支持后台获取数据功能');
        
        // 注册事件监听（在合适的场景）
        if (wx.canIUse('onBackgroundFetchData')) {
          wx.onBackgroundFetchData(this.handleBackgroundData);
          console.log('已注册后台数据监听');
        }
        
        return true;
      } else {
        console.log('当前环境不支持后台数据获取功能');
        return false;
      }
    } catch (error) {
      console.error('初始化后台数据处理失败:', error);
      return false;
    }
  },
  
  // 处理后台数据
  handleBackgroundData(res) {
    console.log('收到后台数据:', res);
    
    try {
      // 处理数据
      if (res && res.fetchType === 'periodic') {
        console.log('收到周期性数据');
        // 处理周期性数据
      } else if (res && res.fetchType === 'pre') {
        console.log('收到预拉取数据');
        // 处理预拉取数据
      }
      
      // 解析数据内容
      if (res && res.fetchedData) {
        const data = typeof res.fetchedData === 'string' ? 
          JSON.parse(res.fetchedData) : res.fetchedData;
          
        console.log('解析后的数据:', data);
        
        // 存储数据以便页面使用
        wx.setStorageSync('background_data', data);
      }
    } catch (error) {
      console.error('处理后台数据失败:', error);
    }
  },
  
  // 在小程序启动或前台时尝试获取数据
  fetchData() {
    return new Promise((resolve, reject) => {
      // 确认API可用
      if (!wx.canIUse('getBackgroundFetchData')) {
        reject('当前环境不支持后台数据获取功能');
        return;
      }
      
      // 获取数据
      wx.getBackgroundFetchData({
        fetchType: 'periodic', // 可以是 'periodic' 或 'pre'
        success: (res) => {
          console.log('获取后台数据成功:', res);
          resolve(res);
        },
        fail: (err) => {
          console.error('获取后台数据失败:', err);
          reject(err);
        }
      });
    });
  }
};

module.exports = BackgroundFetchHandler;