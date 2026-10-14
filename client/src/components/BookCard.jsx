import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function fallbackCover(book) {
  return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(book.isbn)}-M.jpg?default=false`;
}

function initialCover(book) {
  if (!book.coverImage) return fallbackCover(book);
  try {
    const hostname = new URL(book.coverImage).hostname;
    if (hostname === 'example.com' || hostname.endsWith('.example.com')) return '/images/cover-placeholder.svg';
  } catch {
    return '/images/cover-placeholder.svg';
  }
  return book.coverImage;
}

export default function BookCard({ book, index = 0 }) {
  const cover = initialCover(book);
  const genreName = typeof book.genre === 'object' ? book.genre?.name : 'Uncategorized';

  return (
    <article className="book-card" style={{ '--card-order': index }}>
      <Link className="book-card-link" to={`/book/${book._id}`} aria-label={`View ${book.title} by ${book.author}`}>
        <div className="book-cover-wrap">
          <img
            className="book-cover"
            src={cover}
            alt={`Cover of ${book.title}`}
            loading="lazy"
            onError={(event) => {
              if (!event.currentTarget.dataset.fallback) {
                event.currentTarget.dataset.fallback = 'true';
                event.currentTarget.src = fallbackCover(book);
              } else {
                event.currentTarget.onerror = null;
                event.currentTarget.src = '/images/cover-placeholder.svg';
              }
            }}
          />
          <span className="cover-arrow" aria-hidden="true"><ArrowUpRight size={17} /></span>
        </div>
        <div className="book-card-meta">
          <span className="book-genre">{genreName}</span>
          <h3>{book.title}</h3>
          <p>{book.author}</p>
        </div>
      </Link>
    </article>
  );
}
