import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cx } from './primitives';

export const inputBase =
  'w-full rounded-lg border border-white/10 bg-raised px-3 text-sm text-ivory placeholder:text-lilac/50 transition-colors focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20 disabled:opacity-50 aria-[invalid=true]:border-rose-400/60';

/** Label + control + hint/error. Pass the control as children; it receives id via render prop or `htmlFor`. */
export function Field({ label, hint, error, required, className, children, htmlFor, inline = false }) {
  const autoId = useId();
  const id = htmlFor || autoId;
  const control = typeof children === 'function' ? children({ id, invalid: Boolean(error) }) : children;
  return (
    <div className={cx(inline ? 'flex items-center justify-between gap-4' : 'space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-lilac">
          {label}
          {required && <span className="ml-0.5 text-gold">*</span>}
        </label>
      )}
      {control}
      {error ? <p className="text-xs text-rose-300">{error}</p> : hint ? <p className="text-xs text-lilac/70">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ className, invalid, prefix, suffix, ...rest }, ref) {
  if (prefix || suffix) {
    return (
      <div className={cx('flex items-center rounded-lg border border-white/10 bg-raised focus-within:border-gold/60 focus-within:ring-2 focus-within:ring-gold/20', invalid && 'border-rose-400/60', className)}>
        {prefix && <span className="pl-3 text-sm text-lilac">{prefix}</span>}
        <input ref={ref} aria-invalid={invalid || undefined} className="h-9 w-full min-w-0 bg-transparent px-3 text-sm text-ivory placeholder:text-lilac/50 focus:outline-none" {...rest} />
        {suffix && <span className="pr-3 text-sm text-lilac">{suffix}</span>}
      </div>
    );
  }
  return <input ref={ref} aria-invalid={invalid || undefined} className={cx(inputBase, 'h-9', className)} {...rest} />;
});

export const Textarea = forwardRef(function Textarea({ className, invalid, rows = 4, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} aria-invalid={invalid || undefined} className={cx(inputBase, 'py-2 leading-relaxed', className)} {...rest} />;
});

/** options: [{ value, label }] or strings */
export const Select = forwardRef(function Select({ className, options = [], placeholder, invalid, ...rest }, ref) {
  return (
    <select ref={ref} aria-invalid={invalid || undefined} className={cx(inputBase, 'h-9 pr-8', className)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => {
        const opt = typeof o === 'object' ? o : { value: o, label: o };
        return (
          <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        );
      })}
    </select>
  );
});

/** Number input that yields numbers (or '' while empty) instead of strings. */
export const NumberInput = forwardRef(function NumberInput({ value, onChange, min, max, step = 1, ...rest }, ref) {
  return (
    <Input
      ref={ref}
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      value={value === null || value === undefined ? '' : value}
      onChange={(e) => onChange?.(e.target.value === '' ? '' : Number(e.target.value))}
      {...rest}
    />
  );
});

export function MoneyInput(props) {
  return <NumberInput min={0} step="0.01" prefix="₹" {...props} />;
}

export function Switch({ checked, onChange, label, description, disabled, id }) {
  const autoId = useId();
  const sid = id || autoId;
  return (
    <div className="flex items-start justify-between gap-4">
      {(label || description) && (
        <label htmlFor={sid} className="min-w-0 cursor-pointer">
          {label && <span className="block text-sm text-ivory">{label}</span>}
          {description && <span className="mt-0.5 block text-xs text-lilac">{description}</span>}
        </label>
      )}
      <button
        id={sid}
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cx(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-50',
          checked ? 'bg-gold' : 'bg-white/15'
        )}
      >
        <span className={cx('inline-block h-4 w-4 rounded-full bg-ink shadow transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

export function Checkbox({ checked, onChange, label, indeterminate, disabled, className, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate) && !checked;
  }, [indeterminate, checked]);
  const box = (
    <input
      ref={ref}
      type="checkbox"
      checked={Boolean(checked)}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.checked)}
      className="h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-raised accent-[#c6a75e]"
      {...rest}
    />
  );
  if (!label) return box;
  return (
    <label className={cx('inline-flex cursor-pointer items-center gap-2 text-sm text-ivory', className)}>
      {box}
      {label}
    </label>
  );
}

/** Free-text tags (Enter or comma to add). value: string[] */
export function TagInput({ value = [], onChange, placeholder = 'Add and press Enter', max = 50 }) {
  const [draft, setDraft] = useState('');
  const add = (raw) => {
    const parts = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) if (!next.includes(p) && next.length < max) next.push(p);
    onChange(next);
    setDraft('');
  };
  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-raised px-2 py-1.5 focus-within:border-gold/60">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-white/[0.08] px-2 py-0.5 text-xs text-ivory">
          {tag}
          <button type="button" aria-label={`Remove ${tag}`} className="text-lilac hover:text-ivory" onClick={() => onChange(value.filter((t) => t !== tag))}>
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        placeholder={value.length ? '' : placeholder}
        className="min-w-[8rem] flex-1 bg-transparent px-1 text-sm text-ivory placeholder:text-lilac/50 focus:outline-none"
      />
    </div>
  );
}

export function FormSection({ title, description, children, className }) {
  return (
    <section className={cx('space-y-4', className)}>
      {(title || description) && (
        <div>
          {title && <h4 className="text-xs font-semibold uppercase tracking-wider text-gold/90">{title}</h4>}
          {description && <p className="mt-1 text-xs text-lilac">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function FormGrid({ cols = 2, className, children }) {
  const grid = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }[cols];
  return <div className={cx('grid gap-4', grid, className)}>{children}</div>;
}

function stable(v) {
  return JSON.stringify(v, (_k, val) => (val === undefined ? null : val));
}

/**
 * Small form state helper.
 *   const form = useForm(initial);
 *   form.values, form.set('name', v), form.bind('name') → { value, onChange }
 *   form.dirty, form.reset(next), form.errors / form.setServerErrors(info.fields)
 * Re-initialises when `initial` changes identity *and* the form is not dirty, so a background
 * refetch never clobbers what the user is typing.
 */
export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [baseline, setBaseline] = useState(() => stable(initial));
  const [errors, setErrors] = useState({});
  const dirty = useMemo(() => stable(values) !== baseline, [values, baseline]);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  const initialKey = stable(initial);
  useEffect(() => {
    if (!dirtyRef.current) {
      setValues(JSON.parse(initialKey));
      setBaseline(initialKey);
    }
  }, [initialKey]);

  const set = useCallback((key, value) => {
    setValues((prev) => {
      if (typeof key === 'object') return { ...prev, ...key };
      return setPath(prev, key, value);
    });
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }, []);

  const bind = useCallback(
    (key, { type } = {}) => ({
      value: getPath(values, key) ?? (type === 'checkbox' ? false : ''),
      onChange: (eOrValue) => {
        const v = eOrValue && eOrValue.target ? (eOrValue.target.type === 'checkbox' ? eOrValue.target.checked : eOrValue.target.value) : eOrValue;
        set(key, v);
      },
      invalid: Boolean(errors[key]),
    }),
    [values, errors, set]
  );

  const baselineRef = useRef(baseline);
  baselineRef.current = baseline;
  const reset = useCallback((next) => {
    const v = next === undefined ? JSON.parse(baselineRef.current) : next;
    setValues(v);
    setBaseline(stable(v));
    setErrors({});
  }, []);

  return {
    values,
    setValues,
    set,
    bind,
    dirty,
    reset,
    errors,
    setErrors,
    setServerErrors: (fields) => setErrors(fields || {}),
  };
}

export function getPath(obj, path) {
  return String(path)
    .split('.')
    .reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

export function setPath(obj, path, value) {
  const keys = String(path).split('.');
  const root = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let cur = root;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const k = keys[i];
    const next = cur[k];
    cur[k] = Array.isArray(next) ? [...next] : { ...(next || {}) };
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return root;
}

/** Warn before closing the tab while a form has unsaved changes. */
export function useUnsavedWarning(dirty) {
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}
