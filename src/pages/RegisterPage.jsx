import { useState } from "react";
import { Link } from "react-router-dom";
import { register, resendVerification } from "../services/authService";
import toast from "react-hot-toast";

// Icona occhio — dichiarata fuori dal componente per evitare ricreazione ad ogni render
const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

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

    if (trimmedUsername.length < 3) { toast.error("Lo username deve essere almeno 3 caratteri"); return; }
    if (trimmedUsername.length > 20) { toast.error("Lo username deve essere massimo 20 caratteri"); return; }
    if (!usernameRegex.test(trimmedUsername)) { toast.error("Lo username può contenere solo lettere, numeri e underscore"); return; }
    if (!email.includes("@")) { toast.error("Email non valida"); return; }
    if (password.length < 6) { toast.error("La password deve essere almeno 6 caratteri"); return; }
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

  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">📬</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Controlla la tua email!</h2>
          <p className="text-gray-600 mb-2">Abbiamo inviato un link di verifica a:</p>
          <p className="font-semibold text-purple-600 mb-6">{registeredEmail}</p>
          <p className="text-sm text-gray-500 mb-6">
            Clicca sul link nell'email per attivare il tuo account. Il link scade tra 24 ore.
          </p>
          <button onClick={handleResend} disabled={resendLoading}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 mb-4">
            {resendLoading ? "Invio in corso..." : "📧 Reinvia email"}
          </button>
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">Torna al login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Crea Account 🎉</h1>
          <p className="text-gray-600">Unisciti alla community!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Il tuo username" required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="La tua email" required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition" />
          </div>

          {/* Password con occhio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Almeno 6 caratteri" required
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {/* Conferma Password con occhio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Conferma Password</label>
            <div className="relative">
              <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ripeti la password" required
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                <EyeIcon open={showConfirmPassword} />
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-lg transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Registrazione in corso..." : "Registrati"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Hai già un account?{" "}
            <Link to="/login" className="text-purple-500 hover:text-purple-600 font-semibold">Accedi</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;