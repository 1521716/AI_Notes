Page({
  data: {
    hasUserInfo: false,
    userInfo: {}
  },

  onLoad() {
    this.checkUserInfo()
  },

  onShow() {
    this.checkUserInfo()
  },

  checkUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.nickname) {
      this.setData({
        hasUserInfo: true,
        userInfo: userInfo
      })
    } else {
      this.setData({
        hasUserInfo: false,
        userInfo: {}
      })
    }
  },

  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  goToCamera() {
    this.uploadAndAnalyze()
  },

  goToHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    })
  },

  async uploadAndAnalyze() {
    try {
      wx.showLoading({ title: '正在拍照...', mask: true })
      const photoPath = await this.getPhotoPath()

      wx.showLoading({ title: '分析中...', mask: true })
      const result = await this.uploadImageAndAnalyze(photoPath)

      this.saveToHistory(result)

      wx.hideLoading()

      wx.navigateTo({
        url: `/pages/result/result?resultData=${encodeURIComponent(JSON.stringify(result))}`
      })

    } catch (err) {
      wx.hideLoading()
      console.error('uploadAndAnalyze error:', err)
      wx.showToast({
        title: err.message || '操作失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  saveToHistory(result) {
    let history = wx.getStorageSync('history') || []

    let medicineName = result.medicine_name || {}
    const hasName = medicineName['通用名称'] || medicineName['商品名'] || medicineName['通用名'] || medicineName['商品名称']
    if (!hasName) {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const formattedDate = `${year}.${month}.${day}`
      medicineName['通用名称'] = formattedDate
    }

    const historyItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      medicine_name: medicineName,
      structured_info: result.structured_info,
      oral_summary: result.oral_summary
    }

    history.unshift(historyItem)

    if (history.length > 100) {
      history = history.slice(0, 100)
    }

    wx.setStorageSync('history', history)
  },

  getPhotoPath() {
    return new Promise((resolve, reject) => {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera'],
        success: (res) => {
          const tempFilePath = res.tempFiles[0].tempFilePath
          console.log('拍照成功', tempFilePath)
          resolve(tempFilePath)
        },
        fail: (err) => {
          console.error('拍照失败', err)
          reject(new Error('拍照失败，请检查权限'))
        }
      })
    })
  },

  uploadImageAndAnalyze(filePath) {
    return new Promise((resolve, reject) => {
      const serverUrl = 'https://mydy.webinstall.cn/analyze'

      const timeout = setTimeout(() => {
        reject(new Error('上传超时，请检查网络连接'))
      }, 60000)

      wx.uploadFile({
        url: serverUrl,
        filePath: filePath,
        name: 'image',
        header: {},
        success: (res) => {
          clearTimeout(timeout)
          if (res.statusCode === 200) {
            try {
              const data = JSON.parse(res.data)
              if (data.code === 0) {
                resolve(data.data)
              } else {
                reject(new Error(data.message || '分析失败'))
              }
            } catch (err) {
              reject(new Error('服务器返回数据解析错误'))
            }
          } else {
            reject(new Error(`上传失败，状态码：${res.statusCode}`))
          }
        },
        fail: (err) => {
          clearTimeout(timeout)
          console.error('uploadFile fail', err)
          if (err.errMsg.includes('time out')) {
            reject(new Error('上传超时，请检查网络连接或服务器状态'))
          } else {
            reject(new Error('网络错误，上传失败，请检查网络连接'))
          }
        }
      })
    })
  }
});
