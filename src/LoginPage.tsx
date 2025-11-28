import React from "react";
import DiscordIcon from "./icons/DiscordIcon";

const LoginPage: React.FC<{ apiBase: string }> = ({ apiBase }) => {
  const robloxLoginUrl = `${apiBase}/auth/roblox/login`;
  const discordLoginUrl = `${apiBase}/auth/discord/login`;
  const baseButton = "login-btn-base";

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
        <style>
          {`
            .login-btn-base {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              padding: 12px 18px;
              border-radius: 10px;
              font-weight: 700;
              font-size: 14px;
              text-decoration: none;
              border: 1px solid transparent;
              flex: 1;
              min-width: 140px;
              cursor: pointer;
              box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
              transition: all 150ms ease;
            }
            .login-btn-base:hover {
              box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
              transform: translateY(-1px);
            }
            .login-btn-base:active {
              transform: scale(0.98);
            }
            .login-btn-roblox {
              background: #22c55e;
              color: #000000;
              border-color: #15803d;
            }
            .login-btn-roblox:hover {
              background: #16a34a;
            }
            .login-btn-discord {
              background: #5865f2;
              color: #ffffff;
              border-color: #4752c4;
            }
            .login-btn-discord:hover {
              background: #4752c4;
            }
            .login-btn-row {
              display: flex;
              gap: 16px;
              margin-top: 24px;
              flex-wrap: wrap;
              justify-content: center;
            }
          `}
        </style>
        <h1 style={{ marginTop: 0, marginBottom: "12px" }}>NET Control Center</h1>
        <p style={{ marginTop: 0, marginBottom: "18px", color: "#7d8cab" }}>
          Please login with Roblox and Discord to continue.
        </p>
        <div className="login-btn-row">
          <button
            type="button"
            onClick={() => {
              window.location.href = robloxLoginUrl;
            }}
            className={`${baseButton} login-btn-roblox`}
          >
            Login with Roblox
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = discordLoginUrl;
            }}
            className={`${baseButton} login-btn-discord`}
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
