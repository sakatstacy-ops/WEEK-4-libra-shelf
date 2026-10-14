import { AlertCircle, BookOpen, LoaderCircle } from 'lucide-react';

export function LoadingState({ label = 'Loading books' }) {
  return <div className="state-panel loading-state" role="status"><LoaderCircle size={25} className="spin" /><span>{label}</span></div>;
}

export function ErrorState({ message, onRetry }) {
  return <div className="state-panel error-state" role="alert"><AlertCircle size={25} /><div><strong>We couldn’t load this page.</strong><p>{message}</p>{onRetry && <button className="button-outline" type="button" onClick={onRetry}>Try again</button>}</div></div>;
}

export function EmptyState({ title = 'No books found', detail = 'Try a different search or clear your filters.' }) {
  return <div className="state-panel empty-state"><span className="empty-icon"><BookOpen size={25} /></span><div><strong>{title}</strong><p>{detail}</p></div></div>;
}
