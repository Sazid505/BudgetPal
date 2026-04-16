from flask import Flask, request, jsonify
from flask_cors import CORS
from TextExtraction import extract_text_from_image
import os
import uuid

app = Flask(__name__)
CORS(app)

@app.route("/upload", methods=["POST"])
def upload_receipt():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Generate unique filename to avoid overwrite
    unique_filename = f"{uuid.uuid4()}.jpg"
    file_path = os.path.join(unique_filename)

    file.save(file_path)

    # Run OCR
    extracted_data = extract_text_from_image(file_path)

    # Delete temp file after processing
    if os.path.exists(file_path):
        os.remove(file_path)

    return jsonify(extracted_data)

if __name__ == "__main__":
    app.run(port=5000, debug=True)