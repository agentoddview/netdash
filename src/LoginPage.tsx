import React from "react";

const LoginPage: React.FC<{ apiBase: string }> = ({ apiBase }) => {
  const loginUrl = `${apiBase}/auth/roblox/login`;
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b0f1e",
        color: "#eaf0ff",
        padding: "24px",
      }}
    >
      <div
        style={{
          padding: "24px",
          borderRadius: "16px",
          border: "1px solid #1f2740",
          background: "linear-gradient(180deg, #11182d, #0c1225)",
          minWidth: "320px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: "12px" }}>Net Control Center</h1>
        <p style={{ marginTop: 0, marginBottom: "18px", color: "#7d8cab" }}>
          Please login with Roblox to continue.
        </p>
        <a
          href={loginUrl}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px 18px",
            borderRadius: "10px",
            background: "#00b06b",
            color: "#0b0f1e",
            fontWeight: 700,
            textDecoration: "none",
            border: "1px solid #0a8b54",
          }}
        >
          Login with Roblox
        </a>
      </div>
    </div>
  );
};

export default LoginPage;
