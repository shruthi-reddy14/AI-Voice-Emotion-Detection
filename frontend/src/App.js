import React, { useState } from "react";
import Auth from "./Auth";
import Home from "./Home";
import GeneralAnalysis from "./GeneralAnalysis";
import Interview from "./Interview";
import Dashboard from "./Dashboard";

function App() {
  const [page, setPage] = useState("auth");
  const [username, setUsername] = useState("");
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  const handleLoginSuccess = (loggedInUsername) => {
    setUsername(loggedInUsername);
    setPage("home");
  };

  const handleLogout = () => {
    setUsername("");
    setPage("auth");
  };

  const handleOpenDashboard = () => {
    setDashboardRefreshKey(prev => prev + 1);
    setPage("dashboard");
  };

  return (
    <>
      {page === "auth" && (
        <Auth onLoginSuccess={handleLoginSuccess} />
      )}

      {page === "home" && (
        <Home
          username={username}
          onSelectMode={(mode) => setPage(mode)}
          onLogout={handleLogout}
          onOpenDashboard={handleOpenDashboard}
        />
      )}

      {page === "general" && (
        <GeneralAnalysis
          username={username}
          onBack={() => setPage("home")}
        />
      )}

      {page === "interview" && (
        <Interview
          username={username}
          onBack={() => setPage("home")}
        />
      )}

      {page === "dashboard" && (
        <Dashboard
          key={dashboardRefreshKey}
          username={username}
          onBack={() => setPage("home")}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

export default App;