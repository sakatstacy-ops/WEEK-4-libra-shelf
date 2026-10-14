import { useEffect, useState } from 'react';

async function readJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return body;
}

export function useBooks({ genre, search, page, limit = 8, revision = 0 }) {
  const [state, setState] = useState({ data: [], pagination: null, loading: true, error: '' });

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (genre) params.set('genre', genre);
    if (search.trim()) params.set('search', search.trim());

    setState((current) => ({ ...current, loading: true, error: '' }));
    fetch(`/books?${params.toString()}`, { signal: controller.signal })
      .then(readJson)
      .then((result) => setState({ data: result.data || [], pagination: result.pagination || null, loading: false, error: '' }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setState({ data: [], pagination: null, loading: false, error: error.message || 'Unable to load books.' });
        }
      });

    return () => controller.abort();
  }, [genre, search, page, limit, revision]);

  return state;
}

export async function fetchGenres(signal) {
  const response = await fetch('/genres', { signal });
  const result = await readJson(response);
  return result.data || [];
}
