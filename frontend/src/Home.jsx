import React from "react";
import "./Home.css";

function Home({ onSelectMode, onOpenDashboard, onLogout }) {
  return (
    <div className="home-layout">
      {/* LEFT SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <div className="logo-circle">🎙</div>
            <div>
              <h2>AI Voice</h2>
              <p>Emotion Analyzer</p>
            </div>
          </div>

          <div className="sidebar-menu">
            <button className="sidebar-item active">
              <span>🏠</span>
              Home
            </button>

            <button
              className="sidebar-item"
              onClick={onOpenDashboard}
            >
              <span>📊</span>
              Dashboard
            </button>
          </div>
        </div>

        <button className="sidebar-logout" onClick={onLogout}>
          <span>↩</span>
          Logout
        </button>
      </div>

      {/* RIGHT MAIN CONTENT */}
      <div className="home-main">
        <div className="home-card">
          <h1>AI Voice Emotion Analyzer</h1>
          <p>Select a mode to begin your analysis</p>

          {/* Emotional Wellbeing */}
          <div
            className="mode-box purple-box"
            onClick={() => onSelectMode("general")}
          >
            <div className="mode-icon purple-icon">🎤</div>

            <div className="mode-content">
              <h2>Emotional Wellbeing</h2>
              <p>
                Analyze your emotional state from recorded voice and get
                confidence, score and feedback.
              </p>
            </div>

            <div className="mode-arrow purple-arrow">→</div>
          </div>

          {/* Interview Analysis */}
          <div
            className="mode-box teal-box"
            onClick={() => onSelectMode("interview")}
          >
            <div className="mode-icon teal-icon">💼</div>

            <div className="mode-content">
              <h2>Interview Analysis</h2>
              <p>
                Answer interview questions using microphone and get a final
                readiness analysis after all questions are completed.
              </p>
            </div>

            <div className="mode-arrow teal-arrow">→</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;