import { useContext } from 'react';
import { ReadingListContext } from '../context/ReadingListContext.jsx';

export default function useReadingList() {
  const context = useContext(ReadingListContext);
  if (!context) throw new Error('useReadingList must be used inside ReadingListProvider');
  return context;
}
