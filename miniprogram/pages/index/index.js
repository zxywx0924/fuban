// index.js
// 引入云函数API
const cloudApi = require('../../utils/cloudApi.js');

Page({
  data: {
    messages: [],
    inputText: '',
    isRecording: false,
    lastMessageId: '',
    hasNewMessages: false,
    hasNewReminders: false
  },
  
  onLoad: function() {
    // 初始化录音管理器
    this.recorderManager = wx.getRecorderManager();
    
    // 监听录音结束事件
    this.recorderManager.onStop((res) => {
      if (res.tempFilePath) {
        this.processAudioFile(res.tempFilePath);
      }
    });
    
    // 监听录音错误事件
    this.recorderManager.onError((res) => {
      console.error('录音错误:', res);
      wx.showToast({
        title: '录音失败，请重试',
        icon: 'none'
      });
    });
    
    // 显示欢迎消息
    this.addMessage({
      type: 'assistant',
      content: '您好，我是您的贴心助手。您可以和我聊天或者按住下方按钮进行语音交流。'
    });
  },
  
  onShow: function() {
    // 检查是否有新消息或提醒
    this.checkForNewData();
  },
  
  // 检查是否有新数据
  checkForNewData: function() {
    const app = getApp();
    
    // 检查是否有新消息
    if (app.globalData.hasNewMessages) {
      const latestMessages = wx.getStorageSync('latest_messages') || [];
      
      if (latestMessages.length > 0) {
        // 显示最新消息
        latestMessages.forEach(msg => {
          this.addMessage({
            type: 'assistant',
            content: msg.content
          });
        });
      }
      
      // 重置标记
      app.globalData.hasNewMessages = false;
    }
    
    // 检查是否有新提醒（可以在此处处理或交给模态框处理）
    if (app.globalData.hasNewReminders) {
      app.globalData.hasNewReminders = false;
    }
  },
  
  // 以下是您已有的方法...
  onInputChange: function(e) {
    this.setData({
      inputText: e.detail.value
    });
  },
  
  sendTextMessage: function() {
    const text = this.data.inputText.trim();
    if (!text) return;
    
    // 显示用户消息
    this.addMessage({
      type: 'user',
      content: text
    });
    
    // 清空输入框
    this.setData({
      inputText: ''
    });
    
    // 显示加载状态
    this.addMessage({
      type: 'assistant',
      content: '正在思考...',
      id: 'loading'
    });
    
    // 调用云函数
    cloudApi.textChat(text)
      .then(response => {
        // 移除加载消息
        this.removeLoadingMessage();
        
        // 显示助手回复
        this.addMessage({
          type: 'assistant',
          content: response
        });
      })
      .catch(error => {
        console.error('调用失败:', error);
        
        // 移除加载消息
        this.removeLoadingMessage();
        
        // 显示错误信息
        this.addMessage({
          type: 'assistant',
          content: '抱歉，服务暂时出现问题，请稍后再试。'
        });
      });
  },
  
  removeLoadingMessage: function() {
    const messages = this.data.messages.filter(msg => msg.id !== 'loading');
    this.setData({ messages });
  },
  
  // 开始录音
  startRecording: function() {
    this.setData({
      isRecording: true
    });
    
    // 配置录音参数，严格遵循讯飞API要求
    const options = {
      duration: 60000,          // 最长录音时间，单位ms
      sampleRate: 16000,        // 采样率16k，讯飞要求
      numberOfChannels: 1,      // 单声道
      encodeBitRate: 16000,     // 16kbps
      format: 'wav',            // 音频格式
      frameSize: 50             // 指定帧大小
    };
    
    console.log("开始录音，配置:", JSON.stringify(options));
    this.recorderManager.start(options);
    
    // 监听录音结束事件
    this.recorderManager.onStop((res) => {
      console.log("录音完成，文件路径:", res.tempFilePath);
      if (res.tempFilePath) {
        this.processAudioFile(res.tempFilePath);
      }
    });
  },
  
  stopRecording: function() {
    if (this.data.isRecording) {
      this.setData({
        isRecording: false
      });
      this.recorderManager.stop();
    }
  },
  
  processAudioFile: function(filePath) {
    // 显示加载提示
    wx.showLoading({
      title: '正在处理语音...'
    });
    
    console.log("开始处理音频文件:", filePath);
    
    // 读取文件并转为Base64
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => {
        const base64Audio = res.data;
        console.log("音频转换为Base64完成，长度:", base64Audio.length);
        
        if (base64Audio.length < 100) {
          wx.hideLoading();
          console.error("音频数据异常，长度过短:", base64Audio.length);
          wx.showToast({
            title: '录音数据异常，请重试',
            icon: 'none'
          });
          return;
        }
        
        // 调用云函数
        wx.cloud.callFunction({
          name: 'speechToText',
          data: { base64Audio },
          success: (res) => {
            wx.hideLoading();
            console.log("语音识别结果:", res.result);
            
            if (res.result && res.result.success) {
              // 识别成功，进一步处理
              this.handleSpeechRecognitionResult(res.result.result);
            } else {
              console.error("语音识别返回错误:", res.result?.error || "未知错误");
              wx.showToast({
                title: '语音识别失败，请重试',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            wx.hideLoading();
            console.error("调用语音识别云函数失败:", err);
            wx.showToast({
              title: '语音处理失败，请重试',
              icon: 'none'
            });
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error("读取音频文件失败:", err);
        wx.showToast({
          title: '读取录音失败',
          icon: 'none'
        });
      }
    });
  },
  
  handleSpeechRecognitionResult: function(recognizedText) {
    if (!recognizedText || recognizedText.trim() === "") {
      wx.showToast({
        title: '未能识别您的语音，请重试',
        icon: 'none'
      });
      return;
    }
    
    // 显示识别的文本
    this.addMessage({
      type: 'user',
      content: recognizedText
    });
    
    // 显示加载状态
    this.addMessage({
      type: 'assistant',
      content: '正在思考...',
      id: 'loading'
    });
    
    // 调用文本聊天API
    const cloudApi = require('../../utils/cloudApi.js');
    cloudApi.textChat(recognizedText)
      .then(response => {
        // 移除加载消息
        this.removeLoadingMessage();
        
        // 显示助手回复
        this.addMessage({
          type: 'assistant',
          content: response
        });
      })
      .catch(error => {
        console.error('调用文本聊天API失败:', error);
        
        // 移除加载消息
        this.removeLoadingMessage();
        
        // 显示错误信息
        this.addMessage({
          type: 'assistant',
          content: '抱歉，我现在无法回应，请稍后再试。'
        });
      });
  },
  
  addMessage: function(message) {
    const messages = this.data.messages;
    const id = message.id || Date.now();
    messages.push({
      id: id,
      ...message
    });
    
    this.setData({
      messages: messages,
      lastMessageId: `msg-${id}`
    });
  },
  
  // 设置提醒（示例）
  setReminder: function() {
    wx.showModal({
      title: '设置提醒',
      content: '您想要设置什么提醒？',
      editable: true,
      placeholderText: '比如：明天上午9点吃药',
      success: (res) => {
        if (res.confirm && res.content) {
          // 这里需要解析用户输入的时间
          // 为了简单起见，这里设置为5分钟后
          const remindTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
          
          cloudApi.setReminder({
            content: res.content,
            remindTime: remindTime
          })
          .then(() => {
            wx.showToast({
              title: '提醒设置成功',
              icon: 'success'
            });
          })
          .catch(error => {
            console.error('设置提醒失败:', error);
            wx.showToast({
              title: '设置提醒失败',
              icon: 'none'
            });
          });
        }
      }
    });
  }
});