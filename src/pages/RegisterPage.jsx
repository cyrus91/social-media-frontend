import { useState } from "react";
import { Link } from "react-router-dom";
import { register } from "../services/authService";
import { resendVerification } from "../services/authService";
import toast from "react-hot-toast";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const usernameRegex = /^[a-zA-Z0-9_]+$/;

    if (trimmedUsername.length < 3) {
      toast.error("Lo username deve essere almeno 3 caratteri");
      return;
    }
    if (trimmedUsername.length > 20) {
      toast.error("Lo username deve essere massimo 20 caratteri");
      return;
    }
    if (!usernameRegex.test(trimmedUsername)) {
      toast.error("Lo username può contenere solo lettere, numeri e underscore");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Email non valida");
      return;
    }
    if (password.length < 6) {
      toast.error("La password deve essere almeno 6 caratteri");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Le password non coincidono");
      return;
    }

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
    if (result.success) {
      toast.success("Email di verifica reinviata!");
    } else {
      toast.error(result.error);
    }
  };

  // Schermata di attesa verifica email
  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">📬</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Controlla la tua email!
          </h2>
          <p className="text-gray-600 mb-2">
            Abbiamo inviato un link di verifica a:
          </p>
          <p className="font-semibold text-indigo-600 mb-6">{registeredEmail}</p>
          <p className="text-sm text-gray-500 mb-6">
            Clicca sul link nell'email per attivare il tuo account. Il link scade tra 24 ore.
          </p>
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 mb-4">
            {resendLoading ? "Invio in corso..." : "📧 Reinvia email"}
          </button>
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
            Torna al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Crea Account 🚀</h1>
          <p className="text-gray-600">Unisciti alla community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="il_tuo_username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="tua@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Almeno 6 caratteri"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conferma Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Ripeti la password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition duration-300 disabled:opacity-50">
            {loading ? "Registrazione in corso..." : "Crea Account"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Hai già un account?{" "}
          <Link to="/login" className="text-blue-500 hover:text-blue-600 font-semibold">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;