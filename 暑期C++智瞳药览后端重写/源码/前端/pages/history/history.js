Page({
  data: {
    historyList: [],
    hasHistory: false
  },

  onLoad() {
    this.loadHistory();
  },

  onShow() {                    
    this.loadHistory();
  },

  loadHistory() {
    const history = wx.getStorageSync('history') || [];
    const formattedHistory = history.map(item => {
      const medicineName = item.medicine_name || {};
      const name = medicineName['通用名称'] || medicineName['商品名'] || medicineName['通用名'] || '';
      return {
        ...item,
        medicine: {
          name: name,
          brand: medicineName['商品名'] || medicineName['商品名称'] || ''
        }
      };
    });
    this.setData({
      historyList: formattedHistory,
      hasHistory: formattedHistory.length > 0
    });
  },

  // 跳转到历史详情页
  goToHistoryDetail(e) {
    const index = e.currentTarget.dataset.index;
    const historyItem = this.data.historyList[index];
    wx.navigateTo({
      url: `/pages/history-detail/history-detail?historyData=${encodeURIComponent(JSON.stringify(historyItem))}`
    });
  },

  // 返回主页
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  }
});