// index.js
// 引入云函数API
const cloudApi = require('../../utils/cloudApi.js');

Page({
  data: {
    messages: [],
    inputText: '',
    isRecording: false,
    lastMessageId: ''
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
  
  // 处理文本输入变化
  onInputChange: function(e) {
    this.setData({
      inputText: e.detail.value
    });
  },
  
  // 发送文本消息
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
  
  // 移除加载消息
  removeLoadingMessage: function() {
    const messages = this.data.messages.filter(msg => msg.id !== 'loading');
    this.setData({ messages });
  },
  
  // 开始录音
  startRecording: function() {
    // 请求录音权限
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.setData({
          isRecording: true
        });
        
        const options = {
          duration: 60000, // 最长录音时间，单位ms
          sampleRate: 16000, // 采样率
          numberOfChannels: 1, // 录音通道数
          encodeBitRate: 48000, // 编码码率
          format: 'wav', // 音频格式，讯飞支持wav
          frameSize: 50 // 指定帧大小
        };
        
        this.recorderManager.start(options);
      },
      fail: () => {
        wx.showModal({
          title: '提示',
          content: '需要您的录音权限才能使用语音功能',
          confirmText: '去授权',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            }
          }
        });
      }
    });
  },
  
  // 结束录音
  stopRecording: function() {
    if (this.data.isRecording) {
      this.setData({
        isRecording: false
      });
      this.recorderManager.stop();
    }
  },
  
  // 处理录音文件
  processAudioFile: function(filePath) {
    // 显示加载提示
    wx.showLoading({
      title: '正在处理语音...'
    });
    
    // 读取文件并转为Base64
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => {
        const base64Audio = res.data;
        
        // 调用云函数
        cloudApi.speechChat(base64Audio)
          .then(result => {
            // 显示识别的文本
            if (result.recognizedText) {
              this.addMessage({
                type: 'user',
                content: result.recognizedText
              });
            }
            
            // 显示助手回复
            this.addMessage({
              type: 'assistant',
              content: result.llmResponse
            });
          })
          .catch(err => {
            console.error('语音处理失败:', err);
            wx.showToast({
              title: '语音处理失败，请重试',
              icon: 'none'
            });
          });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error(err);
        wx.showToast({
          title: '语音处理失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 添加消息到列表
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
  }
});