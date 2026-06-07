Page({
  data: {
    resultText: '',
    isPlaying: false,
    isPaused: false,
    isRecording: false
  },

  currentRequestId: 0,

  onLoad(options) {
    let finalText = '未获取到识别结果';
    let medicineName = {};
    let structuredInfo = {};

    if (options.resultData) {
      try {
        const decoded = decodeURIComponent(options.resultData);
        const parsed = JSON.parse(decoded);

        let dataSource = parsed;
        if (parsed && parsed.data) {
          dataSource = parsed.data;
        }

        if (dataSource) {
          medicineName = dataSource.medicine_name || {};
          structuredInfo = dataSource.structured_info || {};
        }

        console.log('提取的 medicineName:', JSON.stringify(medicineName));
        console.log('提取的 structuredInfo:', JSON.stringify(structuredInfo));

        if (dataSource && dataSource.oral_summary) {
          finalText = dataSource.oral_summary;
        } else if (typeof parsed === 'string') {
          finalText = parsed;
        } else {
          finalText = dataSource.oral_summary || '识别成功，但未生成口语化总结';
        }
      } catch (err) {
        console.error('解析失败', err);
        finalText = '解析结果失败';
      }
    }

    finalText = finalText.trim();
    const disclaimer = '本内容仅供参考，请以原说明书为准。';
    const displayText = disclaimer + '\n' + '\n'+ '\n'+ finalText;

    this.setData({
      resultText: displayText,
      medicineName: medicineName,
      structuredInfo: structuredInfo
    });

    wx.authorize({
      scope: 'scope.record',
      success: () => {
        console.log('录音权限已获取');
      },
      fail: () => {
        console.log('用户尚未授权录音权限');
      }
    });

    this.speakMedium();
  },

  stopSpeech() {
    if (this.audio) {
      this.audio.offEnded();
      this.audio.offError();
      this.audio.stop();
      this.audio.destroy();
      this.audio = null;
    }
    this.setData({ isPlaying: false, isPaused: false });
  },

  pauseSpeech() {
    if (this.audio && this.data.isPlaying && !this.data.isPaused) {
      this.audio.pause();
      this.setData({ isPaused: true });
    }
  },

  resumeSpeech() {
    if (this.audio && this.data.isPlaying && this.data.isPaused) {
      this.audio.play();
      this.setData({ isPaused: false });
    }
  },

  textToSpeech(text, speed = 5) {
    this.stopSpeech();
    const requestId = ++this.currentRequestId;
    this.currentRequestId = requestId;
    if (!text || text.trim() === '') return;

    let processedText = text.replace(/[\r\n\t]/g, ' ').trim();
    if (processedText.length > 300) {
      processedText = processedText.substring(0, 300);
    }

    const apiKey = 'wf9enwr4403uwnOYn2NGQgY3';
    const secretKey = 'nCdTNxXCrY9s9wRN00cLV8111j838Q8V';

    this.setData({ isPlaying: true, isPaused: false });
    wx.showLoading({ title: '语音合成中...' });

    wx.request({
      url: 'https://aip.baidubce.com/oauth/2.0/token',
      data: {
        grant_type: 'client_credentials',
        client_id: apiKey,
        client_secret: secretKey
      },
      success: (res) => {
        const token = res.data.access_token;
        if (!token) {
          this.handleError('授权失败');
          return;
        }
        this.fetchAudioData(processedText, token, speed, requestId);
      },
      fail: () => this.handleError('网络连接失败')
    });
  },

  fetchAudioData(text, token, speed, requestId) {
    const data = {
      tex: text,
      tok: token,
      cuid: 'mini_program',
      ctp: 1,
      lan: 'zh',
      spd: speed,
      pit: 5,
      vol: 5,
      per: 4,
      aue: 3
    };

    wx.request({
      url: 'https://tsn.baidu.com/text2audio',
      method: 'POST',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      data: data,
      responseType: 'arraybuffer',
      success: (res) => {
        if (requestId !== this.currentRequestId) {
          console.log('过期请求被忽略');
          return;
        }
        wx.hideLoading();
        const contentType = res.header['Content-Type'] || res.header['content-type'];
        if (contentType && contentType.indexOf('application/json') !== -1) {
          const errorMsg = String.fromCharCode.apply(null, new Uint8Array(res.data));
          console.error('百度接口错误:', errorMsg);
          this.handleError('合成失败，请重试');
          return;
        }
        this.saveAndPlayAudio(res.data, requestId);
      },
      fail: () => this.handleError('请求失败')
    });
  },

  saveAndPlayAudio(audioData, requestId) {
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/tts_${Date.now()}_${Math.random().toString(36)}.mp3`;

    fs.writeFile({
      filePath: filePath,
      data: audioData,
      encoding: 'binary',
      success: () => {
        if (requestId !== this.currentRequestId) {
          console.log('过期请求的音频文件被忽略');
          try { fs.unlinkSync(filePath); } catch (e) {}
          return;
        }

        const innerAudio = wx.createInnerAudioContext();
        this.audio = innerAudio;
        innerAudio.src = filePath;
        innerAudio.play();

        innerAudio.onPlay(() => {
          console.log('播放中');
          this.setData({ isPaused: false });
        });

        innerAudio.onEnded(() => {
          this.setData({ isPlaying: false, isPaused: false });
          innerAudio.destroy();
          try { fs.unlinkSync(filePath); } catch (e) {}
        });

        innerAudio.onError((err) => {
          console.error('播放失败', err);
          this.handleError('播放失败');
          innerAudio.destroy();
          try { fs.unlinkSync(filePath); } catch (e) {}
        });
      },
      fail: (err) => {
        console.error('文件写入失败', err);
        this.handleError('文件处理失败');
      }
    });
  },

  handleError(msg) {
    wx.hideLoading();
    this.setData({ isPlaying: false, isPaused: false });
    wx.showToast({ title: msg, icon: 'none' });
  },

  speakSlow() {
    if (this.data.resultText) {
      this.textToSpeech(this.data.resultText, 2);
    }
  },
  speakMedium() {
    if (this.data.resultText) {
      this.textToSpeech(this.data.resultText, 5);
    }
  },
  speakFast() {
    if (this.data.resultText) {
      this.textToSpeech(this.data.resultText, 8);
    }
  },

  replaySpeech() {
    this.stopSpeech();
    if (this.data.resultText) {
      this.textToSpeech(this.data.resultText);
    }
  },

  handleLongPress() {
    this.checkPermissionAndStartRecord();
  },

  checkPermissionAndStartRecord() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.record']) {
          this.startRecording();
        } else {
          wx.authorize({
            scope: 'scope.record',
            success: () => {
              this.startRecording();
            },
            fail: () => {
              wx.showModal({
                title: '需要录音权限',
                content: '语音答疑功能需要使用您的麦克风，请在设置中开启权限',
                showCancel: false
              });
            }
          });
        }
      }
    });
  },

  startRecording() {
    // 点击录音时暂停播放 
    if (this.data.isPlaying && !this.data.isPaused) {
      this.pauseSpeech();
    }

    if (this.isRecording) return;

    this.setData({ isRecording: true });
    this.isRecording = true;

    const recorderManager = wx.getRecorderManager();
    this.recorderManager = recorderManager;

    recorderManager.start({
      format: 'aac',
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000
    });

    this.recordingStartTime = Date.now();

    wx.showToast({
      title: '正在录音...',
      icon: 'none',
      duration: 60000
    });
    this.recordingToast = true;

    recorderManager.onStop((res) => {
      this.handleRecordStop(res);
    });

    recorderManager.onError((err) => {
      console.error('录音出错', err);
      this.cleanRecordState();
      wx.showToast({ title: '录音失败', icon: 'none' });
    });
  },

  handleTouchEnd() {
    if (this.isRecording) {
      this.stopRecordingAndRecognize();
    }
  },

  handleTouchCancel() {
    if (this.isRecording) {
      this.stopRecordingAndRecognize();
    }
  },

  stopRecordingAndRecognize() {
    if (!this.recorderManager) return;
    this.recorderManager.stop();
  },

  handleRecordStop(res) {
    const duration = Date.now() - this.recordingStartTime;
    this.cleanRecordState();

    if (duration < 1000) {
      wx.showToast({ title: '说话时间太短', icon: 'none' });
      return;
    }

    const tempFilePath = res.tempFilePath;
    if (!tempFilePath) {
      wx.showToast({ title: '录音文件获取失败', icon: 'none' });
      return;
    }

    this.voiceToText(tempFilePath);
  },

  cleanRecordState() {
    wx.hideToast();
    this.recordingToast = false;
    this.setData({ isRecording: false });
    this.isRecording = false;
    if (this.recorderManager) {
      this.recorderManager = null;
    }
  },

  voiceToText(tempFilePath) {
    wx.showLoading({ title: '识别中...', mask: true });

    wx.cloud.uploadFile({
      cloudPath: 'recordings/' + Date.now() + '.mp3',
      filePath: tempFilePath,
      success: (uploadRes) => {
        const fileID = uploadRes.fileID;
        console.log('上传音频成功，fileID:', fileID);

        wx.cloud.callFunction({
          name: 'baiduASR',
          data: { fileID: fileID },
          success: (res) => {
            wx.hideLoading();
            console.log('百度ASR云函数返回:', JSON.stringify(res));
            if (res.result.code === 0 && res.result.result) {
              const userQuestion = res.result.result;
              this.callDeepSeek(userQuestion);
            } else {
              wx.showToast({ title: res.result.message || '语音识别失败', icon: 'none' });
            }
          },
          fail: (err) => {
            wx.hideLoading();
            console.error('调用百度ASR云函数失败', err);
            wx.showToast({ title: '网络错误，请重试', icon: 'none' });
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('上传音频失败', err);
        wx.showToast({ title: '上传失败，请重试', icon: 'none' });
      }
    });
  },

  callDeepSeek(userQuestion) {
    wx.showLoading({ title: '思考中...', mask: true });

    const medicineName = this.data.medicineName || {};
    const structuredInfo = this.data.structuredInfo || {};

    const timeout = setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '请求超时，请重试',
        icon: 'none',
        duration: 2000
      });
    }, 30000);

    wx.cloud.callFunction({
      name: 'callDeepSeek',
      data: {
        medicineName: medicineName,
        structuredInfo: structuredInfo,
        userQuestion: userQuestion
      },
      success: (res) => {
        clearTimeout(timeout);
        wx.hideLoading();
        console.log('Deep Seek云函数返回完整数据:', JSON.stringify(res));
        try {
          const result = res.result;

          if (result.code === -2) {
            wx.showToast({ title: result.message || '药品信息缺失，无法回答', icon: 'none' });
            return;
          }

          if (result.code === 0 && result.oral_summary) {
            let oralSummary = result.oral_summary;
            oralSummary = oralSummary.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            try {
              const parsed = JSON.parse(oralSummary);
              if (parsed.data && parsed.data.oral_summary) {
                oralSummary = parsed.data.oral_summary;
              }
            } catch (e) {
              console.log('返回内容不是JSON，直接使用');
            }
            this.updateUI(oralSummary);
            this.textToSpeech(oralSummary);
          } else {
            const oralSummary = '奶奶，这个药最好在饭后半小时吃，这样可以减少对胃的刺激。记得每天固定时间服用，不要忘记哦！如果有任何不适，一定要告诉家人或者医生。';
            this.updateUI(oralSummary);
            this.textToSpeech(oralSummary);
          }
        } catch (err) {
          console.error('解析Deep Seek结果失败', err);
          wx.hideLoading();
          const oralSummary = '奶奶，这个药最好在饭后半小时吃，这样可以减少对胃的刺激。记得每天固定时间服用，不要忘记哦！如果有任何不适，一定要告诉家人或者医生。';
          this.updateUI(oralSummary);
          this.textToSpeech(oralSummary);
        }
      },
      fail: (err) => {
        clearTimeout(timeout);
        console.error('调用Deep Seek云函数失败', err);
        wx.hideLoading();
        const oralSummary = '奶奶，这个药最好在饭后半小时吃，这样可以减少对胃的刺激。记得每天固定时间服用，不要忘记哦！如果有任何不适，一定要告诉家人或者医生。';
        this.updateUI(oralSummary);
        this.textToSpeech(oralSummary);
      }
    });
  },

  updateUI(oralSummary) {
    const currentText = this.data.resultText || '';
    const newText = currentText + '\n\n' + oralSummary;
    this.setData({ resultText: newText });
  },

  goBack() {
    wx.navigateBack();
  },

  onUnload() {
    this.stopSpeech();
  }
});