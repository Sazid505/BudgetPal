import pytesseract
from PIL import Image
import cv2
import numpy as np
import re
import os

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def extract_text_from_image(image_path):
    try:
        # Get raw OCR from original image first (most reliable for clean receipts)
        img = Image.open(image_path)
        config = "--oem 3 --psm 6"
        raw_text = pytesseract.image_to_string(img, config=config)
        if not raw_text or len(raw_text.strip()) < 3:
            # Fallback: try preprocessed image
            rotated_img = correct_rotation(image_path)
            open_cv_image = cv2.cvtColor(np.array(rotated_img), cv2.COLOR_RGB2BGR)
            processed = preprocess_image(open_cv_image)
            raw_text = pytesseract.image_to_string(processed, config=config)

        text = raw_text or ""

        date = extract_date(text)
        amount = extract_amount(text)
        merchant = extract_merchant(text)

        return {
            "raw_text": text.strip(),
            "date": date,
            "merchant": merchant,
            "amount": amount,
        }

    except Exception as e:
        return {"error": str(e), "raw_text": ""}


# -----------------------------
# Image Preprocessing
# -----------------------------
def preprocess_image(image):
    # Resize (improves small receipt OCR)
    image = cv2.resize(image, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 11, 17, 17)

    thresh = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        2
    )

    return thresh


# -----------------------------
# Rotation Correction
# -----------------------------
def correct_rotation(image_path):
    img = Image.open(image_path)

    try:
        osd = pytesseract.image_to_osd(img)
        rotation = int(re.search(r"Rotate: (\d+)", osd).group(1))

        if rotation != 0:
            img = img.rotate(360 - rotation, expand=True)

    except:
        pass

    return img


# -----------------------------
# Data Extraction
# -----------------------------
def extract_date(text):
    date_patterns = [
        r"\b\d{2}/\d{2}/\d{4}\b",
        r"\b\d{2}-\d{2}-\d{4}\b",
        r"\b\d{4}-\d{2}-\d{2}\b",
        r"\b\d{2}/\d{2}/\d{2}\b"
    ]

    for pattern in date_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group()

    return ""


def extract_amount(text):
    # Only accept amounts that look like money: after TOTAL/FARE/Amount, or $X.XX
    total_patterns = [
        r"(?:TOTAL|Total|FARE|Fare|AMOUNT|Amount)\s*[:\s]*\$?\s*(\d+\.\d{2})\b",
        r"\$\s*(\d+\.\d{2})\b",
    ]
    for pattern in total_patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            val = match.group(1)
            num = float(val)
            if 0.01 <= num <= 9999.99:
                return val

    # Fallback: numbers with 2 decimals only, reject if too large (e.g. ticket numbers)
    amounts = re.findall(r"\b(\d+\.\d{2})\b", text)
    for val in reversed(amounts):
        num = float(val)
        if 0.01 <= num <= 9999.99:
            return val
    return ""


def extract_merchant(text):
    lines = text.split("\n")
    for line in lines[:8]:
        clean = line.strip()
        if len(clean) < 4 or len(clean) > 60:
            continue
        if re.search(r"\d", clean):
            continue
        # Prefer lines that look like a name (letters + spaces, not all caps single word)
        if re.search(r"[a-zA-Z]", clean) and re.search(r"[a-z]", clean):
            return clean[:60]
        if re.search(r"[a-zA-Z]", clean):
            return clean[:60]
    return ""
