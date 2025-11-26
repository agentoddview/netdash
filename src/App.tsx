import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./dashboard";
import SettingsPage from "./SettingsPage";
import ServersPage from "./ServersPage";
import ServerDetailPage from "./ServerDetailPage";
import AuthGate from "./AuthGate";
import { ThemeProvider } from "./ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthGate>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/servers" element={<ServersPage />} />
          <Route path="/servers/:serverId" element={<ServerDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthGate>
    </ThemeProvider>
  );
}
