import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../services/authService";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token"), [searchParams]);
  const [status, setStatus] = useState(() => (token ? "loading" : "error"));

  useEffect(() => {
    if (!token) return;

    verifyEmail(token).then((result) => {
      if (result.success) {
        setStatus("success");
      } else if (result.expired) {
        setStatus("expired");
      } else {
        setStatus("error");
      }
    });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">

        {status === "loading" && (
          <>
            <div className="animate-spin text-5xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-gray-800">Verifica in corso...</h2>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Email verificata!</h2>
            <p className="text-gray-600 mb-6">
              Il tuo account è attivo. Puoi ora accedere al social.
            </p>
            <Link
              to="/login"
              className="inline-block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg transition hover:opacity-90">
              Vai al Login
            </Link>
          </>
        )}

        {status === "expired" && (
          <>
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Link scaduto</h2>
            <p className="text-gray-600 mb-6">
              Il link di verifica è scaduto. Accedi e richiedi un nuovo link.
            </p>
            <Link
              to="/login"
              className="inline-block w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-lg transition">
              Vai al Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Link non valido</h2>
            <p className="text-gray-600 mb-6">
              Il link di verifica non è valido o è già stato usato.
            </p>
            <Link
              to="/login"
              className="inline-block w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition">
              Vai al Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;