import { fieldClass, labelClass } from './AdminHeader';

const HEX = /^#[0-9a-f]{6}$/i;

export default function ColorField({ label, value = '', onChange, placeholder = 'Default' }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          className="h-9 w-11 shrink-0 cursor-pointer rounded border border-gold/30 bg-transparent"
          value={HEX.test(value) ? value : '#c6a75e'}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className={fieldClass}
          value={value || ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.trim())}
        />
        {value ? (
          <button type="button" className="shrink-0 text-[10px] uppercase tracking-widest text-lilac hover:text-gold" onClick={() => onChange('')}>
            Default
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function CardColorFields({ form, setForm }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ColorField label="Card background" placeholder="Auto from name" value={form.cardBg} onChange={(cardBg) => setForm({ ...form, cardBg })} />
      <ColorField label="Card accent (border, glow)" placeholder="Auto from name" value={form.cardAccent} onChange={(cardAccent) => setForm({ ...form, cardAccent })} />
    </div>
  );
}
