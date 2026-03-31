import { useState } from "react";
import { Link } from "react-router-dom";
import { register, resendVerification } from "../services/authService";
import toast from "react-hot-toast";
import NexusLogo from "../components/NexusLogo";

// Estratto fuori dal componente per evitare re-creazione ad ogni render
function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-subtle)", padding: "2px" }}>
      {show ? (
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
  );
}

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (trimmedUsername.length < 3) { toast.error("Username: minimo 3 caratteri"); return; }
    if (trimmedUsername.length > 20) { toast.error("Username: massimo 20 caratteri"); return; }
    if (!usernameRegex.test(trimmedUsername)) { toast.error("Username: solo lettere, numeri e _"); return; }
    if (!email.includes("@")) { toast.error("Email non valida"); return; }
    if (password.length < 6) { toast.error("Password: minimo 6 caratteri"); return; }
    if (password !== confirmPassword) { toast.error("Le password non coincidono"); return; }

    setLoading(true);
    const result = await register(trimmedUsername, email.trim().toLowerCase(), password);
    setLoading(false);

    if (result.success && result.pendingVerification) {
      setRegisteredEmail(email.trim().toLowerCase());
      setPendingVerification(true);
    } else if (!result.success) {
      toast.error(result.error);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    const result = await resendVerification(registeredEmail);
    setResendLoading(false);
    if (result.success) toast.success("Email di verifica reinviata!");
    else toast.error(result.error);
  };

  // Email verification screen
  if (pendingVerification) {
    return (
      <div className="nx-auth-bg">
        <div style={{ width: "100%", maxWidth: "420px", textAlign: "center" }} className="nx-animate-in">
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <NexusLogo size={44} />
            </div>
          </div>
          <div className="nx-card" style={{ padding: "36px 32px" }}>
            <div style={{
              width: "60px", height: "60px", borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(124,58,237,.15), rgba(6,182,212,.15))",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
              border: "1px solid var(--nx-border)"
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px", color: "var(--nx-text)" }}>
              Controlla la tua email
            </h2>
            <p style={{ fontSize: "14px", color: "var(--nx-text-muted)", marginBottom: "24px", lineHeight: 1.6 }}>
              Abbiamo inviato un link di verifica a <strong style={{ color: "var(--nx-text)" }}>{registeredEmail}</strong>
            </p>
            <button onClick={handleResend} disabled={resendLoading}
              className="nx-btn nx-btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}>
              {resendLoading ? "Invio..." : "Reinvia email"}
            </button>
            <p style={{ marginTop: "16px", fontSize: "13px", color: "var(--nx-text-subtle)" }}>
              <Link to="/login" style={{ color: "#7c3aed", textDecoration: "none" }}>← Torna al login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nx-auth-bg">
      <div style={{ width: "100%", maxWidth: "420px" }} className="nx-animate-in">
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <NexusLogo size={44} />
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--nx-text)", marginBottom: "6px" }}>
            Unisciti a Nexus
          </h1>
          <p style={{ fontSize: "14px", color: "var(--nx-text-muted)" }}>
            Crea il tuo account gratuito
          </p>
        </div>

        <div className="nx-card" style={{ padding: "32px" }}>
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--nx-text-muted)", marginBottom: "6px" }}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="solo lettere, numeri e _" required className="nx-input" />
            </div>

            {/* Email */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--nx-text-muted)", marginBottom: "6px" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tua@email.com" required className="nx-input" />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--nx-text-muted)", marginBottom: "6px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="minimo 6 caratteri" required className="nx-input" style={{ paddingRight: "44px" }} />
                <EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--nx-text-muted)", marginBottom: "6px" }}>Conferma password</label>
              <div style={{ position: "relative" }}>
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="ripeti la password" required className="nx-input" style={{ paddingRight: "44px" }} />
                <EyeToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="nx-btn nx-btn-primary"
              style={{ width: "100%", padding: "13px", fontSize: "15px", fontWeight: 700 }}>
              {loading ? <><div className="nx-spinner" /><span>Registrazione...</span></> : "Crea account"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "var(--nx-text-subtle)", lineHeight: 1.5 }}>
            Registrandoti accetti i{" "}
            <span style={{ color: "#7c3aed", cursor: "pointer" }}>Termini di servizio</span>{" "}e la{" "}
            <span style={{ color: "#7c3aed", cursor: "pointer" }}>Privacy policy</span>
          </p>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--nx-text-muted)" }}>
          Hai già un account?{" "}
          <Link to="/login" style={{ color: "#7c3aed", fontWeight: 600, textDecoration: "none" }}>Accedi</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;