# cloudfunctions 目录

微信云函数集合，提供语音识别与 AI 分析能力。

## 云函数列表

| 云函数 | 说明 |
|--------|------|
| `baiduASR` | 调用百度 ASR 语音识别 API，将语音转为文字 |
| `callDeepSeek` | 调用 DeepSeek API 生成药品解读内容 |
| `all` | 容器（已部署的后端服务配置） |
| `cloud1-5g40tidu20af1ffb` | 云托管容器实例（开发环境） |
| `prod-d6gf4ctq5b1ce77a9` | 云托管容器实例（生产环境） |

## 注意事项

- `all/`、`cloud1-*/`、`prod-*/` 为平台自动生成的管理目录，无需手动修改
- 手动编辑请使用 `baiduASR/` 和 `callDeepSeek/` 目录
