const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const BAIDU_API_KEY = 'wf9enwr4403uwnOYn2NGQgY3';
const BAIDU_SECRET_KEY = 'nCdTNxXCrY9s9wRN00cLV8111j838Q8V';

async function getAccessToken() {
  const url = 'https://aip.baidubce.com/oauth/2.0/token';
  const res = await axios.post(url, null, {
    params: {
      grant_type: 'client_credentials',
      client_id: BAIDU_API_KEY,
      client_secret: BAIDU_SECRET_KEY
    }
  });
  return res.data.access_token;
}

async function recognizeSpeech(accessToken, audioBuffer) {
  const url = 'https://vop.baidu.com/server_api';
  const audioBase64 = audioBuffer.toString('base64');
  const res = await axios.post(url, {
    format: 'm4a',
    rate: 16000,
    channel: 1,
    cuid: 'mini_program',
    token: accessToken,
    speech: audioBase64,
    len: audioBuffer.length
  });
  return res.data;
}

exports.main = async (event, context) => {
  const { fileID } = event;
  try {
    console.log('收到 fileID:', fileID);
    const res = await cloud.downloadFile({ fileID });
    const audioBuffer = res.fileContent;
    console.log('文件下载成功，大小:', audioBuffer.length);

    const accessToken = await getAccessToken();
    console.log('百度 token 获取成功');

    const asrRes = await recognizeSpeech(accessToken, audioBuffer);
    console.log('百度识别结果:', JSON.stringify(asrRes));

    if (asrRes.err_no === 0 && asrRes.result) {
      return { code: 0, result: asrRes.result[0] };
    } else {
      return { code: -1, message: asrRes.err_msg || '语音识别失败' };
    }
  } catch (err) {
    console.error('云函数执行错误:', err);
    return { code: -1, message: err.message || '云函数错误' };
  }
};