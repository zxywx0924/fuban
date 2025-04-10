// utils/cloudApi.js

// 调用文本聊天API
const textChat = (prompt) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'textChat',
      data: { prompt },
      success: res => {
        if (res.result && res.result.success) {
          resolve(res.result.result);
        } else {
          reject(new Error(res.result.error || '请求失败'));
        }
      },
      fail: err => {
        reject(err);
      }
    });
  });
};

// 调用语音聊天API
const speechChat = (base64Audio) => {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '语音识别中...' });
    
    wx.cloud.callFunction({
      name: 'speechChat',
      data: { base64Audio },
      success: res => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          resolve({
            recognizedText: res.result.recognizedText,
            llmResponse: res.result.llmResponse
          });
        } else {
          reject(new Error(res.result.error || '处理失败'));
        }
      },
      fail: err => {
        wx.hideLoading();
        reject(err);
      }
    });
  });
};

// 使用轮询方式获取数据（替代后台获取）
const pollForNewMessages = () => {
  return new Promise((resolve, reject) => {
    try {
      wx.cloud.callFunction({
        name: 'getLatestMessages',
        data: {},
        success: res => {
          if (res && res.result && res.result.success) {
            resolve(res.result);
          } else if (res && res.result) {
            reject(new Error(res.result.error || '获取消息失败'));
          } else {
            // 如果 res 或 res.result 为空
            resolve({ messages: [], reminders: [] });
          }
        },
        fail: err => {
          console.error('云函数调用失败:', err);
          // 为了不中断应用流程，在云函数调用失败时返回空结果
          resolve({ messages: [], reminders: [] });
        }
      });
    } catch (error) {
      console.error('pollForNewMessages 执行异常:', error);
      // 返回空结果，避免应用崩溃
      resolve({ messages: [], reminders: [] });
    }
  });
};

// 设置提醒
const setReminder = (reminder) => {
  return new Promise((resolve, reject) => {
    try {
      wx.cloud.callFunction({
        name: 'setReminder',
        data: { reminder },
        success: res => {
          if (res.result && res.result.success) {
            resolve(res.result);
          } else {
            reject(new Error(res.result.error || '设置提醒失败'));
          }
        },
        fail: err => {
          reject(err);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  textChat,
  speechChat,
  pollForNewMessages,
  setReminder
};