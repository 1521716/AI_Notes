const cloud = require('wx-server-sdk');
const https = require('https'); 

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { medicineName, structuredInfo, userQuestion } = event;

  //检查药品信息是否有效
  const hasMedicineInfo = medicineName && Object.keys(medicineName).length > 0;
  const hasStructuredInfo = structuredInfo && Object.keys(structuredInfo).length > 0;

  // 如果完全没有药品信息，返回错误码并友好提示
  if (!hasMedicineInfo && !hasStructuredInfo) {
    return {
      code: -2,
      message: '暂未获取到该药品的详细信息，无法回答您的问题。'
    };
  }

  const prompt = `请根据我提供的【药品结构化信息】和【我的提问】，生成一段口语化的回答，并将它填入 JSON 的 oral_summary 字段中。

## 要求
1. oral_summary 的说话对象是主人（称呼主人即可），语气要亲切、易懂。
2. 回答内容必须针对提问的针对性解答。如果问题涉及的信息在结构化信息中不存在，请如实告知“说明书上没有明确说明”或“建议咨询医生”。
3. 字数控制在 100-200 字。
4. 直接输出完整的 JSON，不要包含任何解释性文字。
5. medicine_name 和 structured_info 的内容必须和我提供的一模一样，不要改动。

## 完整数据
{
  "code": 0,
  "data": {
    "medicine_name": ${JSON.stringify(medicineName)},
    "structured_info": ${JSON.stringify(structuredInfo)},
    "oral_summary": "请在此处生成结合提问的口语化回答..."
  }
}

## 我的提问
${userQuestion}

请直接输出替换好 oral_summary 的完整 JSON。`;

  // 准备请求数据
  const postData = JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  const options = {
    hostname: 'api.deepseek.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-4233ea6d6c67405c9d9b67860977f0dd',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  // 使用 Promise 包装 https 请求
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const content = result.choices[0].message.content;

          let oralSummary = content;
          try {
            const parsed = JSON.parse(content);
            if (parsed.data && parsed.data.oral_summary) {
              oralSummary = parsed.data.oral_summary;
            }
          } catch (e) {
            // 非 JSON，直接使用全文
          }

          resolve({
            code: 0,
            oral_summary: oralSummary
          });
        } catch (err) {
          console.error('解析 DeepSeek 响应失败', err);
          resolve({
            code: -1,
            message: '解析响应失败'
          });
        }
      });
    });

    req.on('error', (err) => {
      console.error('DeepSeek 请求错误', err);
      resolve({
        code: -1,
        message: err.message || '调用 DeepSeek API 失败'
      });
    });

    req.write(postData);
    req.end();
  });
};