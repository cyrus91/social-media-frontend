import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../services/authService";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token"), [searchParams]);
  const [status, setStatus] = useState(() => (token ? "loading" : "error"));

  useEffect(() => {
    if (!token) return;
    verifyEmail(token).then(result => {
      if (result.success) setStatus("success");
      else if (result.expired) setStatus("expired");
      else setStatus("error");
    });
  }, [token]);

  const STATES = {
    loading: { emoji: "⏳", title: "Verifica in corso...", text: "", btnLabel: null, btnStyle: null },
    success: { emoji: "🎉", title: "Email verificata!", text: "Il tuo account è attivo. Puoi ora accedere al social.", btnLabel: "Vai al Login", btnStyle: "var(--nx-grad-btn)" },
    expired: { emoji: "⏰", title: "Link scaduto", text: "Il link di verifica è scaduto. Accedi e richiedi un nuovo link.", btnLabel: "Vai al Login", btnStyle: "linear-gradient(135deg,#f97316,#ef4444)" },
    error:   { emoji: "❌", title: "Link non valido", text: "Il link di verifica non è valido o è già stato usato.", btnLabel: "Vai al Login", btnStyle: "linear-gradient(135deg,#6b7280,#4b5563)" },
  };

  const s = STATES[status] || STATES.error;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--nx-grad-brand)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-xl)", boxShadow: "var(--nx-shadow-lg)", padding: "40px 32px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: status === "loading" ? "48px" : "56px", marginBottom: "16px", animation: status === "loading" ? "spin 1.5s linear infinite" : "none", display: "inline-block" }}>
          {s.emoji}
        </div>
        <h2 style={{ fontWeight: 800, fontSize: "22px", color: "var(--nx-text)", marginBottom: "10px" }}>{s.title}</h2>
        {s.text && <p style={{ fontSize: "14px", color: "var(--nx-text-muted)", marginBottom: "24px", lineHeight: 1.6 }}>{s.text}</p>}
        {s.btnLabel && (
          <Link to="/login" style={{ display: "block", width: "100%", background: s.btnStyle, color: "#fff", borderRadius: "var(--nx-radius-full)", padding: "12px 0", fontSize: "14px", fontWeight: 600, textDecoration: "none", transition: "opacity var(--nx-transition)" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            {s.btnLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;