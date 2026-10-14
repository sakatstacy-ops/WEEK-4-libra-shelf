import { useState } from 'react';
import { CalendarDays, Check, Clock3, DoorOpen } from 'lucide-react';

const spaces = [
  { id: 'reading-room', label: 'The Reading Room', detail: 'Quiet tables · 1–4 people' },
  { id: 'window-nook', label: 'Window Nook', detail: 'Sunlit seats · 1–2 people' },
  { id: 'group-studio', label: 'Group Studio', detail: 'Whiteboard + screen · 2–8 people' },
  { id: 'garden-table', label: 'Garden Table', detail: 'Courtyard view · 1–4 people' },
];

function todayLocal() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export default function BookingForm() {
  const [form, setForm] = useState({ space: '', date: '', startTime: '', endTime: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setMessage('');
    setError('');
  };

  function handleSubmit(event) {
    event.preventDefault();
    if (form.endTime <= form.startTime) {
      setError('Choose an end time later than your start time.');
      return;
    }
    const selectedSpace = spaces.find((space) => space.id === form.space);
    setMessage(`Request details saved locally for ${selectedSpace?.label} on ${form.date}.`);
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <div className="booking-field">
        <label htmlFor="booking-space"><span><DoorOpen size={16} /> SPACE</span></label>
        <select id="booking-space" value={form.space} onChange={update('space')} required>
          <option value="" disabled>Choose a library space</option>
          {spaces.map((space) => <option key={space.id} value={space.id}>{space.label} — {space.detail}</option>)}
        </select>
      </div>
      <div className="booking-field">
        <label htmlFor="booking-date"><span><CalendarDays size={16} /> DATE</span></label>
        <input id="booking-date" type="date" min={todayLocal()} value={form.date} onChange={update('date')} required />
      </div>
      <div className="booking-time-row">
        <div className="booking-field">
          <label htmlFor="booking-start"><span><Clock3 size={16} /> START TIME</span></label>
          <input id="booking-start" type="time" value={form.startTime} onChange={update('startTime')} required />
        </div>
        <div className="booking-field">
          <label htmlFor="booking-end"><span><Clock3 size={16} /> END TIME</span></label>
          <input id="booking-end" type="time" min={form.startTime || undefined} value={form.endTime} onChange={update('endTime')} required />
        </div>
      </div>
      {error && <p className="booking-feedback booking-error" role="alert">{error}</p>}
      {message && <p className="booking-feedback booking-success" role="status"><Check size={16} />{message}</p>}
      <button className="button-primary booking-submit" type="submit">Review request <span>→</span></button>
      <p className="booking-note">Your selections stay on this page for now. Request submission will be added with booking support.</p>
    </form>
  );
}
