import { useRef } from 'react';
import { ArrowDown, ArrowUp, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CLAIM_ICON_OPTIONS } from '../../../lib/claimIcons';
import { Button, Field, FormGrid, IconButton, Input, MediaInput, NumberInput, Select, Switch, Textarea, cx, getPath, setPath } from '../../ui';
import { joinPath } from './schema';

export function readPath(obj, path) {
  return path ? getPath(obj, path) : obj;
}

export function writePath(obj, path, value) {
  return path ? setPath(obj, path, value) : value;
}

/**
 * Renders a field schema (see schema.js) against `values`.
 * onChange(path, value) receives a path relative to `values`.
 */
export function SchemaFields({ fields, values, onChange, base = '' }) {
  return (
    <div className="space-y-4">
      {fields.map((f, i) => (
        <SchemaField key={`${f.type}-${f.k || f.title || i}`} field={f} values={values} onChange={onChange} base={base} />
      ))}
    </div>
  );
}

function SchemaField({ field: f, values, onChange, base }) {
  const path = joinPath(base, f.k);
  const value = readPath(values, path);
  const set = (v) => onChange(path, v);

  switch (f.type) {
    case 'text':
      return (
        <Field label={f.label} hint={f.hint}>
          {({ id }) => <Input id={id} value={value ?? ''} placeholder={f.placeholder} onChange={(e) => set(e.target.value)} />}
        </Field>
      );
    case 'textarea':
      return (
        <Field label={f.label} hint={f.hint}>
          {({ id }) => <Textarea id={id} rows={f.rows} value={value ?? ''} placeholder={f.placeholder} onChange={(e) => set(e.target.value)} />}
        </Field>
      );
    case 'select':
      return (
        <Field label={f.label} hint={f.hint}>
          {({ id }) => <Select id={id} options={f.options} value={value ?? ''} onChange={(e) => set(e.target.value)} />}
        </Field>
      );
    case 'media':
      return (
        <Field label={f.label} hint={f.hint}>
          <MediaInput value={value || ''} onChange={set} folder={f.folder} allowVideo={f.allowVideo} aspect={f.aspect || 'aspect-video'} />
        </Field>
      );
    case 'color':
      return <ColorInput label={f.label} value={value || ''} onChange={set} />;
    case 'icon':
      return <IconPicker label={f.label} value={value} onChange={set} />;
    case 'cta':
      return (
        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 text-xs font-medium text-lilac">{f.label}</legend>
          <FormGrid>
            <Input aria-label={`${f.label} label`} placeholder="Button label" value={value?.label ?? ''} onChange={(e) => set({ ...(value || {}), label: e.target.value })} />
            <Input aria-label={`${f.label} link`} placeholder="/link" value={value?.to ?? ''} onChange={(e) => set({ ...(value || {}), to: e.target.value })} />
          </FormGrid>
        </fieldset>
      );
    case 'row':
      return (
        <FormGrid cols={f.fields.length >= 3 ? 3 : 2}>
          {f.fields.map((sub, i) => (
            <SchemaField key={`${sub.k || i}`} field={sub} values={values} onChange={onChange} base={base} />
          ))}
        </FormGrid>
      );
    case 'group':
      return (
        <section className="space-y-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          {f.title && <h4 className="text-xs font-semibold uppercase tracking-wider text-gold/90">{f.title}</h4>}
          {f.description && <p className="-mt-2 text-xs text-lilac">{f.description}</p>}
          <SchemaFields fields={f.fields} values={values} onChange={onChange} base={path} />
        </section>
      );
    case 'note':
      return (
        <p className="text-xs text-lilac">
          {f.text}
          {f.to && (
            <Link to={f.to} className="ml-1.5 inline-flex items-center gap-1 text-gold hover:text-gold-light">
              {f.linkLabel || 'Open'} <ArrowRight size={12} />
            </Link>
          )}
        </p>
      );
    case 'switch':
      return <Switch checked={Boolean(value)} onChange={set} label={f.label} description={f.hint} />;
    case 'number':
      return (
        <Field label={f.label} hint={f.hint}>
          {({ id }) => <NumberInput id={id} value={value ?? ''} min={f.min} max={f.max} step={f.step} onChange={set} />}
        </Field>
      );
    case 'custom': {
      const Control = f.component;
      return <Control field={f} value={value} onChange={set} parent={readPath(values, base)} />;
    }
    case 'strings':
      return <StringList label={f.label} hint={f.hint} items={Array.isArray(value) ? value : []} onChange={set} multiline={f.multiline} itemLabel={f.itemLabel} />;
    case 'list':
      return <ListEditor field={f} items={Array.isArray(value) ? value : []} onChange={set} />;
    default:
      return null;
  }
}

/** Stable React keys for a list that can be reordered, without storing ids in the data. */
export function useRowKeys(length) {
  const seq = useRef(0);
  const keys = useRef([]);
  if (keys.current.length !== length) {
    // Data replaced from outside (load, reset): regenerate keys.
    keys.current = Array.from({ length }, () => `r${(seq.current += 1)}`);
  }
  return {
    keys: keys.current,
    move(from, to) {
      const next = [...keys.current];
      const [k] = next.splice(from, 1);
      next.splice(to, 0, k);
      keys.current = next;
    },
    remove(i) {
      keys.current = keys.current.filter((_, j) => j !== i);
    },
    add() {
      keys.current = [...keys.current, `r${(seq.current += 1)}`];
    },
  };
}

export function moveItem(arr, from, to) {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function RowControls({ index, count, onMove, onRemove, fixed, label }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <IconButton icon={ArrowUp} size="sm" label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(index, index - 1)} />
      <IconButton icon={ArrowDown} size="sm" label={`Move ${label} down`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)} />
      {!fixed && <IconButton icon={Trash2} size="sm" label={`Remove ${label}`} className="hover:text-rose-300" onClick={() => onRemove(index)} />}
    </div>
  );
}

export function ListEditor({ field, items, onChange }) {
  const { label, hint, fields, itemLabel = 'Item', newItem = {}, fixed = false, reorder = true, max = 50, summary, itemTitle, compact } = field;
  const rk = useRowKeys(items.length);
  const move = (from, to) => {
    if (to < 0 || to >= items.length) return;
    rk.move(from, to);
    onChange(moveItem(items, from, to));
  };
  const remove = (i) => {
    rk.remove(i);
    onChange(items.filter((_, j) => j !== i));
  };
  const add = () => {
    rk.add();
    onChange([...items, typeof newItem === 'function' ? newItem(items) : JSON.parse(JSON.stringify(newItem))]);
  };
  const update = (i, path, v) => {
    const next = [...items];
    next[i] = writePath(items[i] || {}, path, v);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium text-lilac">
          {label} <span className="text-lilac/60">({items.length})</span>
        </p>
      </div>
      {hint && <p className="text-xs text-lilac/70">{hint}</p>}
      {items.length === 0 && <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-lilac">No {itemLabel.toLowerCase()}s yet.</p>}
      {items.map((item, i) => {
        const title = itemTitle ? itemTitle(item, i) : `${itemLabel} ${i + 1}`;
        const sub = summary ? summary(item) : '';
        return (
          <div key={rk.keys[i]} className={cx('rounded-xl border border-white/[0.08] bg-white/[0.02]', compact ? 'p-2.5' : 'p-3.5')}>
            <div className={cx('flex items-center justify-between gap-2', !compact && 'mb-3')}>
              {compact ? (
                <div className="min-w-0 flex-1">
                  <SchemaFields fields={fields} values={item} onChange={(path, v) => update(i, path, v)} />
                </div>
              ) : (
                <p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wider text-gold/90">
                  {title}
                  {sub ? <span className="ml-2 font-normal normal-case tracking-normal text-lilac">{sub}</span> : null}
                </p>
              )}
              {(reorder || !fixed) && (
                <RowControls index={i} count={items.length} onMove={reorder ? move : () => {}} onRemove={remove} fixed={fixed} label={itemLabel.toLowerCase()} />
              )}
            </div>
            {!compact && <SchemaFields fields={fields} values={item} onChange={(path, v) => update(i, path, v)} />}
          </div>
        );
      })}
      {!fixed && items.length < max && (
        <Button size="sm" variant="ghost" icon={Plus} onClick={add}>
          Add {itemLabel.toLowerCase()}
        </Button>
      )}
    </div>
  );
}

export function StringList({ label, hint, items, onChange, multiline = false, itemLabel = 'Line' }) {
  const rk = useRowKeys(items.length);
  const move = (from, to) => {
    if (to < 0 || to >= items.length) return;
    rk.move(from, to);
    onChange(moveItem(items, from, to));
  };
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-lilac">
        {label} <span className="text-lilac/60">({items.length})</span>
      </p>
      {hint && <p className="text-xs text-lilac/70">{hint}</p>}
      {items.map((item, i) => (
        <div key={rk.keys[i]} className="flex items-start gap-2">
          {multiline ? (
            <Textarea
              rows={3}
              aria-label={`${itemLabel} ${i + 1}`}
              value={item ?? ''}
              onChange={(e) => onChange(items.map((v, j) => (j === i ? e.target.value : v)))}
            />
          ) : (
            <Input aria-label={`${itemLabel} ${i + 1}`} value={item ?? ''} onChange={(e) => onChange(items.map((v, j) => (j === i ? e.target.value : v)))} />
          )}
          <RowControls
            index={i}
            count={items.length}
            label={itemLabel.toLowerCase()}
            onMove={move}
            onRemove={(idx) => {
              rk.remove(idx);
              onChange(items.filter((_, j) => j !== idx));
            }}
          />
        </div>
      ))}
      <Button
        size="sm"
        variant="ghost"
        icon={Plus}
        onClick={() => {
          rk.add();
          onChange([...items, '']);
        }}
      >
        Add {itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}

const HEX = /^#[0-9a-f]{6}$/i;

export function ColorInput({ label, value, onChange }) {
  return (
    <Field label={label}>
      {({ id }) => (
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label={`${label} picker`}
            className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-raised"
            value={HEX.test(value) ? value : '#c6a75e'}
            onChange={(e) => onChange(e.target.value)}
          />
          <Input id={id} value={value} placeholder="Default" onChange={(e) => onChange(e.target.value.trim())} />
          {value ? (
            <Button size="sm" variant="ghost" onClick={() => onChange('')}>
              Default
            </Button>
          ) : null}
        </div>
      )}
    </Field>
  );
}

export function IconPicker({ label = 'Icon', value, onChange }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-lilac">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {CLAIM_ICON_OPTIONS.map(({ key, label: name, Icon }) => (
          <button
            type="button"
            key={key}
            role="radio"
            aria-checked={value === key}
            title={name}
            aria-label={name}
            onClick={() => onChange(key)}
            className={cx(
              'grid h-8 w-8 place-items-center rounded-lg border transition-colors',
              value === key ? 'border-gold bg-gold/15 text-gold' : 'border-white/10 text-lilac hover:text-ivory'
            )}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}
