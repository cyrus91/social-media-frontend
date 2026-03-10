import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook per infinite scroll con Intersection Observer
 * 
 * @param {Function} fetchFunction - Funzione che carica i dati (deve ritornare { content, last })
 * @param {Object} options - Opzioni configurazione
 * @returns {Object} - { items, loading, hasMore, error, loadMore, reset }
 */
function useInfiniteScroll(fetchFunction, options = {}) {
  const {
    pageSize = 10,
    initialPage = 0,
    enabled = true,
  } = options;

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [shouldLoadInitial, setShouldLoadInitial] = useState(true);

  const isFetching = useRef(false);

  // Funzione per caricare i dati
  const loadMore = useCallback(async () => {
    if (isFetching.current || !hasMore || !enabled) {
      console.log("⏸️ Skip loadMore:", { 
        isFetching: isFetching.current, 
        hasMore, 
        enabled 
      });
      return;
    }

    isFetching.current = true;
    setLoading(true);
    setError(null);

    console.log(`📥 Caricamento pagina ${page}...`);

    try {
      const result = await fetchFunction(page, pageSize);

      if (result.success) {
        const newItems = result.data.content || result.data;
        const isLastPage = result.data.last ?? (newItems.length < pageSize);

        console.log(`✅ Caricati ${newItems.length} items`, {
          isLastPage,
          page,
          totalItems: items.length + newItems.length
        });

        setItems((prev) => [...prev, ...newItems]);
        setHasMore(!isLastPage);
        setPage((prev) => prev + 1);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("❌ Errore caricamento:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [page, pageSize, hasMore, enabled, fetchFunction, items.length]);

  // Carica prima pagina automaticamente (SOLO UNA VOLTA!)
  useEffect(() => {
    if (shouldLoadInitial && enabled && items.length === 0 && !loading && !isFetching.current) {
      console.log("🚀 Caricamento iniziale prima pagina");
      setShouldLoadInitial(false);
      loadMore();
    }
  }, [shouldLoadInitial, enabled, items.length, loading, loadMore]);

  // Reset
  const reset = useCallback(() => {
    console.log("🔄 Reset infinite scroll");
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    setShouldLoadInitial(true);
    isFetching.current = false;
  }, [initialPage]);

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
  };
}

export default useInfiniteScroll;