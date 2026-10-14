import { CalendarDays, LockKeyhole } from 'lucide-react';
import BookingForm from '../components/BookingForm.jsx';
import useAuth from '../hooks/useAuth.js';

export default function BookingPage() {
  const { user } = useAuth();

  return (
    <main className="booking-page">
      <section className="booking-heading">
        <div className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT CHAPTER</div>
        <h1>Make room<br /><em>for a little focus.</em></h1>
        <p>Choose a quiet corner of the library and set aside some time for yourself.</p>
        <div className="booking-member"><LockKeyhole size={15} /> Signed in as <strong>{user?.email}</strong></div>
      </section>
      <section className="booking-panel" aria-labelledby="booking-title">
        <div className="booking-panel-heading"><div><span className="eyebrow"><CalendarDays size={14} /> SPACE REQUEST</span><h2 id="booking-title">Plan a visit</h2></div><span className="booking-step">01 <i /> 01</span></div>
        <BookingForm />
      </section>
    </main>
  );
}
