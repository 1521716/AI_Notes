# -*- coding: utf-8 -*-
"""
智瞳药览 - 药品说明书智能解读系统
单文件版本 (原 MVC 结构合并)
"""

import os
import re
import json
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
from openai import OpenAI
from dotenv import load_dotenv

# ============== 配置 ==============
load_dotenv()
API_KEY = os.getenv("DEEPSEEK_API_KEY")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "5000"))  # 本地默认5000，云端部署时设为80
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")


# ============== OCR 模块 ==============
class AdvancedMedicineScanner:
    """药品说明书 OCR 扫描器"""

    def __init__(self, lang="ch", enable_multi_region=True, ocr_kwargs=None):
        default_ocr_kwargs = {
            "lang": lang,
            "det_db_thresh": 0.3,
            "det_db_box_thresh": 0.6,
            "det_db_unclip_ratio": 1.5,
            "show_log": False,
            "use_gpu": False,
        }
        if ocr_kwargs:
            default_ocr_kwargs.update(ocr_kwargs)
        self.ocr_engine = PaddleOCR(**default_ocr_kwargs)
        self.enable_multi_region = enable_multi_region

    def order_points(self, pts):
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        return rect

    def perspective_transform(self, image, pts):
        rect = self.order_points(pts)
        (tl, tr, br, bl) = rect
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))
        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))
        dst = np.array([[0, 0], [maxWidth - 1, 0], [maxWidth - 1, maxHeight - 1], [0, maxHeight - 1]], dtype="float32")
        M = cv2.getPerspectiveTransform(rect, dst)
        return cv2.warpPerspective(image, M, (maxWidth, maxHeight))

    def auto_canny(self, image, sigma=0.33):
        v = np.median(image)
        lower = int(max(0, (1.0 - sigma) * v))
        upper = int(min(255, (1.0 + sigma) * v))
        return cv2.Canny(image, lower, upper)

    def is_rectangle_like(self, pts, aspect_ratio_tolerance=0.3, angle_tolerance=15):
        rect = self.order_points(pts)
        (tl, tr, br, bl) = rect
        w1, w2 = np.linalg.norm(tr - tl), np.linalg.norm(br - bl)
        h1, h2 = np.linalg.norm(bl - tl), np.linalg.norm(br - tr)
        if not (0.7 <= w1 / w2 <= 1.3) or not (0.7 <= h1 / h2 <= 1.3):
            return False

        def angle_between(v1, v2):
            cos = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
            return np.degrees(np.arccos(np.clip(cos, -1, 1)))

        a1 = angle_between(tr - tl, bl - tl)
        if abs(a1 - 90) > angle_tolerance:
            return False
        return True

    def crop_rotated_region(self, image, pts):
        rect = cv2.minAreaRect(pts)
        box = np.int0(cv2.boxPoints(rect))
        angle = rect[2]
        if angle < -45:
            angle += 90
        (h, w) = image.shape[:2]
        M = cv2.getRotationMatrix2D(rect[0], angle, 1.0)
        rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        bbox = cv2.boundingRect(box)
        return rotated[max(0, bbox[1]):bbox[1] + bbox[3], max(0, bbox[0]):bbox[0] + bbox[2]]

    def find_all_quadrilaterals(self, edged, orig, min_area_ratio=0.01):
        cnts, _ = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        cnts = sorted(cnts, key=cv2.contourArea, reverse=True)
        h, w = orig.shape[:2]
        min_area = min_area_ratio * h * w
        regions = []
        for c in cnts:
            if cv2.contourArea(c) < min_area:
                continue
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            if len(approx) == 4:
                pts = approx.reshape(4, 2)
                warped = self.perspective_transform(orig, pts) if self.is_rectangle_like(
                    pts) else self.crop_rotated_region(orig, pts)
                regions.append((warped, pts))
        return regions

    def group_text_by_lines(self, ocr_result, y_threshold=20):
        if not ocr_result:
            return ""
        lines = []
        for bbox, (text, conf) in ocr_result:
            if conf < 0.5:
                continue
            cy = (bbox[0][1] + bbox[2][1]) / 2
            lines.append((cy, text))
        lines.sort(key=lambda x: x[0])

        grouped, current_line, last_y = [], [], None
        for y, text in lines:
            if last_y is None or abs(y - last_y) <= y_threshold:
                current_line.append(text)
            else:
                grouped.append(" ".join(current_line))
                current_line = [text]
            last_y = y
        if current_line:
            grouped.append(" ".join(current_line))
        return "\n".join(grouped)

    def postprocess_text(self, text):
        text = re.sub(r'(?<=\d)[Oo](?=\d)', '0', text)
        text = re.sub(r'(\d)([lL])', r'\g<1>1', text)
        text = text.replace('：', ':')
        return text

    def enhance_for_ocr(self, image):
        denoised = cv2.bilateralFilter(image, d=9, sigmaColor=75, sigmaSpace=75)
        gray = cv2.cvtColor(denoised, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (0, 0), 3)
        sharpened = cv2.addWeighted(gray, 1.5, blurred, -0.5, 0)
        enhanced = cv2.cvtColor(sharpened, cv2.COLOR_GRAY2BGR)
        avg_brightness = np.mean(gray)
        if avg_brightness < 100:
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            clahe_gray = clahe.apply(gray)
            enhanced = cv2.cvtColor(clahe_gray, cv2.COLOR_GRAY2BGR)
        return enhanced

    def scan_and_ocr(self, image_path):
        image = cv2.imread(image_path)
        if image is None:
            return "错误：无法读取图片"
        orig = image.copy()
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edged = self.auto_canny(cv2.GaussianBlur(gray, (5, 5), 0))

        regions = self.find_all_quadrilaterals(edged, orig) if self.enable_multi_region else []
        if not regions:
            regions = [(orig, None)]

        all_texts = []
        for proc_img, _ in regions:
            enhanced_img = self.enhance_for_ocr(proc_img)
            result = self.ocr_engine.ocr(enhanced_img)
            if result and result[0]:
                block_text = self.group_text_by_lines(result[0])
                if block_text:
                    all_texts.append(block_text)

        return self.postprocess_text("\n\n".join(all_texts)).strip()


# ============== AI 模块 ==============
class MedicineIntelligence:
    """药品智能分析器 (DeepSeek)"""

    def __init__(self, api_key):
        self.client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
        self.scanner = AdvancedMedicineScanner()

    def _get_structured_data(self, raw_text):
        prompt = (
            f"请根据以下 OCR 文本进行分析：\n{raw_text}\n\n"
            "任务要求：返回一个严格的 JSON 格式，包含以下三个字段：\n"
            "1. medicine_name: 仅包含对原始信息进行修正和完善后药品名的结构化数据，包括通用名和商品名（这段的返回结果中只能有这两个属性，坚决不能增删！）。\n"
            "2. structured_info: 对原始信息进行修正和完善后的结构化数据，包含适应症、用法用量、核心禁忌、不良反应、有效期、成分、注意事项、功能主治。\n"
            "3. oral_summary: 将以上所有信息整合后，转换成针对老年人的、通俗易懂的口语化温馨提示。\n"
            "【强制纠错指令】：当前文本为机器视觉(OCR)的原始识别结果。由于药盒反光、折痕或字体极小，可能存在连笔字、形近字识别错误（如将数字'0'识别为'O'，或专有名词断裂）。"
            "你必须调用你的医学常识与药理学知识库，对上下文进行逻辑推理。一旦发现不符合医学规范的词汇，请自动修正为正确的医学术语，切勿盲目保留 OCR 的原始错字。"
            "你必须以主人作为对使用者的称呼"
        )
        try:
            response = self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": "你是一个严谨的医疗助手，必须返回包含 medicine_name, structured_info, oral_summary 字段的 JSON 格式。"},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            json_str = re.search(r'\{.*\}', content, re.DOTALL).group()
            return json.loads(json_str)
        except Exception as e:
            return {"error": f"AI处理失败: {str(e)}"}

    def analyze_medicine(self, image_path):
        raw_text = self.scanner.scan_and_ocr(image_path)
        if "错误" in raw_text:
            return {"error": raw_text}
        return self._get_structured_data(raw_text)


# ============== Flask 应用 ==============
app = Flask(__name__)
CORS(app)
brain = MedicineIntelligence(API_KEY)


@app.route("/health", methods=["GET"])
def health():
    """存活探针 - 云托管健康检查接口"""
    return "ok", 200


@app.route("/analyze", methods=["POST"])
def analyze():
    """药品图片分析接口"""
    if "image" not in request.files:
        return jsonify({"error": "未上传图片"}), 400

    file = request.files["image"]
    file_path = "temp_upload.jpg"
    file.save(file_path)

    try:
        result = brain.analyze_medicine(file_path)
        return jsonify({"code": 0, "data": result})
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


if __name__ == "__main__":
    if not API_KEY:
        print("警告：未检测到 DEEPSEEK_API_KEY 环境变量！")
    app.run(host=HOST, port=PORT, debug=DEBUG)
