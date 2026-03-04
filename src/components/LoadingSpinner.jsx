function LoadingSpinner({ size = 'md', text = 'Caricamento...' }) {
  // Dimensioni dello spinner
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Spinner circolare */}
      <div
        className={`${sizes[size]} border-blue-500 border-t-transparent rounded-full animate-spin`}
      />
      
      {/* Testo sotto lo spinner */}
      {text && (
        <p className="mt-4 text-gray-500 text-sm font-medium">
          {text}
        </p>
      )}
    </div>
  )
}

export default LoadingSpinner