FROM python:3.9-slim

WORKDIR /app

# 安装 OpenCV 系统依赖（针对 Debian trixie 修正包名）
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制整个项目
COPY . .

# 预下载 PaddleOCR 模型（避免运行时下载导致健康检查超时）
RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(lang='ch', use_gpu=False, show_log=False)"

# 注意：环境变量请在云托管控制台配置，不要打包 .env
ENV PORT=80
ENV DEBUG=False

EXPOSE 80

# 启动命令（使用 gunicorn，生产级稳定）
CMD ["gunicorn", "--bind", "0.0.0.0:80", "--workers", "1", "--timeout", "180", "--preload", "--access-logfile", "-", "--error-logfile", "-", "app.main:app"]