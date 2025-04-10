// app.js
App({
  onLaunch: function() {
    // 初始化云环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-3g9gid8a71e3770d', // 替换为您的云环境ID
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
  }
});