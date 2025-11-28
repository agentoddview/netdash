import React from "react";
import DiscordIcon from "./icons/DiscordIcon";

const LoginPage: React.FC<{ apiBase: string }> = ({ apiBase }) => {
  const robloxLoginUrl = `${apiBase}/auth/roblox/login`;
  const discordLoginUrl = `${apiBase}/auth/discord/login`;

  const baseButton: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 18px",
    borderRadius: "10px",
    fontWeight: 700,
    textDecoration: "none",
    border: "1px solid transparent",
    flex: 1,
    minWidth: "140px",
    cursor: "pointer",
  };

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
        <h1 style={{ marginTop: 0, marginBottom: "12px" }}>NET Control Center</h1>
        <p style={{ marginTop: 0, marginBottom: "18px", color: "#7d8cab" }}>
          Please login with Roblox and Discord to continue.
        </p>
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={() => {
              window.location.href = robloxLoginUrl;
            }}
            style={{
              ...baseButton,
              background: "#00b06b",
              color: "#0b0f1e",
              borderColor: "#0a8b54",
            }}
          >
            Login with Roblox
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = discordLoginUrl;
            }}
            style={{
              ...baseButton,
              background: "#5865F2",
              color: "#fff",
              borderColor: "#4a53d9",
            }}
          >
            <DiscordIcon size={18} />
            Login with Discord
          </button>
        </div>
      </div>
      <div
        style={{
          marginTop: "24px",
          textAlign: "center",
          fontSize: "12px",
          color: "#7d8cab",
        }}
      >
        <a
          href="https://netransit.net/terms"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#9cb3d8", textDecoration: "underline" }}
        >
          Terms of Service
        </a>
        <span style={{ margin: "0 8px" }}>•</span>
        <a
          href="https://netransit.net/privacy"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#9cb3d8", textDecoration: "underline" }}
        >
          Privacy Policy
        </a>
      </div>
    </div>
  );
};

export default LoginPage;
