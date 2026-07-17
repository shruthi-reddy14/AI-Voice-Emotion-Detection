from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import librosa
import numpy as np
import joblib
from tensorflow.keras.models import load_model
from pydub import AudioSegment
AudioSegment.converter = r"C:\Users\d3232\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe"
AudioSegment.ffprobe = r"C:\Users\d3232\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-essentials_build\bin\ffprobe.exe"
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError

from interview_analysis import (
    get_interview_score,
    get_confidence,
    get_status,
    get_communication_score,
    get_feedback,
    get_emoji
)

app = Flask(__name__)
CORS(app)

# =========================
# MongoDB Connection
# =========================
MONGO_CONNECTED = False

try:
    client = MongoClient(
        "mongodb+srv://amireddyshruthi14_db_user:g9tWeCR4Js4VLB1i@cluster0.ykin5nx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        serverSelectionTimeoutMS=5000
    )

    # force connection test
    client.server_info()

    db = client["voice_emotion_db"]
    users_collection = db["users"]
    general_collection = db["general_results"]
    interview_collection = db["interview_results"]

    MONGO_CONNECTED = True
    print("MongoDB Connected Successfully")

except Exception as e:
    print("MongoDB Connection Failed:", str(e))
    users_collection = None
    general_collection = None
    interview_collection = None

# =========================
# Upload folder
# =========================
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# =========================
# Load model + encoder
# =========================
model = load_model("cnn_model.h5")
encoder = joblib.load("label_encoder.pkl")

print("Loaded Model:", model)
print("Model Path:", os.path.abspath("cnn_model.h5"))

# =========================
# Helper function
# =========================
def process_audio_and_predict(audio_file):
    extension = audio_file.filename.split(".")[-1].lower()
    unique_name = str(uuid.uuid4())

    original_path = os.path.join(
        app.config["UPLOAD_FOLDER"],
        f"{unique_name}.{extension}"
    )

    audio_file.save(original_path)

    print("Original file:", original_path)
    print("Extension:", extension)

    # Convert webm to wav if mic recording
    if extension == "webm":
        wav_path = os.path.join(
            app.config["UPLOAD_FOLDER"],
            f"{unique_name}.wav"
        )

        AudioSegment.from_file(
            original_path,
            format="webm"
        ).export(
            wav_path,
            format="wav"
        )

        filepath = wav_path
    else:
        filepath = original_path

    print("Processing:", filepath)

    signal, sr = librosa.load(filepath, duration=3, offset=0.5)

    mfcc = librosa.feature.mfcc(
        y=signal,
        sr=sr,
        n_mfcc=40
    )

    if mfcc.shape[1] < 173:
        mfcc = np.pad(
            mfcc,
            ((0, 0), (0, 173 - mfcc.shape[1])),
            mode="constant"
        )
    else:
        mfcc = mfcc[:, :173]

    mfcc = mfcc.reshape(1, 40, 173, 1)
    print("MFCC shape:", mfcc.shape)

    prediction = model.predict(mfcc)
    predicted_class = np.argmax(prediction)
    emotion = encoder.inverse_transform([predicted_class])[0]
    print("Predicted emotion:", emotion)

    score = get_interview_score(emotion)
    confidence = get_confidence(emotion)
    status = get_status(score)
    communication_score = get_communication_score(emotion)
    feedback = get_feedback(emotion)
    emoji = get_emoji(emotion)

    return {
        "emotion": emotion,
        "score": score,
        "confidence": confidence,
        "status": status,
        "communication_score": communication_score,
        "feedback": feedback,
        "emoji": emoji
    }

# =========================
# Test API
# =========================
@app.route("/api/test", methods=["GET"])
def test():
    return jsonify({
        "message": "Flask API Working",
        "mongo_connected": MONGO_CONNECTED
    })

# =========================
# Register API
# =========================
@app.route("/api/register", methods=["POST"])
def api_register():
    try:
        if not MONGO_CONNECTED or users_collection is None:
            return jsonify({
                "success": False,
                "message": "MongoDB is not connected"
            }), 500

        data = request.get_json()

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({
                "success": False,
                "message": "Username and password are required"
            }), 400

        existing = users_collection.find_one({"username": username})

        if existing:
            return jsonify({
                "success": False,
                "message": "Username already exists"
            }), 400

        users_collection.insert_one({
            "username": username,
            "password": password
        })

        return jsonify({
            "success": True,
            "message": "Registration Successful"
        })

    except Exception as e:
        print("REGISTER API ERROR:", str(e))
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# =========================
# Login API
# =========================
@app.route("/api/login", methods=["POST"])
def api_login():
    try:
        if not MONGO_CONNECTED or users_collection is None:
            return jsonify({
                "success": False,
                "message": "MongoDB is not connected"
            }), 500

        data = request.get_json()

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({
                "success": False,
                "message": "Username and password are required"
            }), 400

        user = users_collection.find_one({
            "username": username,
            "password": password
        })

        if user:
            return jsonify({
                "success": True,
                "username": username
            })

        return jsonify({
            "success": False,
            "message": "Invalid Username or Password"
        }), 401

    except Exception as e:
        print("LOGIN API ERROR:", str(e))
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# =========================
# Logout API
# =========================
@app.route("/api/logout", methods=["POST"])
def api_logout():
    return jsonify({
        "success": True,
        "message": "Logged out successfully"
    })

# =========================
# General Emotion Analysis API
# =========================
@app.route("/api/general", methods=["POST"])
def api_general():
    try:
        if "audio" not in request.files:
            return jsonify({
                "error": "No audio file received"
            }), 400

        audio = request.files["audio"]
        result = process_audio_and_predict(audio)

        username = request.form.get("username")
        if MONGO_CONNECTED and username and general_collection is not None:
            general_collection.insert_one({
                "username": username,
                "emotion": result["emotion"],
                "confidence": result["confidence"],
                "score": result["score"],
                "communication_score": result["communication_score"],
                "status": result["status"]
            })

        return jsonify(result)

    except Exception as e:
        print("GENERAL API ERROR:", str(e))
        return jsonify({
            "error": str(e)
        }), 500

# =========================
# Interview Analysis API
# =========================
@app.route("/api/interview", methods=["POST"])
def api_interview():
    try:
        if "audio" not in request.files:
            return jsonify({
                "error": "No audio file received"
            }), 400

        audio = request.files["audio"]
        result = process_audio_and_predict(audio)

        username = request.form.get("username")
        question_number = request.form.get("question_number")

        if MONGO_CONNECTED and username and interview_collection is not None:
            interview_collection.insert_one({
                "username": username,
                "question_number": question_number,
                "emotion": result["emotion"],
                "confidence": result["confidence"],
                "score": result["score"],
                "communication_score": result["communication_score"],
                "status": result["status"]
            })

        return jsonify(result)

    except Exception as e:
        print("INTERVIEW API ERROR:", str(e))
        return jsonify({
            "error": str(e)
        }), 500

# =========================
# General History API
# =========================
@app.route("/api/general-history", methods=["GET"])
def api_general_history():
    try:
        username = request.args.get("username")

        if not username:
            return jsonify([])

        data = list(
            general_collection.find(
                {"username": username},
                {"_id": 0}
            )
        )
        return jsonify(data)

    except Exception as e:
        print("GENERAL HISTORY ERROR:", str(e))
        return jsonify([]), 500


# =========================
# Interview History API
# =========================
@app.route("/api/interview-history", methods=["GET"])
def api_interview_history():
    try:
        username = request.args.get("username")

        if not username:
            return jsonify([])

        data = list(
            interview_collection.find(
                {"username": username},
                {"_id": 0}
            )
        )
        return jsonify(data)

    except Exception as e:
        print("INTERVIEW HISTORY ERROR:", str(e))
        return jsonify([]), 500

if __name__ == "__main__":
    app.run(debug=True)