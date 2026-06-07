# pages 目录

微信小程序页面集合。

## 页面列表

| 页面 | 路由 | 说明 |
|------|------|------|
| 首页 | /pages/home/home | 程序入口主页 |
| 拍照 | /pages/camera/camera | 拍摄药品图片并上传分析 |
| 结果 | /pages/result/result | 展示 OCR+AI 分析结果 |
| 历史记录 | /pages/history/history | 查看历史分析列表 |
| 详情 | /pages/history-detail/history-detail | 历史记录详细页面 |
| 登录 | /pages/login/login | 用户登录页 |
| 隐私政策 | /pages/protocol/privacy-policy | 隐私权政策说明 |
| 用户协议 | /pages/protocol/user-service | 用户服务协议 |

## 页面说明

- **首页**：`home/` — 程序入口，提供拍照入口和历史记录入口
- **拍照**：`camera/` — 拍摄药盒，调用云托管后端进行 OCR 识别
- **结果**：`result/` — 展示文字识别结果和 AI 解读，支持语音播报
- **历史**：`history/` — 展示历史分析记录列表
- **详情**：`history-detail/` — 点击历史记录后查看完整分析结果
- **登录**：`login/` — 用户登录页面
- **协议**：`protocol/` — 包含隐私政策（privacy-policy）和用户协议（user-service）
