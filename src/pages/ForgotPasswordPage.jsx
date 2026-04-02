import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/authService";
import NexusLogo from "../components/NexusLogo";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await requestPasswordReset(email.trim());
    setLoading(false);
    if (result.oauthAccount) {
      setError("Questo account usa il login con Google. Non puoi resettare la password.");
    } else {
      // Mostra sempre il messaggio di successo per sicurezza
      setSent(true);
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
            Password dimenticata?
          </h1>
          <p style={{ fontSize: "14px", color: "var(--nx-text-muted)" }}>
            Inserisci la tua email e ti inviamo un link per reimpostarla.
          </p>
        </div>

        <div className="nx-card" style={{ padding: "32px" }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📬</div>
              <h2 style={{ fontWeight: 700, fontSize: "16px", color: "var(--nx-text)", marginBottom: "8px" }}>
                Controlla la tua email
              </h2>
              <p style={{ fontSize: "13px", color: "var(--nx-text-muted)", lineHeight: 1.6, marginBottom: "20px" }}>
                Se l'indirizzo <strong>{email}</strong> è associato a un account Nexus, riceverai un link di reset entro pochi minuti.
              </p>
              <Link to="/login" style={{ color: "#7c3aed", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                ← Torna al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "var(--nx-radius)", padding: "12px 14px", marginBottom: "18px",
                  fontSize: "13px", color: "#dc2626",
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--nx-text-muted)", marginBottom: "6px" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tua@email.com"
                  required
                  className="nx-input"
                />
              </div>

              <button type="submit" disabled={loading} className="nx-btn nx-btn-primary"
                style={{ width: "100%", padding: "13px", fontSize: "15px", fontWeight: 700 }}>
                {loading
                  ? <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /><span>Invio in corso...</span></>
                  : "Invia link di reset"}
              </button>
            </form>
          )}
        </div>

        {!sent && (
          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--nx-text-muted)" }}>
            Ricordi la password?{" "}
            <Link to="/login" style={{ color: "#7c3aed", fontWeight: 600, textDecoration: "none" }}>
              Accedi
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;