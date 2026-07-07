import React, { useRef, useState } from "react";
import axios from "axios";
import "./Home.css";

function GeneralAnalysis({ onBack }) {
  const fileInputRef = useRef(null);

  const [selectedAudio, setSelectedAudio] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [timerId, setTimerId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const formatTime = (time) => {
    const mins = String(Math.floor(time / 60)).padStart(2, "0");
    const secs = String(time % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const startRecording = async () => {
    try {
      setResult(null);
      setSelectedAudio(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], "general_recording.webm", {
          type: "audio/webm",
        });
        setSelectedAudio(file);

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordTime(0);

      const interval = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);

      setTimerId(interval);
    } catch (error) {
      console.log("Mic access error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    setIsRecording(false);

    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResult(null);
      setSelectedAudio(e.target.files[0]);
      setIsRecording(false);

      if (timerId) {
        clearInterval(timerId);
        setTimerId(null);
      }
      setRecordTime(0);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedAudio) return;

    try {
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      formData.append("audio", selectedAudio);

      const response = await axios.post(
        "http://127.0.0.1:5000/api/general",
        formData
      );

      setResult(response.data);
    } catch (error) {
      console.log("General analysis error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEmoji = (emotion) => {
    if (!emotion) return "😐";

    const emo = emotion.toLowerCase();

    if (emo.includes("happy")) return "😊";
    if (emo.includes("sad")) return "😔";
    if (emo.includes("angry")) return "😠";
    if (emo.includes("fear")) return "😨";
    if (emo.includes("neutral")) return "😐";
    if (emo.includes("surprise")) return "😲";

    return "🙂";
  };

  return (
    <div className="page-bg">
      <div className="analysis-page">
        <div className="analysis-topbar">
          <button className="back-btn modern-back-btn" onClick={onBack}>
            ← Back
          </button>
        </div>

        <div className="wellbeing-page-card">
          <h1 className="wellbeing-title">Emotional Wellbeing</h1>
          <p className="wellbeing-subtitle">
            Record your voice or upload an audio file
          </p>

          <div className="mic-section">
            <div className={`mic-ring-wrap ${isRecording ? "recording" : ""}`}>
              <div className="mic-ring ring1"></div>
              <div className="mic-ring ring2"></div>
              <div className="mic-ring ring3"></div>

              <div className="mic-main-circle">
                <span className="mic-icon-big">🎤</span>
              </div>
            </div>

            <div className="record-timer">{formatTime(recordTime)}</div>
            <div className="record-status-text">
              {isRecording
                ? "Recording..."
                : selectedAudio
                ? "Audio ready for analysis"
                : "Ready to record"}
            </div>
          </div>

          <div className="fake-waveform"></div>

          <div className="wellbeing-actions">
            {!isRecording ? (
              <button className="well-btn primary-btn" onClick={startRecording}>
                Start Recording
              </button>
            ) : (
              <button className="well-btn stop-btn" onClick={stopRecording}>
                Stop Recording
              </button>
            )}

            <button
              className="well-btn upload-btn"
              onClick={() => fileInputRef.current.click()}
            >
              Upload Audio
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,.mp3,.webm,.m4a"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          {selectedAudio && (
            <div className="selected-audio-box">
              <span className="selected-audio-label">Selected Audio:</span>{" "}
              {selectedAudio.name}
            </div>
          )}

          <div className="analyze-btn-wrap">
            <button
              className="analyze-main-btn"
              onClick={handleAnalyze}
              disabled={!selectedAudio || loading}
            >
              {loading ? "Analyzing..." : "Analyze Emotion"}
            </button>
          </div>

          {result && (
            <div className="analysis-result-wrapper">
              <h2 className="analysis-result-heading">Analysis Results</h2>

              <div className="detected-emotion-card">
                <p className="detected-label">Detected Emotion</p>
                <h1 className="detected-emotion-text">{result.emotion}</h1>
                <div className="detected-emoji">
                  {result.emoji || getEmoji(result.emotion)}
                </div>

                <div className="confidence-pill">
                  <span>Confidence Score</span>
                  <span className="confidence-pill-value">
                    {result.confidence}%
                  </span>
                </div>
              </div>

              <div className="suggestion-card result-suggestion-card">
                <h3>Suggestions</h3>
                <p>{result.feedback}</p>
              </div>

              <div className="result-mini-grid">
                <div className="result-mini-box">
                  <span>Score</span>
                  <strong>{result.score}/100</strong>
                </div>

                <div className="result-mini-box">
                  <span>Communication</span>
                  <strong>{result.communication_score}/100</strong>
                </div>

                <div className="result-mini-box">
                  <span>Status</span>
                  <strong>{result.status}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GeneralAnalysis;