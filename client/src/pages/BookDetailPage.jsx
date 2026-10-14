import { useEffect, useState } from 'react';
import { ArrowLeft, Bookmark, BookOpen, CalendarDays, Hash } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/StatePanel.jsx';

function hasPlaceholderCover(url) {
  if (!url) return true;
  try {
    const hostname = new URL(url).hostname;
    return hostname === 'example.com' || hostname.endsWith('.example.com');
  } catch {
    return true;
  }
}

export default function BookDetailPage() {
  const { id } = useParams();
  const [state, setState] = useState({ book: null, loading: true, error: '' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ book: null, loading: true, error: '' });
    fetch(`/books/${encodeURIComponent(id || '')}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(response.status === 404 ? 'That book could not be found. It may have moved from the catalog.' : body.error || 'Unable to load this book.');
        return body;
      })
      .then((body) => setState({ book: body.data || null, loading: false, error: body.data ? '' : 'The response did not include a book.' }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ book: null, loading: false, error: error.message || 'Unable to load this book.' });
      });
    return () => controller.abort();
  }, [id]);

  if (state.loading) return <main className="detail-state"><LoadingState label="Opening the book" /></main>;
  if (state.error) return <main className="detail-state"><Link className="back-link" to="/"><ArrowLeft size={16} /> Back to the collection</Link><ErrorState message={state.error} /></main>;

  const { book } = state;
  const genreName = typeof book.genre === 'object' ? book.genre?.name : 'Uncategorized';
  const openLibraryCover = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(book.isbn)}-L.jpg?default=false`;
  const usesPlaceholder = hasPlaceholderCover(book.coverImage);
  const initialCover = usesPlaceholder ? '/images/cover-placeholder.svg' : book.coverImage;

  return (
    <main className="detail-page">
      <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to the collection</Link>
      <div className="detail-layout">
        <div className="detail-cover-panel">
          <span className="detail-cover-label">FROM THE STACKS</span>
          <img className="detail-cover" src={initialCover} alt={`Cover of ${book.title}`} onError={(event) => { if (!event.currentTarget.dataset.fallback && !usesPlaceholder) { event.currentTarget.dataset.fallback = 'true'; event.currentTarget.src = openLibraryCover; } else { event.currentTarget.onerror = null; event.currentTarget.src = '/images/cover-placeholder.svg'; } }} />
          <span className="detail-cover-foot">COLLECTION No. {String(book._id).slice(-6).toUpperCase()}</span>
        </div>
        <article className="detail-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> {genreName.toUpperCase()}</div>
          <h1>{book.title}</h1>
          <p className="detail-author">by {book.author}</p>
          <div className="detail-rule" />
          <p className="detail-description">{book.description || 'No description is available for this title yet.'}</p>
          <div className="detail-facts">
            <div><Hash size={16} /><span><small>ISBN</small>{book.isbn}</span></div>
            <div><BookOpen size={16} /><span><small>IN THE LIBRARY</small>{book.totalCopies} {book.totalCopies === 1 ? 'copy' : 'copies'}</span></div>
            <div><CalendarDays size={16} /><span><small>ON THE SHELF</small>{book.availableCopies} available</span></div>
          </div>
          <button className="button-primary save-book" type="button" onClick={(event) => { event.currentTarget.classList.toggle('saved'); event.currentTarget.setAttribute('aria-pressed', String(event.currentTarget.classList.contains('saved'))); }} aria-pressed="false"><Bookmark size={17} /> Save to my list</button>
        </article>
      </div>
    </main>
  );
}
