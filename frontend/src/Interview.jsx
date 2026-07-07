import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./Home.css";

function Interview({ onBack }) {
  const questions = [
    "Tell me about yourself and your background.",
    "Why should we hire you?"
  ];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audio, setAudio] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);

  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  const formatTime = (value) => {
    const mins = String(Math.floor(value / 60)).padStart(2, "0");
    const secs = String(value % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startRecording = async () => {
    try {
      setAudio(null);
      setSeconds(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File(
          [blob],
          `question_${currentQuestion + 1}.webm`,
          { type: "audio/webm" }
        );
        setAudio(file);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      startTimer();
    } catch (error) {
      console.log("Mic error:", error);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const handleAnalyzeAndNext = async () => {
    if (!audio) return;

    const formData = new FormData();
    formData.append("audio", audio);
    formData.append("question_number", currentQuestion + 1);

    try {
      setLoading(true);

      const response = await axios.post(
        "http://127.0.0.1:5000/api/interview",
        formData
      );

      const questionResult = {
        question: questions[currentQuestion],
        emotion: response.data.emotion,
        confidence: Number(response.data.confidence || 0),
        score: Number(response.data.score || 0),
        communication_score: Number(response.data.communication_score || 0),
        status: response.data.status,
        feedback: response.data.feedback,
        emoji: response.data.emoji
      };

      const updatedResults = [...results, questionResult];
      setResults(updatedResults);

      setAudio(null);
      setSeconds(0);
      setIsRecording(false);

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        setInterviewCompleted(true);
      }
    } catch (error) {
      console.log("Interview analyze error:", error);
      alert("Failed to analyze interview audio.");
    } finally {
      setLoading(false);
    }
  };

  const averageConfidence =
    results.length > 0
      ? Math.round(
          results.reduce((sum, item) => sum + Number(item.confidence || 0), 0) /
            results.length
        )
      : 0;

  const averageScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, item) => sum + Number(item.score || 0), 0) /
            results.length
        )
      : 0;

  const averageCommunication =
    results.length > 0
      ? Math.round(
          results.reduce(
            (sum, item) => sum + Number(item.communication_score || 0),
            0
          ) / results.length
        )
      : 0;

  let overallEmotion = "Neutral";
  let overallEmoji = "😐";

  if (results.length > 0) {
    const emotionCount = {};

    results.forEach((item) => {
      emotionCount[item.emotion] = (emotionCount[item.emotion] || 0) + 1;
    });

    overallEmotion = Object.keys(emotionCount).reduce((a, b) =>
      emotionCount[a] > emotionCount[b] ? a : b
    );

    const found = results.find((item) => item.emotion === overallEmotion);
    overallEmoji = found ? found.emoji : "😐";
  }

  const readyStatus = averageScore >= 70 ? "Ready" : "Needs Improvement";

  return (
    <div className="page-bg">
      <div className="analysis-page interview-page-shell">
        <div className="top-bar interview-topbar">
          <button className="back-home-pill" onClick={onBack}>
            ← Back to Home
          </button>
          <h1>Interview Analysis</h1>
        </div>

        {!interviewCompleted ? (
          <div className="interview-live-card">
            <div className="interview-progress-head">
              <p className="question-count">
                Question {currentQuestion + 1} of {questions.length}
              </p>

              <div className="progress-bar interview-progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((currentQuestion + 1) / questions.length) * 100}%`
                  }}
                ></div>
              </div>
            </div>

            <div className="interview-question-panel">
              <div className="question-tag">Q{currentQuestion + 1}</div>
              <div className="question-text-block">
                <h2>{questions[currentQuestion]}</h2>
                <p>Answer clearly using your microphone.</p>
              </div>
            </div>

            <div className="interview-live-body">
              <div className="interview-left-status">
                <div className="interview-timer">{formatTime(seconds)}</div>

                <div className="record-status-dot-line">
                  <span className="record-dot"></span>
                  <span>
                    {isRecording
                      ? "Recording..."
                      : audio
                      ? "Recording completed"
                      : "Ready to record"}
                  </span>
                </div>

                <div className="fake-wave">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>

              <div className="interview-mic-center">
                <div className={`interview-mic-outer ${isRecording ? "recording-pulse" : ""}`}>
                  <div className="interview-mic-middle">
                    <div className="interview-mic-inner">🎤</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="interview-bottom-actions">
              {!isRecording ? (
                <button className="purple-btn interview-main-btn" onClick={startRecording}>
                  Start Recording
                </button>
              ) : (
                <button className="danger-btn interview-main-btn" onClick={stopRecording}>
                  Stop Recording
                </button>
              )}

              <button
                className="next-btn interview-main-btn"
                onClick={handleAnalyzeAndNext}
                disabled={!audio || loading}
              >
                {loading
                  ? "Analyzing..."
                  : currentQuestion === questions.length - 1
                  ? "Analyze & Finish"
                  : "Analyze & Next →"}
              </button>
            </div>

            <p className="interview-note">
              Your recording will be analyzed for this question.
            </p>
          </div>
        ) : (
          <div className="interview-final-card">
           

            <div className="interview-overall-panel">
              <p className="small-label">Overall Emotion</p>
              <h1 className="interview-overall-emotion">{overallEmotion}</h1>
              <div className="interview-overall-emoji">{overallEmoji}</div>

              <div className="confidence-pill">
                <span>Average Confidence</span>
                <span>{averageConfidence}%</span>
              </div>
            </div>

            <div className="interview-score-row">
              <div className="score-box">
                <span>Interview Score</span>
                <strong>{averageScore}/100</strong>
              </div>

              <div className="score-box">
                <span>Communication Score</span>
                <strong>{averageCommunication}/100</strong>
              </div>

              <div className="score-box">
                <span>Overall Status</span>
                <strong>{readyStatus}</strong>
              </div>
            </div>

            <div className="interview-bottom-grid">
              <div className="suggestion-card">
                <h3>Question-wise Emotion Summary</h3>
                {results.map((item, index) => (
                  <p key={index}>
                    <strong>Q{index + 1}:</strong> {item.question} — {item.emotion}
                  </p>
                ))}
              </div>

              <div className="suggestion-card">
                <h3>Feedback</h3>
                <p>
                  {readyStatus === "Ready"
                    ? "You are performing well overall. Your answers sound confident and suitable for interviews. Keep up the good work and maintain consistency in your responses."
                    : "You need more practice. Work on confidence, clarity and consistency in your interview responses."}
                </p>
              </div>
            </div>

            <button
              className="full-report-btn"
              onClick={() => {
                setInterviewCompleted(false);
                setCurrentQuestion(0);
                setResults([]);
                setAudio(null);
                setSeconds(0);
              }}
            >
              Analyze Another Interview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Interview;