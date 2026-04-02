import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthStore from "../store/authStore";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

function OAuth2CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithTokens } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Login con Google fallito. Riprova.");
      navigate("/login");
      return;
    }

    if (!token || !refreshToken) {
      toast.error("Risposta OAuth2 non valida.");
      navigate("/login");
      return;
    }

    // Salva i token e recupera il profilo utente
    loginWithTokens(token, refreshToken)
      .then(() => {
        toast.success("Benvenuto su Nexus! 🎉");
        navigate("/feed");
      })
      .catch(() => {
        toast.error("Errore durante il login. Riprova.");
        navigate("/login");
      });
  }, []);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--nx-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <LoadingSpinner size="lg" text="Accesso con Google in corso..." />
      </div>
    </div>
  );
}

export default OAuth2CallbackPage;