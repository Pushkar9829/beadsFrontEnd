import { useEffect, useId, useRef, useState } from 'react';
import api from '../../api/client';

// Place of birth for the Kundli: suggestions from /api/kundli/places (AstrologyAPI geo_details, cached
// server-side). Only a chosen option counts (it carries lat/lon/time zone); typing clears the choice.
// Used in the home modal (modal-input) and Account → My Kundli (acct-input). Styles: commerce.css "Kundli";
// the admin passes Tailwind `classes` instead (the storefront CSS is not loaded there).
const STORE_CLASSES = { root: 'kd-place', list: 'kd-place-list', option: 'kd-place-opt', active: 'is-on', note: 'kd-place-note', bad: 'is-bad' };

export default function PlaceAutocomplete({ id, value, onChange, inputClassName = '', placeholder = 'Start typing your birth city', disabled = false, classes }) {
  const c = { ...STORE_CLASSES, ...classes };
  const listId = useId();
  const [text, setText] = useState(value?.label || '');
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [state, setState] = useState({ loading: false, error: '' });
  const seq = useRef(0);

  useEffect(() => {
    setText(value?.label || '');
  }, [value?.label]);

  useEffect(() => {
    const q = text.trim();
    if (value && q === value.label) return undefined;
    if (q.length < 3) {
      setOptions([]);
      setState({ loading: false, error: '' });
      return undefined;
    }
    const n = ++seq.current;
    setState({ loading: true, error: '' });
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/kundli/places', { params: { q } });
        if (n !== seq.current) return;
        setOptions(data.places || []);
        setActive(-1);
        setOpen(true);
        setState({ loading: false, error: (data.places || []).length ? '' : 'No matching place. Try the nearest city.' });
      } catch (err) {
        if (n !== seq.current) return;
        setOptions([]);
        setState({ loading: false, error: err.message || 'Could not search places.' });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [text, value]);

  const choose = (place) => {
    seq.current += 1;
    setText(place.label);
    setOptions([]);
    setOpen(false);
    setState({ loading: false, error: '' });
    onChange(place);
  };

  const onKeyDown = (e) => {
    if (!open || !options.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    }
  };

  const showList = open && options.length > 0;
  const typedWithoutChoice = !value && text.trim().length >= 3 && !state.loading && !showList && !state.error;

  return (
    <div className={c.root}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        className={inputClassName}
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          if (value) onChange(null);
        }}
        onFocus={() => options.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul className={c.list} id={listId} role="listbox">
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
      {state.loading && <span className={c.note}>Searching…</span>}
      {state.error && <span className={`${c.note} ${c.bad}`}>{state.error}</span>}
      {typedWithoutChoice && <span className={c.note}>Choose your place from the list.</span>}
    </div>
  );
}
