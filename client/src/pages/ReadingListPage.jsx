import { ArrowLeft, BookmarkMinus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import useReadingList from '../hooks/useReadingList.js';
import BookCard from '../components/BookCard.jsx';
import { EmptyState } from '../components/StatePanel.jsx';

export default function ReadingListPage() {
  const { readingList, clearList, removeBook } = useReadingList();

  return (
    <main className="reading-list-page">
      <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to discovery</Link>
      <div className="reading-list-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL SHELF</span><h1>Saved for <em>later.</em></h1><p>{readingList.length} {readingList.length === 1 ? 'title' : 'titles'} tucked away for another day.</p></div>
        {readingList.length > 0 && <button className="clear-list-button" type="button" onClick={clearList}><Trash2 size={15} /> Clear list</button>}
      </div>
      {readingList.length === 0 ? <EmptyState title="Your reading list is waiting" detail="Save a title from its detail page and it will be here next time." /> :
        <div className="book-grid reading-list-grid">{readingList.map((book, index) => <div className="reading-list-item" key={book._id}><BookCard book={book} index={index} /><button className="remove-saved" type="button" onClick={() => removeBook(book._id)} aria-label={`Remove ${book.title} from reading list`}><BookmarkMinus size={15} /> Remove</button></div>)}</div>}
    </main>
  );
}
