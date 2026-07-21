import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Dashboard.css";


const EMOTION_COLORS = {
  happy:     "#FBBF24",
  Happy:     "#FBBF24",
  sad:       "#60A5FA",
  Sad:       "#60A5FA",
  angry:     "#F87171",
  Angry:     "#F87171",
  fear:      "#A78BFA",
  Fear:      "#A78BFA",
  neutral:   "#9CA3AF",
  Neutral:   "#9CA3AF",
  confident: "#22D3EE",
  Confident: "#22D3EE",
};

const EMOTION_EMOJI = {
  happy:"😊", Happy:"😊",
  sad:"😢",   Sad:"😢",
  angry:"😠", Angry:"😠",
  fear:"😨",  Fear:"😨",
  neutral:"😐",Neutral:"😐",
  confident:"💪",Confident:"💪",
};

function getColor(emotion) {
  return EMOTION_COLORS[emotion] || "#8B5CF6";
}
function getEmoji(emotion) {
  return EMOTION_EMOJI[emotion] || "🎙️";
}

/* ── Pie chart ──────────────────────────────────── */
function PieChart({ entries, total }) {
  const size = 220;
  const center = size / 2;
  const radius = 80;
  const innerRadius = 0;

  let cumulativePercent = 0;

  const slices = entries.map((e) => {
    const percent = e.count / total;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    const endPercent = cumulativePercent;

    const startAngle = startPercent * 2 * Math.PI - Math.PI / 2;
    const endAngle = endPercent * 2 * Math.PI - Math.PI / 2;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    const pathData = percent >= 1
      ? `M ${center},${center} m -${radius},0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`
      : `M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2} Z`;

    return {
      ...e,
      pathData,
      percent: Math.round(percent * 100),
    };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="pie-svg">
      {slices.map((s, i) => (
        <path
          key={i}
          d={s.pathData}
          fill={getColor(s.emotion)}
          stroke="#fff"
          strokeWidth="2"
          style={{ filter: `drop-shadow(0 2px 4px ${getColor(s.emotion)}66)` }}
        />
      ))}
      <circle cx={center} cy={center} r={radius * 0.45} fill="#fff" />
      <text x={center} y={center - 8} textAnchor="middle" fill="#1F2937"
        fontSize="28" fontWeight="800" fontFamily="Space Grotesk, sans-serif">
        {total}
      </text>
      <text x={center} y={center + 14} textAnchor="middle" fill="#6B7280"
        fontSize="12" fontFamily="Inter, sans-serif">
        Total
      </text>
    </svg>
  );
}

/* ── Main Dashboard ─────────────────────────────── */
function Dashboard({ username, onBack, onLogout }) {
  const [generalData, setGeneralData] = useState([]);
  const [interviewData, setInterviewData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const user = username || localStorage.getItem("username");
      const [gRes, iRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/general-history?username=${user}`),
        axios.get(`http://localhost:5000/api/interview-history?username=${user}`),
      ]);
      setGeneralData(gRes.data || []);
      setInterviewData(iRes.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const allRecords = useMemo(() => {
    const g = generalData.map((r) => ({
      type: "General",
      emotion: r.emotion || "Neutral",
      confidence: Number(r.confidence || 0),
      score: Number(r.score || 0),
      status: r.status || "",
      date: r.date || r.created_at || r.timestamp || "",
    }));
    const iv = interviewData.map((r) => ({
      type: "Interview",
      emotion: r.overall_emotion || r.emotion || r.q1_emotion || "Neutral",
      confidence: Number(r.avg_confidence || r.confidence || 0),
      score: Number(r.avg_score || r.score || 0),
      status: r.status || "",
      date: r.date || r.created_at || r.timestamp || "",
    }));
    const records = [...g, ...iv];

records.sort((a, b) => {
  return new Date(b.date) - new Date(a.date);
});

return records;
  }, [generalData, interviewData]);

  // Stats
  const total = allRecords.length;
  const interviewCount = interviewData.length;
  const generalCount = generalData.length;

  const today = new Date().toISOString().split("T")[0];
  const todayCount = allRecords.filter((r) => {
    if (!r.date) return false;
    const recordDate = new Date(r.date).toISOString().split("T")[0];
    return recordDate === today;
  }).length;

  // Emotion distribution
  const emotionMap = {};
  allRecords.forEach((r) => {
    emotionMap[r.emotion] = (emotionMap[r.emotion] || 0) + 1;
  });
  const emotionEntries = Object.entries(emotionMap)
    .map(([emotion, count]) => ({ emotion, count, percent: Math.round((count / Math.max(total, 1)) * 100) }))
    .sort((a, b) => b.count - a.count);

  // Last analysis
  const lastAnalysis = allRecords.length > 0 ? allRecords[0] : null;

  // Recent history (last 10)
  const recentHistory = allRecords.slice(0, 10);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="db-page">
      <div className="db-shell">

        {/* ── Sidebar ── */}
        <aside className="db-sidebar">
          <div>
            <div className="db-brand">
              <div className="db-brand-icon">🎙️</div>
              <div>
                <div className="db-brand-name">VoiceIQ</div>
                <div className="db-brand-sub">Emotion Analyzer</div>
              </div>
            </div>
            <nav className="db-nav">
              <button className="db-nav-item" onClick={onBack}>🏠 Home</button>
              <button className="db-nav-item active">📊 Dashboard</button>
            </nav>
          </div>
          <button className="db-logout" onClick={onLogout}>⏻ &nbsp;Logout</button>
        </aside>

        {/* ── Main ── */}
        <main className="db-main">

          {/* Top bar */}
          <div className="db-topbar">
            <div>
              <h1 className="db-title">Dashboard</h1>
              <p className="db-welcome">Welcome back, <span className="db-username">{username || "User"}</span> 👋</p>
            </div>
          </div>

          {loading ? (
            <div className="db-loading">
              <div className="db-spinner"/>
              <p>Loading your data...</p>
            </div>
          ) : (
            <>
              {/* ── Stat cards ── */}
              <div className="db-stats">
                {[
                  { icon: "🎙️", label: "Total Analyses", value: total, sub: "All time analyses" },
                  { icon: "💼", label: "Interview Analyses", value: interviewCount, sub: "Interview sessions" },
                  { icon: "🧘", label: "Wellbeing Analyses", value: generalCount, sub: "Emotional wellbeing" },
                  { icon: "📅", label: "Today's Analyses", value: todayCount, sub: "Analyses today" },
                ].map((s, i) => (
                  <div className="db-stat-card" key={i}>
                    <div className="db-stat-icon">{s.icon}</div>
                    <div>
                      <div className="db-stat-label">{s.label}</div>
                      <div className="db-stat-value">{s.value}</div>
                      <div className="db-stat-sub">{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Middle row: Pie Chart + Last Analysis ── */}
              <div className="db-mid-row">

                {/* Pie Chart */}
                <div className="db-card db-pie-card">
                  <div className="db-card-head">
                    <h3>📊 Emotion Distribution</h3>
                    <span className="db-pill">All time</span>
                  </div>
                  {total === 0 ? (
                    <p className="db-empty">No data yet</p>
                  ) : (
                    <div className="db-pie-wrap">
                      <PieChart entries={emotionEntries} total={total}/>
                      <div className="db-legend">
                        {emotionEntries.map((e, i) => (
                          <div className="db-legend-row" key={i}>
                            <div className="db-legend-left">
                              <span className="db-legend-dot" style={{ background: getColor(e.emotion) }}/>
                              <span>{e.emotion}</span>
                            </div>
                            <span className="db-legend-right">
                              {e.count} ({e.percent}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Last Analysis */}
                <div className="db-card db-last-analysis-card">
                  <h3>🎯 Last Analysis</h3>
                  {lastAnalysis ? (
                    <div className="db-last-analysis-content">
                      <div className="db-last-emoji">{getEmoji(lastAnalysis.emotion)}</div>
                      <div className="db-last-emotion">{lastAnalysis.emotion}</div>
                      <div className="db-last-confidence">
                        <span className="db-confidence-label">Confidence:</span>
                        <span className="db-confidence-value">{lastAnalysis.confidence}%</span>
                      </div>
                      <div className="db-last-date">{formatDate(lastAnalysis.date)}</div>
                    </div>
                  ) : (
                    <p className="db-empty">No analyses yet. Start a session!</p>
                  )}
                </div>
              </div>

              {/* ── Bottom row: Recent Analysis History ── */}
              <div className="db-bottom-row">
                <div className="db-card db-history-card">
                  <h3>📋 Recent Analysis History</h3>
                  {recentHistory.length === 0 ? (
                    <p className="db-empty">No analyses yet. Start a session!</p>
                  ) : (
                    <div className="db-table-wrap">
                      <table className="db-history-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Emotion</th>
                            <th>Confidence</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentHistory.map((r, i) => (
                            <tr key={i}>
                              <td>
                                <span className={`db-type-badge ${r.type.toLowerCase()}`}>
                                  {r.type}
                                </span>
                              </td>
                              <td>
                                <div className="db-table-emotion">
                                  <span className="db-table-emoji">{getEmoji(r.emotion)}</span>
                                  <span>{r.emotion}</span>
                                </div>
                              </td>
                              <td>
                                <span className="db-conf-pill" style={{ background: `${getColor(r.emotion)}22`, color: getColor(r.emotion), border: `1px solid ${getColor(r.emotion)}55` }}>
                                  {r.confidence}%
                                </span>
                              </td>
                              <td className="db-table-date">{formatDate(r.date)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;