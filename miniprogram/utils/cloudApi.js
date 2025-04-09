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

module.exports = {
  textChat,
  speechChat
};