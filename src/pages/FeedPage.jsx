import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'
import LoadingSpinner from '../components/LoadingSpinner'
import CreatePostModal from '../components/CreatePostModal'
import { fetchPosts } from '../services/postService'

function FeedPage() {
  // ============================================
  // STATE
  // ============================================
  const [posts, setPosts] = useState([])           // Lista post
  const [loading, setLoading] = useState(true)     // Stato caricamento
  const [error, setError] = useState(null)         // Errore (se presente)
  const [page, setPage] = useState(0)              // Pagina corrente (per paginazione)
  const [hasMore, setHasMore] = useState(true)     // Ci sono altri post da caricare?
  const [showCreateModal, setShowCreateModal] = useState(false) // Modal nuovo post
  
  // ============================================
  // FETCH POSTS (chiamata API)
  // ============================================
  const loadPosts = async (pageNum = 0) => {
    try {
      setLoading(true)
      setError(null)
      
      // Chiama API
      const result = await fetchPosts(pageNum, 10)  // page=0, size=10
      
      if (result.success) {
        const newPosts = result.data.content || result.data
        
        // Se è la prima pagina, sostituisci i post
        if (pageNum === 0) {
          setPosts(newPosts)
        } else {
          // Altrimenti, aggiungi alla lista esistente (infinite scroll)
          setPosts(prev => [...prev, ...newPosts])
        }
        
        // Controlla se ci sono altri post
        if (result.data.last === true || newPosts.length === 0) {
          setHasMore(false)
        }
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Errore nel caricamento dei post')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  // ============================================
  // useEffect: Carica post al mount del componente
  // ============================================
  useEffect(() => {
    loadPosts(0)
  }, []) // Array vuoto = esegui solo una volta (al mount)
  
  // ============================================
  // Handle refresh (pull to refresh / reload button)
  // ============================================
  const handleRefresh = () => {
    setPage(0)
    setHasMore(true)
    loadPosts(0)
  }
  
  // ============================================
  // Handle like update (callback da PostCard)
  // ============================================
  const handleLikeUpdate = (postId, isLiked) => {
    // Aggiorna il post nella lista locale
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              liked: isLiked,
              likeCount: isLiked ? post.likeCount + 1 : post.likeCount - 1
            }
          : post
      )
    )
  }
  
  // ============================================
  // Handle post created (callback da CreatePostModal)
  // ============================================
  const handlePostCreated = (newPost) => {
    // Aggiungi il nuovo post in cima alla lista (optimistic UI)
    setPosts(prevPosts => [newPost, ...prevPosts])
  }
  
  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-2xl mx-auto p-4 mt-8">
        
        {/* Header con pulsanti */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Home 🏠
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Post degli utenti che segui
            </p>
          </div>
          
          {/* Buttons */}
          <div className="flex space-x-3">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              <svg
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Aggiorna</span>
            </button>
            
            {/* New post button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuovo Post</span>
            </button>
          </div>
        </div>
        
        {/* Loading state */}
        {loading && posts.length === 0 && (
          <LoadingSpinner size="lg" text="Caricamento post..." />
        )}
        
        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-semibold mb-2">
              ⚠️ Errore
            </p>
            <p className="text-red-600 text-sm mb-4">
              {error}
            </p>
            <button
              onClick={handleRefresh}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              Riprova
            </button>
          </div>
        )}
        
        {/* Empty state */}
        {!loading && !error && posts.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Il tuo feed è vuoto
            </h2>
            <p className="text-gray-600 mb-6">
              Inizia a seguire qualcuno per vedere i loro post!
            </p>
            <Link
              to="/explore"
              className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Esplora nuovi utenti
            </Link>
          </div>
        )}
        
        {/* Posts list */}
        {!loading && !error && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLikeUpdate={handleLikeUpdate}
              />
            ))}
          </div>
        )}
        
        {/* Load more button (se ci sono altri post) */}
        {!loading && hasMore && posts.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                const nextPage = page + 1
                setPage(nextPage)
                loadPosts(nextPage)
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg transition"
            >
              Carica altri post
            </button>
          </div>
        )}
        
        {/* End of feed */}
        {!loading && !hasMore && posts.length > 0 && (
          <div className="mt-6 text-center text-gray-500 text-sm">
            🎉 Hai visto tutti i post!
          </div>
        )}
        
      </div>
      
      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
      />
      
    </div>
  )
}

export default FeedPage