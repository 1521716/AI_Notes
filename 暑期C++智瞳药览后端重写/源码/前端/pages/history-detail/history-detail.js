Page({
  data: {
    medicine: {
      name: '',
      brand: ''
    },
    info: {
      indication: '',
      usage: '',
      contraindication: '',
      adverseReaction: '',
      validity: ''
    },
    oralSummary: '',
    hasInfo: false
  },

  onLoad(options) {
    if (options.historyData) {
      try {
        const decoded = decodeURIComponent(options.historyData);
        const parsed = JSON.parse(decoded);
        
        let medicine = { name: '', brand: '' };
        if (parsed.medicine) {
          medicine = parsed.medicine;
        } else if (parsed.medicine_name) {
          const medicineName = parsed.medicine_name;
          medicine = {
            name: medicineName['通用名'] || '',
            brand: medicineName['商品名'] || ''
          };
        }
        
        const rawInfo = parsed.structured_info || {};
        const info = {
          indication: rawInfo.适应症 || '',
          usage: rawInfo.用法用量 || '',
          contraindication: rawInfo.核心禁忌 || '',
          adverseReaction: rawInfo.不良反应 || '',
          validity: rawInfo.有效期 || ''
        };
        
        const hasInfo = info.indication || info.usage || info.contraindication || info.adverseReaction || info.validity;
        
        this.setData({
          medicine: medicine,
          info: info,
          oralSummary: parsed.oral_summary || '',
          hasInfo: hasInfo
        });
      } catch (err) {
        console.error('解析失败', err);
        wx.showToast({
          title: '解析失败',
          icon: 'none'
        });
      }
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
