Page({
  data: {
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
    
    // 处理商品名为空的情况，使用时间戳命名
    let medicineName = result.medicine_name || {}
    if (!medicineName['通用名'] && !medicineName['商品名']) {
      // 格式为 xxxx.xx.xx 格式
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const formattedDate = `${year}.${month}.${day}`
      medicineName['通用名'] = formattedDate
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
      //使用前请更改为实际接口
      const serverUrl = 'https://ztylll-prod-d6gf4ctq5b1ce77a9-1422330863.ap-shanghai.run.wxcloudrun.com/analyze'
      wx.uploadFile({
        url: serverUrl,
        filePath: filePath,
        name: 'image',
        header: {
        },
        success: (res) => {
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
          console.error('uploadFile fail', err)
          reject(new Error('网络错误，上传失败'))
        }
      })
    })
  }

})