@echo off
chcp 65001 >nul
echo ================================
echo   智瞳药览 - 启动脚本
echo ================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

echo [1/3] 正在检查并安装依赖...
pip install -r requirements.txt -q
if %errorlevel% neq 0 (
    echo [警告] 依赖安装失败，请手动检查...
)

if not exist .env (
    echo.
    echo [提示] 未检测到 .env 文件，已自动创建
    (
        echo DEEPSEEK_API_KEY=your_api_key_here
        echo # HOST=0.0.0.0
        echo # PORT=5000
        echo # DEBUG=True
    ) > .env
    echo 请编辑 .env 文件，填入您的 DeepSeek API Key 后保存：
    echo.
    notepad .env
    pause
)

findstr /v "#" .env | findstr "DEEPSEEK_API_KEY" | findstr "your_api_key" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo [提示] 请先编辑 .env 文件，填入您的 DeepSeek API Key
    notepad .env
    pause
)

echo [2/3] 正在启动服务器...
echo.
echo 访问地址: http://localhost:5000
echo 接口路径: POST /analyze
echo 按 Ctrl+C 停止服务器
echo.
python app.py

pause
