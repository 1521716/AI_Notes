import re
import json
from openai import OpenAI


class MedicineIntelligence:
    def __init__(self, api_key):
        self.client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

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
        from ocr import AdvancedMedicineScanner
        scanner = AdvancedMedicineScanner()
        raw_text = scanner.scan_and_ocr(image_path)
        if "错误" in raw_text:
            return {"error": raw_text}
        return self._get_structured_data(raw_text)
