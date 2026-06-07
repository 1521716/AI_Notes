from flask import Flask
from flask_cors import CORS
from config import API_KEY, HOST, PORT, DEBUG
from routes import analyze_bp

app = Flask(__name__)
CORS(app)
app.register_blueprint(analyze_bp)


if __name__ == "__main__":
    if not API_KEY:
        print("警告：未检测到 DEEPSEEK_API_KEY 环境变量！")
    app.run(host=HOST, port=PORT, debug=DEBUG)
