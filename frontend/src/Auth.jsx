import React, { useState } from "react";
import axios from "axios";
import "./Auth.css";

function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  const handleAuth = async () => {
    clearMessages();

    if (!username.trim() || !password.trim()) {
      setError("Please fill all fields");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        const response = await axios.post("http://localhost:5000/api/login", {
          username: username.trim(),
          password: password.trim()
        });

        if (response.data.success) {
          localStorage.setItem("username", response.data.username);
          setMessage("Login successful");

          setTimeout(() => {
            if (onLoginSuccess) {
              onLoginSuccess(response.data.username);
            }
          }, 500);
        } else {
          setError(response.data.message || "Invalid login");
        }
      } else {
        const response = await axios.post("http://localhost:5000/api/register", {
          username: username.trim(),
          password: password.trim()
        });

        if (response.data.success) {
          setMessage("Registration successful. Please login.");
          setIsLogin(true);
          setPassword("");
          setConfirmPassword("");
        } else {
          setError(response.data.message || "Registration failed");
        }
      }
    } catch (err) {
      console.log("AUTH ERROR:", err);
      console.log("AUTH ERROR RESPONSE:", err?.response?.data);

      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Network error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="left-section">
          <div className="logo-wave">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <h1>AI Voice</h1>
          <h1>Emotion Analyzer</h1>

          <p>
            Understand emotions.
            <br />
            Improve communication.
          </p>
        </div>

        <div className="right-section">
          <div className="tabs">
            <button
              className={isLogin ? "active" : ""}
              onClick={() => {
                setIsLogin(true);
                clearMessages();
              }}
            >
              Login
            </button>

            <button
              className={!isLogin ? "active" : ""}
              onClick={() => {
                setIsLogin(false);
                clearMessages();
              }}
            >
              Sign Up
            </button>
          </div>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}

          <button className="login-btn" onClick={handleAuth} disabled={loading}>
            {loading
              ? isLogin
                ? "Logging in..."
                : "Creating..."
              : isLogin
              ? "Login"
              : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;