import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ArrowLeft, Bookmark, CalendarDays, LogOut, Menu, Search, UserRound } from 'lucide-react';
import CatalogPage from './pages/CatalogPage.jsx';
import BookDetailPage from './pages/BookDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ReadingListPage from './pages/ReadingListPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import useAuth from './hooks/useAuth.js';
import useReadingList from './hooks/useReadingList.js';

export default function App() {
  const location = useLocation();
  const isDetail = location.pathname.startsWith('/book/');
  const { user, status, logout } = useAuth();
  const { readingList } = useReadingList();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="Stacks home">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span>stacks<span className="brand-period">.</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link className={!isDetail && location.pathname === '/' ? 'nav-link active' : 'nav-link'} to="/">Discover</Link>
            <Link className={location.pathname === '/booking' ? 'nav-link active' : 'nav-link'} to="/booking"><CalendarDays size={14} /> Space booking</Link>
          </nav>
          <div className="header-actions">
            <Link className="saved-link" to="/reading-list" aria-label={`Reading list, ${readingList.length} saved`}><Bookmark size={17} strokeWidth={1.8} /><span>Saved</span><b className="saved-count">{readingList.length}</b></Link>
            {status !== 'loading' && (user ? <><Link className="account-link" to="/booking"><UserRound size={15} /><span>{user.email.split('@')[0]}</span></Link><button className="logout-button" type="button" onClick={logout} aria-label="Sign out"><LogOut size={16} /></button></> : <Link className="account-link" to="/login">Sign in</Link>)}
            <button className="mobile-menu" type="button" aria-label="Open navigation"><Menu size={20} /></button>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/book/:id" element={<BookDetailPage />} />
        <Route path="/reading-list" element={<ReadingListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/booking" element={<BookingPage />} />
        </Route>
        <Route path="*" element={<main className="route-fallback"><Search size={24} /><h1>Page not found</h1><Link className="text-link" to="/">Back to the catalog</Link></main>} />
      </Routes>

      {isDetail && <Link className="floating-back" to="/" aria-label="Back to catalog"><ArrowLeft size={18} /></Link>}
      <footer className="site-footer"><span>Stacks Library</span><span>Find a story worth staying up for.</span><span>Open shelves, curious minds.</span></footer>
    </div>
  );
}
