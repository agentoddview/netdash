import React from "react";
import DashboardPage from "./dashboard";
import AuthGate from "./AuthGate";

export default function App() {
  return (
    <AuthGate>
      <DashboardPage />
    </AuthGate>
  );
}
