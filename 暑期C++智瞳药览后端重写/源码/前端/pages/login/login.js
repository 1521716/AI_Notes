Page({
  data: {
    avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    nickname: '',
    //控制提示词是否显示
    showAvatarTip:true,
    // 是否同意协议，默认为false
    isAgree: false
  },

  onLoad() {
    // 检查本地是否有用户信息，有则自动填充
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        avatarUrl: userInfo.avatarUrl,
        nickname: userInfo.nickname,
        showAvatarTip: false
      });
    }
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({ 
    avatarUrl,
    showAvatarTip:false
    });
    
  },

  // 输入昵称
  onNickNameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  // 返回首页
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 切换同意状态
  toggleAgree() {
    this.setData({
      isAgree: !this.data.isAgree
    });
  },

  // 打开用户服务协议
  openUserProtocol() {
    wx.navigateTo({
      url: '/pages/protocol/user-service'
    });
  },

  // 打开隐私政策
  openPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/protocol/privacy-policy'
    });
  },

  // 登录
  doLogin(e) {
    // 从表单事件对象中获取昵称
    const { nickname } = e.detail.value;
    const { avatarUrl, isAgree } = this.data;

    // 检查是否同意协议
    if (!isAgree) {
      wx.showToast({
        title: '请先同意用户服务协议和隐私政策',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    //  进行验证
    if (!nickname || nickname.trim() === '') {
      wx.showToast({
        title: '请填写昵称',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    const userInfo = {
      nickname: nickname.trim(),
      avatarUrl: avatarUrl
    };
    wx.setStorageSync('userInfo', userInfo);
    getApp().globalData.userInfo = userInfo;

    // 跳转到主页
    wx.redirectTo({
      url: '/pages/home/home'
    });
  }
});