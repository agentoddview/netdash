import { useEffect, useState } from "react";
import DashboardPage from "./dashboard";
import SettingsPage from "./SettingsPage";
import ServersPage from "./ServersPage";
import AuthGate from "./AuthGate";

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (to: string) => {
    if (to === path) return;
    window.history.pushState({}, "", to);
    setPath(to);
  };

  const renderRoute = () => {
    if (path === "/settings") {
      return <SettingsPage onNavigate={navigate} currentPath={path} />;
    }
    if (path === "/servers") {
      return <ServersPage onNavigate={navigate} currentPath={path} />;
    }
    return <DashboardPage onNavigate={navigate} currentPath={path} />;
  };

  return (
    <AuthGate>
      {renderRoute()}
    </AuthGate>
  );
}
