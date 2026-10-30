import { useEffect, useId, useRef, useState } from 'react';
import api from '../../api/client';

// Place of birth for the Kundli: suggestions from /api/kundli/places (AstrologyAPI geo_details, cached
// server-side; signed-in users only). Only a chosen option counts (it carries lat/lon/time zone); editing
// the text clears the choice but keeps what was typed. Used in the home modal (modal-input) and
// Account → My Kundli (acct-input). Styles: commerce.css "Kundli"; the admin passes Tailwind `classes`
// instead (the storefront CSS is not loaded there).
const STORE_CLASSES = { root: 'kd-place', list: 'kd-place-list', option: 'kd-place-opt', active: 'is-on', note: 'kd-place-note', bad: 'is-bad' };
const BUSY_MESSAGE = 'Place search is busy, please try again later.';

export default function PlaceAutocomplete({ id, value, onChange, inputClassName = '', placeholder = 'Start typing your birth city', disabled = false, classes, label = 'Place of birth suggestions' }) {
  const c = { ...STORE_CLASSES, ...classes };
  const listId = useId();
  const noteId = useId();
  const [text, setText] = useState(value?.label || '');
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [state, setState] = useState({ loading: false, error: '' });
  const seq = useRef(0);
  const blurTimer = useRef(null);

  // Only a place supplied by the parent (prefill, reset to another place) replaces the text. Clearing the
  // choice (value -> null) while the user edits must not wipe what they typed.
  useEffect(() => {
    if (value?.label) setText(value.label);
  }, [value?.label]);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  useEffect(() => {
    const q = text.trim();
    // Any change invalidates a request still in flight, so a late answer for an older query is dropped.
    const n = ++seq.current;
    if ((value && q === value.label) || q.length < 3) {
      setOptions([]);
      setOpen(false);
      setState({ loading: false, error: '' });
      return undefined;
    }
    setState({ loading: true, error: '' });
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/kundli/places', { params: { q } });
        if (n !== seq.current) return;
        const places = data.places || [];
        setOptions(places);
        setActive(-1);
        setOpen(places.length > 0);
        setState({ loading: false, error: places.length ? '' : 'No matching place. Try the nearest city.' });
      } catch (err) {
        if (n !== seq.current) return;
        setOptions([]);
        setOpen(false);
        const message = err.status === 429 && /place search is busy/i.test(err.message || '') ? BUSY_MESSAGE : err.message || 'Could not search places.';
        setState({ loading: false, error: message });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [text, value]);

  const choose = (place) => {
    seq.current += 1;
    setText(place.label);
    setOptions([]);
    setOpen(false);
    setActive(-1);
    setState({ loading: false, error: '' });
    onChange(place);
  };

  const onKeyDown = (e) => {
    if (!options.length) return;
    if (!open) {
      // Reopen the list (e.g. after Escape) with the arrow keys.
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      // Enter picks the highlighted option, or the first one; it never submits with the list open.
      e.preventDefault();
      choose(options[active >= 0 ? active : 0]);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    }
  };

  const showList = open && options.length > 0;
  const typedWithoutChoice = !value && text.trim().length >= 3 && !state.loading && !showList && !state.error;
  const note = state.loading ? 'Searching…' : state.error || (typedWithoutChoice ? 'Choose your place from the list.' : '');

  return (
    <div className={c.root}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        aria-describedby={note ? noteId : undefined}
        aria-invalid={state.error ? true : undefined}
        autoComplete="off"
        className={inputClassName}
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          if (value) onChange(null);
        }}
        onFocus={() => {
          clearTimeout(blurTimer.current);
          if (options.length) setOpen(true);
        }}
        onBlur={() => {
          clearTimeout(blurTimer.current);
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul className={c.list} id={listId} role="listbox" aria-label={label}>
          {options.map((p, i) => (
            <li
              key={`${p.label}-${p.lat}-${p.lon}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`${c.option}${i === active ? ` ${c.active}` : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(p);
              }}
            >
              <span>{p.label}</span>
              <small>{p.timezoneId}</small>
            </li>
          ))}
        </ul>
      )}
      <span id={noteId} role="status" aria-live="polite" className={note ? `${c.note}${state.error ? ` ${c.bad}` : ''}` : undefined}>
        {note}
      </span>
    </div>
  );
}
