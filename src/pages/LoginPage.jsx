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
      toast.error("Devi verificare la tua email prima di accedere");
    } else {
      setError(result.error);
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Il tuo username"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Password con occhio */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="La tua password"
                required
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                {showPassword ? (
                  // Occhio barrato (nascondi)
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  // Occhio aperto (mostra)
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
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
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Non hai un account?{" "}
            <Link to="/register" className="text-blue-500 hover:text-blue-600 font-semibold">
              Registrati
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;