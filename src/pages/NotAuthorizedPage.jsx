import { useNavigate } from "react-router-dom";

function NotAuthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="text-7xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Accesso negato</h1>
        <p className="text-gray-500 mb-8">
          Non hai i permessi per visualizzare questa pagina.
        </p>
        <button
          onClick={() => navigate("/feed")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition">
          Torna al Feed
        </button>
      </div>
    </div>
  );
}

export default NotAuthorizedPage;