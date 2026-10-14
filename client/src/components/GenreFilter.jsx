import { ChevronDown } from 'lucide-react';

export default function GenreFilter({ genres, value, onChange, loading = false, error = '' }) {
  return (
    <label className="genre-filter">
      <span className="sr-only">Filter by genre</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={loading || Boolean(error)} aria-label="Filter by genre">
        <option value="">All genres</option>
        {genres.map((genre) => <option key={genre._id} value={genre._id}>{genre.name}</option>)}
      </select>
      <ChevronDown className="select-chevron" size={16} aria-hidden="true" />
      {loading && <span role="status" style={{ color: '#718079', fontSize: 10, whiteSpace: 'nowrap' }}>Loading genres</span>}
      {error && <span className="sr-only">Genre filter unavailable: {error}</span>}
    </label>
  );
}
