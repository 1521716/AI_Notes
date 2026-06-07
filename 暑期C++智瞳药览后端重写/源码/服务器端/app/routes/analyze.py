import os
from flask import Blueprint, request, jsonify
from ai import MedicineIntelligence
from config import API_KEY

analyze_bp = Blueprint("analyze", __name__)
brain = MedicineIntelligence(API_KEY)


@analyze_bp.route("/analyze", methods=["POST"])
def analyze():
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
