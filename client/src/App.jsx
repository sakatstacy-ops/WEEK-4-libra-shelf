import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { ArrowLeft, Bookmark, Menu, Search } from 'lucide-react';
import CatalogPage from './pages/CatalogPage.jsx';
import BookDetailPage from './pages/BookDetailPage.jsx';

export default function App() {
  const location = useLocation();
  const isDetail = location.pathname.startsWith('/book/');

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="Stacks home">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span>stacks<span className="brand-period">.</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link className={!isDetail ? 'nav-link active' : 'nav-link'} to="/">Discover</Link>
            <a className="nav-link" href="/#catalog">Catalog</a>
          </nav>
          <div className="header-actions">
            <Link className="saved-link" to="/" aria-label="Saved books"><Bookmark size={17} strokeWidth={1.8} /><span>Saved</span></Link>
            <button className="mobile-menu" type="button" aria-label="Open navigation"><Menu size={20} /></button>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/book/:id" element={<BookDetailPage />} />
        <Route path="*" element={<main className="route-fallback"><Search size={24} /><h1>Page not found</h1><Link className="text-link" to="/">Back to the catalog</Link></main>} />
      </Routes>

      {isDetail && <Link className="floating-back" to="/" aria-label="Back to catalog"><ArrowLeft size={18} /></Link>}
      <footer className="site-footer"><span>Stacks Library</span><span>Find a story worth staying up for.</span><span>Open shelves, curious minds.</span></footer>
    </div>
  );
}
