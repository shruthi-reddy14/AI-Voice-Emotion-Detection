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

/* ── Donut chart ─────────────────────────────────── */
function DonutChart({ entries, total }) {
  const R = 80, CX = 110, CY = 110;
  const circ = 2 * Math.PI * R;
  let offset = 0;

  const segments = entries.map((e) => {
    const pct = e.count / total;
    const dash = pct * circ;
    const seg = { ...e, dash, gap: circ - dash, offset };
    offset += dash;
    return seg;
  });

  return (
    <svg viewBox="0 0 220 2s20" className="donut-svg">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="22"/>
      {segments.map((s, i) => (
        <circle key={i} cx={CX} cy={CY} r={R} fill="none"
          stroke={getColor(s.emotion)} strokeWidth="22"
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${CX} ${CY})`}
          style={{ filter: `drop-shadow(0 0 6px ${getColor(s.emotion)}88)` }}
        />
      ))}
      <circle cx={CX} cy={CY} r={R - 14} fill="rgba(8,12,30,0.96)"/>
      <text x={CX} y={CY - 6} textAnchor="middle" fill="#F5F3FF"
        fontSize="26" fontWeight="800" fontFamily="Space Grotesk, sans-serif">
        {total}
      </text>
      <text x={CX} y={CY + 16} textAnchor="middle" fill="#9CA3AF"
        fontSize="13" fontFamily="Inter, sans-serif">
        Total
      </text>
    </svg>
  );
}

/* ── Trend line chart ────────────────────────────── */
function TrendChart({ data, labels }) {
  const W = 700, H = 240, PAD = { t: 20, b: 40, l: 10, r: 10 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const max = 100;

  const pts = data.map((v, i) => {
    const x = PAD.l + (i / Math.max(data.length - 1, 1)) * plotW;
    const y = PAD.t + plotH - (v / max) * plotH;
    return [x, y];
  });

  const polyline = pts.map((p) => p.join(",")).join(" ");

  // smooth area
  const areaPath = pts.length < 2 ? "" :
    `M ${pts[0][0]},${PAD.t + plotH} ` +
    pts.map((p) => `L ${p[0]},${p[1]}`).join(" ") +
    ` L ${pts[pts.length - 1][0]},${PAD.t + plotH} Z`;

  const gridYs = [0, 25, 50, 75, 100].map(
    (v) => ({ v, y: PAD.t + plotH - (v / max) * plotH })
  );

  return (
    <div className="trend-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED"/>
            <stop offset="100%" stopColor="#D946EF"/>
          </linearGradient>
          <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Y-axis labels + grid */}
        {gridYs.map(({ v, y }) => (
          <g key={v}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
              stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
            <text x={0} y={y + 4} fill="#6B7280" fontSize="11" fontFamily="Inter">
              {v}%
            </text>
          </g>
        ))}

        {/* Area fill */}
        {pts.length >= 2 && (
          <path d={areaPath} fill="url(#areaGrad)"/>
        )}

        {/* Line */}
        {pts.length >= 2 && (
          <polyline points={polyline} fill="none"
            stroke="url(#lineGrad)" strokeWidth="3.5"
            strokeLinejoin="round" strokeLinecap="round"
            filter="url(#glow)"
          />
        )}

        {/* Points */}
        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="6" fill="#1C1040"
              stroke="url(#lineGrad)" strokeWidth="2.5"
              filter="url(#glow)"
            />
          </g>
        ))}

        {/* X-axis labels */}
        {labels.map((lbl, i) => {
          const x = PAD.l + (i / Math.max(data.length - 1, 1)) * plotW;
          return (
            <text key={i} x={x} y={H - 6} textAnchor="middle"
              fill="#6B7280" fontSize="11" fontFamily="Inter">
              {lbl}
            </text>
          );
        })}
      </svg>
    </div>
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
    }));
    const iv = interviewData.map((r) => ({
      type: "Interview",
      emotion: r.overall_emotion || r.emotion || r.q1_emotion || "Neutral",
      confidence: Number(r.avg_confidence || r.confidence || 0),
      score: Number(r.avg_score || r.score || 0),
      status: r.status || "",
    }));
    return [...g, ...iv];
  }, [generalData, interviewData]);

  // Stats
  const total = allRecords.length;
  const thisMonth = allRecords.length; // all stored; refine with timestamp if added
  const avgConf = total === 0 ? 0 : Math.round(allRecords.reduce((a, b) => a + b.confidence, 0) / total);

  // Emotion distribution
  const emotionMap = {};
  allRecords.forEach((r) => {
    emotionMap[r.emotion] = (emotionMap[r.emotion] || 0) + 1;
  });
  const emotionEntries = Object.entries(emotionMap)
    .map(([emotion, count]) => ({ emotion, count, percent: Math.round((count / Math.max(total, 1)) * 100) }))
    .sort((a, b) => b.count - a.count);

  // Recent (last 5)
  const recent = [...allRecords].reverse().slice(0, 5);

  // Trend (last 7 confidence values)
  const trendRaw = allRecords.length >= 2
    ? allRecords.slice(-7).map((r) => r.confidence)
    : [28, 30, 75, 38, 60, 62, 95];

  const trendLabels = trendRaw.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (trendRaw.length - 1 - i) * 4);
    return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
  });

  // Insights
  const insights = [];
  if (total === 0) {
    insights.push({ icon: "🎙️", text: "No analyses yet — start with Emotional Wellbeing or Interview mode." });
  } else {
    const topEmotion = emotionEntries[0]?.emotion || "";
    const trend = trendRaw.length >= 2 ? trendRaw[trendRaw.length - 1] - trendRaw[0] : 0;
    if (trend > 10) insights.push({ icon: "📈", text: "Your confidence score is trending upward. Keep going!" });
    else if (trend < -10) insights.push({ icon: "📉", text: "Your scores dipped recently. Try a short practice session." });
    else insights.push({ icon: "📊", text: "Your emotional state is stabilizing. Consistent results detected." });
    if (["Calm", "Happy", "Confident"].includes(topEmotion))
      insights.push({ icon: "😊", text: `Your most frequent emotion is ${topEmotion} — a positive sign for performance.` });
    else if (["Anxious", "Fear", "Nervous"].includes(topEmotion))
      insights.push({ icon: "💡", text: `High ${topEmotion} detected. Breathing exercises before sessions may help.` });
    insights.push({ icon: "🎯", text: "Great job staying consistent! Aim for a daily check-in to track progress." });
  }

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
            <div className="db-bell">🔔</div>
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
                  { icon: "🎙️", label: "Total Analyses",     value: total,          sub: "All time analyses" },
                  { icon: "📈", label: "Average Confidence",  value: `${avgConf}%`,  sub: "Across all analyses" },
                  { icon: "😊", label: "Detected Emotions",   value: emotionEntries.length, sub: "Unique categories" },
                  { icon: "🗓️", label: "This Month",          value: thisMonth,       sub: "Analyses completed" },
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

              {/* ── Middle row: Trend + Distribution ── */}
              <div className="db-mid-row">

                {/* Trend */}
                <div className="db-card db-trend-card">
                  <div className="db-card-head">
                    <h3>📈 Emotion Trend</h3>
                    <span className="db-pill">Last {trendRaw.length} sessions</span>
                  </div>
                  <TrendChart data={trendRaw} labels={trendLabels}/>
                </div>

                {/* Donut */}
                <div className="db-card db-donut-card">
                  <h3>Emotion Distribution</h3>
                  {total === 0 ? (
                    <p className="db-empty">No data yet</p>
                  ) : (
                    <div className="db-donut-wrap">
                      <DonutChart entries={emotionEntries} total={total}/>
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
              </div>

              {/* ── Bottom row: Recent + Insights ── */}
              <div className="db-bottom-row">

                {/* Recent Analyses */}
                <div className="db-card">
                  <h3>🕐 Recent Analyses</h3>
                  {recent.length === 0 ? (
                    <p className="db-empty">No analyses yet. Start a session!</p>
                  ) : (
                    <div className="db-recent-list">
                      {recent.map((r, i) => (
                        <div className="db-recent-row" key={i}>
                          <div className="db-recent-left">
                            <span className="db-recent-emoji">{getEmoji(r.emotion)}</span>
                            <div>
                              <div className="db-recent-emotion">{r.emotion}</div>
                              <div className="db-recent-type">{r.type}</div>
                            </div>
                          </div>
                          <div className="db-recent-right">
                            <span className="db-conf-pill" style={{ background: `${getColor(r.emotion)}22`, color: getColor(r.emotion), border: `1px solid ${getColor(r.emotion)}55` }}>
                              {r.confidence}%
                            </span>
                            <button className="db-view-btn">View Details ›</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Insights */}
                <div className="db-card db-insights-card">
                  <h3>💡 Insights</h3>
                  <div className="db-insights-list">
                    {insights.map((ins, i) => (
                      <div className="db-insight-item" key={i}>
                        <span className="db-insight-icon">{ins.icon}</span>
                        <p>{ins.text}</p>
                      </div>
                    ))}
                  </div>
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
