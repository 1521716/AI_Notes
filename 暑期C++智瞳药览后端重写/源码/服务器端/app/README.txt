# app 目录

应用主目录，包含 Flask 入口及所有功能模块。

## 目录结构

```
app/
├── app.py        # Flask 入口（本地调试）
├── main.py       # 单文件版（包含所有逻辑）
├── config.py     # 环境变量配置
├── ai/           # AI 分析模块
├── ocr/          # OCR 扫描模块
└── routes/       # Flask 路由
```

## 入口说明

| 文件 | 用途 |
|------|------|
| `app.py` | 本地调试入口，模块化加载 |
| `main.py` | 单文件版，包含全部逻辑，适合容器部署 |

## 模块说明

- `ai/` — DeepSeek API 调用，分析药品说明书内容
- `ocr/` — PaddleOCR 扫描器，检测并识别药盒文字
- `routes/` — Flask 路由，定义 `/analyze` 等接口

## 本地启动

```bash
set DEEPSEEK_API_KEY=你的密钥
python app.py
```
