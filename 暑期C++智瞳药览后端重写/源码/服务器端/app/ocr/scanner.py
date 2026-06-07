import re
import cv2
import numpy as np
from paddleocr import PaddleOCR


class AdvancedMedicineScanner:
    def __init__(self, lang="ch", enable_multi_region=True, ocr_kwargs=None):
        default_ocr_kwargs = {
            "lang": lang,
            "det_db_thresh": 0.4,
            "det_db_box_thresh": 0.3,
            "det_db_unclip_ratio": 2.0,
            "use_angle_cls": True,
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
