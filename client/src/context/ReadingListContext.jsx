import { createContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'stacks-reading-list-v1';
export const ReadingListContext = createContext(null);

function readSavedBooks() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((book) => book && typeof book._id === 'string') : [];
  } catch {
    return [];
  }
}

export function ReadingListProvider({ children }) {
  const [readingList, setReadingList] = useState(readSavedBooks);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(readingList));
    } catch {
      // The list remains usable in memory when browser storage is unavailable.
    }
  }, [readingList]);

  const actions = useMemo(() => ({
    addBook(book) {
      if (!book?._id) return;
      setReadingList((current) => current.some((item) => item._id === book._id) ? current : [...current, book]);
    },
    removeBook(bookId) {
      setReadingList((current) => current.filter((book) => book._id !== bookId));
    },
    clearList() {
      setReadingList([]);
    },
  }), []);

  const value = useMemo(() => ({ readingList, ...actions }), [readingList, actions]);
  return <ReadingListContext.Provider value={value}>{children}</ReadingListContext.Provider>;
}
