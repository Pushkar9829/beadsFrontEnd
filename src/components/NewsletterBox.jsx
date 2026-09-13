import { useState } from 'react';
import api from '../api/client';
import Button from './ui/Button';

export default function NewsletterBox({ eyebrow = 'The list', title = 'Quiet notes from the atelier.', compact }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/newsletter', { email, source: 'homepage' });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not subscribe.');
    }
  }

  return (
    <div className={compact ? '' : 'rounded-2xl border border-gold/20 bg-surface p-6 sm:p-8'}>
      <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-2xl gold-text">{title}</h2>
      {done ? (
        <p className="mt-4 text-sm text-lilac">You are on the list.</p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="flex-1 rounded-xl border border-gold/30 bg-ink px-3 py-2 text-ivory"
          />
          <Button type="submit">Subscribe</Button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
