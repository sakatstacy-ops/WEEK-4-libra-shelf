import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SearchBar({ value, onChange, delay = 400 }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    const timer = window.setTimeout(() => onChange(draft), delay);
    return () => window.clearTimeout(timer);
  }, [draft, delay, onChange]);

  return (
    <label className="search-field">
      <Search size={18} strokeWidth={1.8} aria-hidden="true" />
      <span className="sr-only">Search books by title or author</span>
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Search title or author"
        aria-label="Search books by title or author"
      />
      {draft && <button className="clear-search" type="button" aria-label="Clear search" onClick={() => setDraft('')}><X size={15} /></button>}
    </label>
  );
}
