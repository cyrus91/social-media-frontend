import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, resendVerification } from "../services/authService";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

function LoginPage() {
  const navigate = useNavigate();
  const authLogin = useAuthStore((state) => state.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEmailNotVerified(false);

    const result = await login({ username, password });

    if (result.success) {
      authLogin(result.user, result.token);
      toast.success(`Bentornato, ${result.user.username}!`);
      navigate("/feed");
    } else if (result.emailNotVerified) {
      setEmailNotVerified(true);
      toast.error("Devi verificare la tua email prima di accedere");
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (!resendEmail) {
      toast.error("Inserisci la tua email per ricevere il link");
      return;
    }
    setResendLoading(true);
    const result = await resendVerification(resendEmail);
    setResendLoading(false);
    if (result.success) {
      toast.success("Email di verifica reinviata! Controlla la tua casella.");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Bentornato! 👋</h1>
          <p className="text-gray-600">Accedi al tuo account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Il tuo username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="La tua password"
              required
            />
          </div>

          {/* Banner email non verificata */}
          {emailNotVerified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm font-medium mb-3">
                ⚠️ Email non verificata. Inserisci la tua email per ricevere un nuovo link.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-yellow-300 rounded-lg outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="tua@email.com"
                />
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50">
                  {resendLoading ? "..." : "Invia"}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition duration-300 disabled:opacity-50">
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Non hai un account?{" "}
          <Link to="/register" className="text-blue-500 hover:text-blue-600 font-semibold">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;