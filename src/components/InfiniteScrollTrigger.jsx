import { useEffect, useRef } from "react";

/**
 * Componente trigger per infinite scroll
 * Usa Intersection Observer per rilevare quando è visibile
 */
function InfiniteScrollTrigger({ onIntersect, loading, hasMore }) {
  const observerTarget = useRef(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          console.log("👀 Trigger visibile - carico più post");
          onIntersect();
        }
      },
      {
        root: null, // viewport
        rootMargin: "200px", // inizia a caricare 200px prima di arrivare in fondo
        threshold: 0.1,
      }
    );

    observer.observe(target);

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [onIntersect, loading, hasMore]);

  return (
    <div
      ref={observerTarget}
      className="w-full py-8 flex justify-center items-center">
      {loading && (
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Caricamento...</p>
        </div>
      )}

      {!loading && !hasMore && (
        <div className="text-center">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-gray-500 font-semibold">
            Hai visto tutti i post!
          </p>
        </div>
      )}
    </div>
  );
}

export default InfiniteScrollTrigger;