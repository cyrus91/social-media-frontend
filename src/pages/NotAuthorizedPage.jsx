import { useNavigate } from "react-router-dom";

function NotAuthorizedPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100dvh", background: "var(--nx-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-xl)", boxShadow: "var(--nx-shadow-lg)", padding: "48px 32px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🚫</div>
        <h1 style={{ fontWeight: 800, fontSize: "24px", color: "var(--nx-text)", marginBottom: "8px" }}>Accesso negato</h1>
        <p style={{ fontSize: "14px", color: "var(--nx-text-muted)", marginBottom: "28px" }}>
          Non hai i permessi per visualizzare questa pagina.
        </p>
        <button onClick={() => navigate("/feed")}
          style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff", border: "none", borderRadius: "var(--nx-radius-full)", padding: "12px 32px", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "opacity var(--nx-transition)" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          Torna al Feed
        </button>
      </div>
    </div>
  );
}

export default NotAuthorizedPage;