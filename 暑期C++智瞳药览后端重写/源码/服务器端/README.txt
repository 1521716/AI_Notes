# 服务器端目录

Flask 后端服务源码，包含 OCR 识别与 AI 分析功能。部署于微信云托管。

## 主要文件

| 文件 | 说明 |
|------|------|
| Dockerfile | Docker 镜像构建配置，部署至微信云托管 |
| requirements.txt | Python 依赖列表 |
| .dockerignore | Docker 构建时忽略的文件 |

## 目录结构

```
服务器端/
├── Dockerfile            # Docker 镜像构建配置
├── requirements.txt      # Python 依赖
├── .dockerignore         # 忽略 node_modules 等
└── app/                  # 应用主目录
    ├── app.py            # Flask 入口（本地调试）
    ├── main.py           # 单文件版（包含所有逻辑）
    ├── config.py         # 环境变量配置
    ├── requirements.txt  # app 目录独立依赖
    ├── start.bat         # Windows 启动脚本
    ├── ai/                # AI 分析模块
    │   └── analyzer.py   # DeepSeek API 调用
    ├── ocr/               # OCR 模块
    │   └── scanner.py     # PaddleOCR 扫描器
    └── routes/            # Flask 路由
        └── analyze.py     # /analyze 接口（HTTP POST 图片上传）
```

## 技术栈

- Flask + Flask-CORS
- PaddleOCR（中文字符识别）
- DeepSeek API（药品解读）
- python-dotenv（环境变量）
- gunicorn（生产环境）

## 本地启动

```bash
cd 服务器端/app
set DEEPSEEK_API_KEY=你的密钥
python app.py
# 默认 http://localhost:5000
```

## 云端部署

使用 Dockerfile 部署至微信云托管，需配置以下环境变量：

- `DEEPSEEK_API_KEY`：DeepSeek API 密钥
- `PORT`：80（平台固定端口）
- `DEBUG`：False
