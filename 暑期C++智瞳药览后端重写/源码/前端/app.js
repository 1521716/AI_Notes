// app.js
App({
  onLaunch: function () {
    // 判断云开发是否可用
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-5g40tidu20af1ffb',
        traceUser: true,
      });
    }

    this.globalData = {};
  }
});