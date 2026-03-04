import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { fetchExplorePosts } from '../services/postService'

function ExplorePage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  
  const loadPosts = async (pageNum = 0) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await fetchExplorePosts(pageNum, 10)
      
      if (result.success) {
        const newPosts = result.data.content || result.data
        
        if (pageNum === 0) {
          setPosts(newPosts)
        } else {
          setPosts(prev => [...prev, ...newPosts])
        }
        
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
  
  useEffect(() => {
    loadPosts(0)
  }, [])
  
  const handleRefresh = () => {
    setPage(0)
    setHasMore(true)
    loadPosts(0)
  }
  
  const handleLikeUpdate = (postId, isLiked) => {
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
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-2xl mx-auto p-4 mt-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Esplora 🌍
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Scopri nuovi contenuti e persone da seguire
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
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
        </div>
        
        {/* Loading state */}
        {loading && posts.length === 0 && (
          <LoadingSpinner size="lg" text="Caricamento post..." />
        )}
        
        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-semibold mb-2">⚠️ Errore</p>
            <p className="text-red-600 text-sm mb-4">{error}</p>
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
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Nessun contenuto da esplorare
            </h2>
            <p className="text-gray-600">
              Non ci sono nuovi post al momento
            </p>
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
        
        {/* Load more */}
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
        
        {/* End */}
        {!loading && !hasMore && posts.length > 0 && (
          <div className="mt-6 text-center text-gray-500 text-sm">
            🎉 Hai visto tutti i post!
          </div>
        )}
        
      </div>
    </div>
  )
}

export default ExplorePage