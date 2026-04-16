import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthStore from "../store/authStore";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

function OAuth2CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithTokens } = useAuthStore();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Login con Google fallito. Riprova.");
      navigate("/login");
      return;
    }

    if (!code) {
      toast.error("Risposta OAuth2 non valida.");
      navigate("/login");
      return;
    }

    api.get("/auth/oauth2/token", { params: { code } })
      .then(({ data }) => loginWithTokens(data.token, data.refreshToken))
      .then(() => {
        toast.success("Benvenuto su Nexus! 🎉");
        navigate("/feed");
      })
      .catch((err) => {
        const isExpired =
          err.response?.status === 410 ||
          err.response?.data?.error === "INVALID_OR_EXPIRED_CODE";
        toast.error(
          isExpired
            ? "Il link di accesso è scaduto. Effettua di nuovo il login."
            : "Errore durante il login. Riprova."
        );
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