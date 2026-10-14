import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import BookCard from '../components/BookCard.jsx';
import GenreFilter from '../components/GenreFilter.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/StatePanel.jsx';
import { fetchGenres, useBooks } from '../hooks/useBooks.js';

const PAGE_SIZE = 8;

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const genre = params.get('genre') || '';
  const search = params.get('search') || '';
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
  const [genres, setGenres] = useState([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [genresError, setGenresError] = useState('');
  const [genreRevision, setGenreRevision] = useState(0);
  const [booksRevision, setBooksRevision] = useState(0);
  const { data: books, pagination, loading, error } = useBooks({ genre, search, page, limit: PAGE_SIZE, revision: booksRevision });

  useEffect(() => {
    const controller = new AbortController();
    setGenresLoading(true);
    setGenresError('');
    fetchGenres(controller.signal)
      .then(setGenres)
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setGenresError(fetchError.message || 'Unable to load genres.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setGenresLoading(false);
      });
    return () => controller.abort();
  }, [genreRevision]);

  const updateQuery = useCallback((key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const changePage = (nextPage) => {
    const next = new URLSearchParams(params);
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    setParams(next, { replace: true });
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const activeGenre = genres.find((item) => item._id === genre);
  const hasFilters = Boolean(search || genre);

  return (
    <main>
      <section className="catalog-intro">
        <div className="intro-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> THE LIBRARY, RECONSIDERED</div>
          <h1>Find your next<br /><em>somewhere else.</em></h1>
          <p className="intro-note">Stories to take you out of the everyday.<br className="desktop-break" /> Browse a shelf, follow a hunch, stay awhile.</p>
          <a className="intro-scroll" href="#catalog"><span>Explore the shelves</span><ArrowDown size={15} /></a>
        </div>
        <div className="intro-art" aria-hidden="true">
          <div className="sun-disc" />
          <div className="art-spine spine-one" />
          <div className="art-spine spine-two" />
          <div className="art-spine spine-three" />
          <div className="art-book"><span>FIELD<br />NOTES</span><i>VOL. 04</i></div>
          <div className="art-label">A GOOD BOOK<br />CHANGES THE ROOM</div>
          <Sparkles className="art-spark" size={23} />
        </div>
        <div className="intro-index"><span>01</span><span className="index-rule" /><span>OPEN COLLECTION</span></div>
      </section>

      <section className="catalog-section" id="catalog" aria-labelledby="catalog-heading">
        <div className="section-heading-row">
          <div><div className="eyebrow"><span className="eyebrow-line" /> TAKE A LOOK AROUND</div><h2 id="catalog-heading">The collection<span className="heading-dot">.</span></h2></div>
          <p className="collection-aside">A few pages can change<br />the shape of an afternoon.</p>
        </div>

        <div className="catalog-toolbar">
          <SearchBar value={search} onChange={(value) => updateQuery('search', value)} />
          <div className="toolbar-divider" />
          <span className="filter-label"><SlidersHorizontal size={15} /> FILTER</span>
          <GenreFilter genres={genres} value={genre} onChange={(value) => updateQuery('genre', value)} loading={genresLoading} error={genresError} />
          <span className="result-count" aria-live="polite">{loading ? '—' : (pagination?.total ?? 0)} titles</span>
        </div>
        {genresError && <p className="inline-error" role="alert">Genres could not be loaded: {genresError} <button type="button" onClick={() => setGenreRevision((revision) => revision + 1)}>Retry</button></p>}
        {hasFilters && <div className="active-filters" aria-label="Active filters">
          <span>Showing {activeGenre?.name || 'all genres'}{search ? ` matching “${search}”` : ''}</span>
          <button type="button" onClick={() => { setParams({}, { replace: true }); }}>Clear filters</button>
        </div>}

        {error ? <ErrorState message={error} onRetry={() => setBooksRevision((revision) => revision + 1)} />
          : loading ? <LoadingState label="Finding books for you" />
            : books.length === 0 ? <EmptyState title={hasFilters ? 'Nothing on this shelf yet' : 'The catalog is empty'} detail={hasFilters ? 'Try another title, author, or genre.' : 'Check back soon for new arrivals.'} />
              : <>
                <div className="book-grid">
                  {books.map((book, index) => <BookCard key={book._id} book={book} index={index} />)}
                </div>
                {pagination && pagination.totalPages > 1 && <nav className="pagination" aria-label="Catalog pages">
                  <span className="pagination-summary">PAGE {pagination.page} OF {pagination.totalPages}</span>
                  <div className="pagination-actions">
                    <button type="button" className="page-button" aria-label="Previous page" disabled={page <= 1} onClick={() => changePage(page - 1)}><ArrowLeft size={17} /></button>
                    <button type="button" className="page-button" aria-label="Next page" disabled={page >= pagination.totalPages} onClick={() => changePage(page + 1)}><ArrowRight size={17} /></button>
                  </div>
                </nav>}
              </>}
      </section>
    </main>
  );
}
