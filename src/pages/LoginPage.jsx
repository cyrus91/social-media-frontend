import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, resendVerification } from "../services/authService";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import NexusLogo from "../components/NexusLogo";

function LoginPage() {
  const navigate = useNavigate();
  const authLogin = useAuthStore((state) => state.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEmailNotVerified(false);
    setError("");

    const result = await login({ username: username.trim(), password });

    if (result.success) {
      authLogin(result.user, result.token);
      toast.success(`Bentornato, ${result.user.username}!`);
      navigate("/feed");
    } else if (result.emailNotVerified) {
      setEmailNotVerified(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!resendEmail) { toast.error("Inserisci la tua email"); return; }
    setResendLoading(true);
    const result = await resendVerification(resendEmail);
    setResendLoading(false);
    if (result.success) toast.success("Email di verifica inviata!");
    else toast.error(result.error);
  };

  return (
    <div className="nx-auth-bg">
      <div style={{ width: "100%", maxWidth: "420px" }} className="nx-animate-in">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <NexusLogo size={44} />
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--nx-text)", marginBottom: "6px" }}>
            Bentornato
          </h1>
          <p style={{ fontSize: "14px", color: "var(--nx-text-muted)" }}>
            Accedi al tuo account Nexus
          </p>
        </div>

        {/* Form card */}
        <div className="nx-card" style={{ padding: "32px" }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "var(--nx-radius)", padding: "12px 14px", marginBottom: "20px",
                fontSize: "13px", color: "#dc2626", display: "flex", alignItems: "center", gap: "8px"
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Username */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--nx-text-muted)", marginBottom: "6px" }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Il tuo username"
                required
                className="nx-input"
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--nx-text-muted)", marginBottom: "6px" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="La tua password"
                  required
                  className="nx-input"
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-subtle)", padding: "2px" }}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Email not verified banner */}
            {emailNotVerified && (
              <div style={{
                background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)",
                borderRadius: "var(--nx-radius)", padding: "14px", marginBottom: "20px"
              }}>
                <p style={{ fontSize: "13px", color: "#92400e", fontWeight: 500, marginBottom: "10px" }}>
                  ⚠ Email non verificata. Inserisci la tua email per ricevere un nuovo link.
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={e => setResendEmail(e.target.value)}
                    placeholder="tua@email.com"
                    className="nx-input"
                    style={{ flex: 1, fontSize: "13px", padding: "8px 12px" }}
                  />
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="nx-btn nx-btn-primary"
                    style={{ padding: "8px 16px", fontSize: "13px" }}>
                    {resendLoading ? "..." : "Invia"}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="nx-btn nx-btn-primary"
              style={{ width: "100%", padding: "13px", fontSize: "15px", fontWeight: 700 }}>
              {loading ? (
                <><div className="nx-spinner" /><span>Accesso...</span></>
              ) : "Accedi"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
            <div className="nx-divider" style={{ flex: 1 }} />
            <span style={{ fontSize: "12px", color: "var(--nx-text-subtle)" }}>oppure</span>
            <div className="nx-divider" style={{ flex: 1 }} />
          </div>

          {/* Google OAuth placeholder — verrà implementato */}
          <button
            type="button"
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              padding: "12px", border: "1.5px solid var(--nx-border)", borderRadius: "var(--nx-radius)",
              background: "var(--nx-surface-2)", fontSize: "14px", fontWeight: 500,
              color: "var(--nx-text)", cursor: "pointer", transition: "all var(--nx-transition)"
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--nx-border-hover)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--nx-border)"}
            onClick={() => toast("Google login — coming soon!", { icon: "🔜" })}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continua con Google
          </button>
        </div>

        {/* Register link */}
        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--nx-text-muted)" }}>
          Non hai un account?{" "}
          <Link to="/register" style={{ color: "#7c3aed", fontWeight: 600, textDecoration: "none" }}>
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;