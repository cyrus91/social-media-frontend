import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/authService";
import NexusLogo from "../components/NexusLogo";
import toast from "react-hot-toast";

const EyeIcon = ({ showPassword }) => showPassword ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token"), [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) return (
    <div className="nx-auth-bg">
      <div style={{ maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <div className="nx-card" style={{ padding: "40px 32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>❌</div>
          <h2 style={{ fontWeight: 700, color: "var(--nx-text)", marginBottom: "8px" }}>Link non valido</h2>
          <p style={{ fontSize: "13px", color: "var(--nx-text-muted)", marginBottom: "20px" }}>
            Questo link di reset non è valido. Richiedine uno nuovo.
          </p>
          <Link to="/forgot-password" className="nx-btn nx-btn-primary" style={{ display: "inline-block", padding: "10px 24px", textDecoration: "none", fontSize: "13px" }}>
            Richiedi nuovo link
          </Link>
        </div>
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError("La password deve essere di almeno 6 caratteri."); return; }
    if (password !== confirm) { setError("Le password non coincidono."); return; }
    setLoading(true);
    setError("");
    const result = await resetPassword(token, password);
    setLoading(false);
    if (result.success) {
      toast.success("Password reimpostata con successo!");
      navigate("/login");
    } else if (result.expired) {
      setError("Il link è scaduto. Richiedine uno nuovo.");
    } else {
      setError("Link non valido o già utilizzato.");
    }
  };

  return (
    <div className="nx-auth-bg">
      <div style={{ width: "100%", maxWidth: "420px" }} className="nx-animate-in">
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <NexusLogo size={44} />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--nx-text)", marginBottom: "6px" }}>
            Nuova password
          </h1>
          <p style={{ fontSize: "14px", color: "var(--nx-text-muted)" }}>
            Scegli una nuova password per il tuo account.
          </p>
        </div>

        <div className="nx-card" style={{ padding: "32px" }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "var(--nx-radius)", padding: "12px 14px", marginBottom: "18px",
                fontSize: "13px", color: "#dc2626",
              }}>
                {error}
                {error.includes("scaduto") && (
                  <> <Link to="/forgot-password" style={{ color: "#dc2626", fontWeight: 700 }}>Richiedine uno nuovo.</Link></>
                )}
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--nx-text-muted)", marginBottom: "6px" }}>
                Nuova password
              </label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Almeno 6 caratteri"
                  required className="nx-input" style={{ paddingRight: "44px" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-subtle)" }}>
                  <EyeIcon showPassword={showPassword} />
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--nx-text-muted)", marginBottom: "6px" }}>
                Conferma password
              </label>
              <input type={showPassword ? "text" : "password"} value={confirm}
                onChange={e => setConfirm(e.target.value)} placeholder="Ripeti la password"
                required className="nx-input" />
            </div>

            <button type="submit" disabled={loading} className="nx-btn nx-btn-primary"
              style={{ width: "100%", padding: "13px", fontSize: "15px", fontWeight: 700 }}>
              {loading
                ? <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /><span>Salvataggio...</span></>
                : "Salva nuova password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;