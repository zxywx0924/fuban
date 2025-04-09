// app.js
App({
  onLaunch: function() {
    // 初始化云环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-3g9gid8a71e3770d', // 替换为您的云环境ID，在云开发控制台查看
        traceUser: true,
      });
    }
    
    // 初始化全局数据
    this.globalData = {
      userInfo: null
    };
    
    // 获取系统信息
    wx.getSystemInfo({
      success: e => {
        this.globalData.StatusBar = e.statusBarHeight;
        this.globalData.screenHeight = e.windowHeight;
        this.globalData.screenWidth = e.windowWidth;
        
        // 适配不同尺寸的设备
        let capsule = wx.getMenuButtonBoundingClientRect();
        if (capsule) {
          this.globalData.Custom = capsule;
          this.globalData.CustomBar = capsule.bottom + capsule.top - e.statusBarHeight;
        } else {
          this.globalData.CustomBar = e.statusBarHeight + 50;
        }
      }
    });
  },
  
  // 保存聊天记录
  saveConversation: function(messages) {
    try {
      wx.setStorageSync('chat_history', messages);
    } catch (e) {
      console.error('保存聊天记录失败:', e);
    }
  },
  
  // 获取聊天记录
  getConversation: function() {
    try {
      return wx.getStorageSync('chat_history') || [];
    } catch (e) {
      console.error('获取聊天记录失败:', e);
      return [];
    }
  },
  
  // 清除聊天记录
  clearConversation: function() {
    try {
      wx.removeStorageSync('chat_history');
      return true;
    } catch (e) {
      console.error('清除聊天记录失败:', e);
      return false;
    }
  },
  
  // 全局错误处理
  onError: function(err) {
    // 记录错误日志
    console.error('小程序全局错误:', err);
    
    // 可以在这里添加错误上报逻辑
  },
  
  // 检查更新
  checkUpdate: function() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate(function(res) {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function() {
            wx.showModal({
              title: '更新提示',
              content: '新版本已准备好，是否重启应用？',
              success: function(res) {
                if (res.confirm) {
                  updateManager.applyUpdate();
                }
              }
            });
          });
          
          updateManager.onUpdateFailed(function() {
            wx.showModal({
              title: '更新提示',
              content: '新版本下载失败，请稍后再试'
            });
          });
        }
      });
    }
  },
  
  // 文本转语音（可根据需要添加）
  textToSpeech: function(text) {
    return new Promise((resolve, reject) => {
      // 使用内置的语音合成接口
      const innerAudioContext = wx.createInnerAudioContext();
      
      // 将文本转为语音URL（可以使用云函数或第三方接口）
      // 这里使用微信自带的语音合成能力
      wx.request({
        url: 'https://api.example.com/tts', // 替换为实际的TTS API
        data: {
          text: text,
          voice: 'female', // 女声
          speed: 0.8 // 稍慢的语速，适合老年人
        },
        success: (res) => {
          // 假设API返回了音频的URL
          const audioUrl = res.data.audioUrl;
          innerAudioContext.src = audioUrl;
          
          innerAudioContext.onPlay(() => {
            console.log('语音播放开始');
          });
          
          innerAudioContext.onEnded(() => {
            console.log('语音播放结束');
            resolve();
          });
          
          innerAudioContext.onError((err) => {
            console.error('语音播放错误:', err);
            reject(err);
          });
          
          innerAudioContext.play();
        },
        fail: reject
      });
    });
  },
  
  // 获取用户信息函数
  getUserProfile: function() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          this.globalData.userInfo = res.userInfo;
          resolve(res.userInfo);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
});