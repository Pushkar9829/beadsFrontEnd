// Bracelet studio settings (BraceletConfig singleton): limits, sizes, threads, CZ, packaging prices, paths.
import { useMemo, useState } from 'react';
import { AlertTriangle, Calculator, RotateCcw, Save } from 'lucide-react';
import { money, plural } from '../lib/format';
import { apiSend, useApiMutation } from '../lib/query';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Divider,
  ErrorState,
  Field,
  FormGrid,
  Input,
  MediaInput,
  MoneyInput,
  NumberInput,
  PageHeader,
  Select,
  Skeleton,
  Switch,
  TagInput,
  Textarea,
  useForm,
  useUnsavedWarning,
} from '../ui';
import { STUDIO, STUDIO_INVALIDATE, newKey, stripKeys, useStudioBeads, useStudioCharms, withKeys } from './studio/api';
import { RowListEditor } from './studio/shared';

const NUMBER_FIELDS = ['beadLimit', 'minBeads', 'zodiacBeadCount', 'crystalMin', 'crystalMax', 'crystalMaxNumerology', 'intentionCap', 'engravingMaxLength', 'baseMakingPrice', 'defaultBeadSizeMm'];
const PACKAGING_PRICES = [
  { key: 'box', label: 'Box', hint: 'Gift box' },
  { key: 'clasp', label: 'Clasp', hint: 'Clasp or knot finish' },
  { key: 'charm', label: 'Charm', hint: 'Base charm price; the finish price is added on top' },
  { key: 'thread', label: 'Thread', hint: 'Same for every thread type' },
];
const PACKAGING_LABEL_KEYS = ['box', 'clasp', 'charm', 'cz', 'roundCz', 'thread'];
const PACKAGING_LABEL_DEFAULTS = { box: 'Box', clasp: 'Clasp', charm: 'Charm', cz: 'CZ', roundCz: 'Round CZ', thread: 'Thread' };

const num = (v, fallback = '') => (v === undefined || v === null || v === '' ? fallback : Number(v));

function configToForm(c = {}) {
  return {
    beadLimit: num(c.beadLimit, 32),
    minBeads: num(c.minBeads, 1),
    zodiacBeadCount: num(c.zodiacBeadCount, 2),
    crystalMin: num(c.crystalMin, 3),
    crystalMax: num(c.crystalMax, 5),
    crystalMaxNumerology: num(c.crystalMaxNumerology, 8),
    intentionCap: num(c.intentionCap, 3),
    engravingMaxLength: num(c.engravingMaxLength, 24),
    baseMakingPrice: num(c.baseMakingPrice, 0),
    beadSizesMm: (c.beadSizesMm || []).map(Number),
    defaultBeadSizeMm: num(c.defaultBeadSizeMm, ''),
    wristSizes: [...(c.wristSizes || [])],
    defaultWristSize: c.defaultWristSize || '',
    threadTypes: withKeys((c.threadTypes || []).map((t) => ({ key: t.key || '', label: t.label || '', detail: t.detail || '', icon: t.icon || '', image: t.image || '' })), 't'),
    defaultThreadType: c.defaultThreadType || '',
    czOptions: withKeys((c.czOptions || []).map((t) => ({ key: t.key || '', label: t.label || '', detail: t.detail || '', icon: t.icon || '', image: t.image || '', price: num(t.price, 0) })), 'c'),
    defaultCzStyle: c.defaultCzStyle || '',
    packaging: Object.fromEntries(PACKAGING_PRICES.map(({ key }) => [key, num(c.packaging?.[key], 0)])),
    packagingLabels: Object.fromEntries(PACKAGING_LABEL_KEYS.map((key) => [key, c.packagingLabels?.[key] ?? PACKAGING_LABEL_DEFAULTS[key]])),
    charmRequired: c.charmRequired !== false,
    charmHint: c.charmHint || '',
    studioModes: withKeys(
      [...(c.studioModes || [])]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((m) => ({
          slug: m.slug,
          label: m.label || '',
          short: m.short || '',
          eyebrow: m.eyebrow || '',
          title: m.title || '',
          body: m.body || '',
          chooseHint: m.chooseHint || '',
          icon: m.icon || '',
          image: m.image || '',
          isActive: m.isActive !== false,
        })),
      'm'
    ),
  };
}

function toBody(v) {
  const body = {};
  for (const key of NUMBER_FIELDS) body[key] = Number(v[key]);
  return {
    ...body,
    beadSizesMm: v.beadSizesMm.map(Number),
    wristSizes: v.wristSizes,
    defaultWristSize: v.defaultWristSize,
    threadTypes: stripKeys(v.threadTypes).map((t) => ({ ...t, key: t.key.trim(), label: t.label.trim() })),
    defaultThreadType: v.defaultThreadType,
    czOptions: stripKeys(v.czOptions).map((t) => ({ ...t, key: t.key.trim(), label: t.label.trim(), price: Number(t.price) || 0 })),
    defaultCzStyle: v.defaultCzStyle,
    // packaging.cz / roundCz are mirrored by the server from the CZ options with keys "cz" and "round".
    packaging: Object.fromEntries(PACKAGING_PRICES.map(({ key }) => [key, Number(v.packaging[key]) || 0])),
    packagingLabels: v.packagingLabels,
    charmRequired: v.charmRequired,
    charmHint: v.charmHint,
    studioModes: stripKeys(v.studioModes).map((m, i) => ({ ...m, sortOrder: i + 1 })),
  };
}

const isWhole = (v, min) => v !== '' && Number.isInteger(Number(v)) && Number(v) >= min;

function validate(v) {
  const e = {};
  if (!isWhole(v.minBeads, 1)) e.minBeads = 'Must be a whole number of 1 or more.';
  if (!isWhole(v.beadLimit, 1)) e.beadLimit = 'Must be a whole number of 1 or more.';
  else if (!e.minBeads && Number(v.beadLimit) < Number(v.minBeads)) e.beadLimit = 'Must be at least the minimum beads.';
  if (!isWhole(v.zodiacBeadCount, 1) || Number(v.zodiacBeadCount) > 4) e.zodiacBeadCount = 'Must be 1 to 4.';
  if (!isWhole(v.crystalMin, 1)) e.crystalMin = 'Must be 1 or more.';
  if (!isWhole(v.crystalMax, 1)) e.crystalMax = 'Must be 1 or more.';
  else if (!e.crystalMin && Number(v.crystalMax) < Number(v.crystalMin)) e.crystalMax = 'Must be at least the minimum.';
  if (!isWhole(v.crystalMaxNumerology, 1)) e.crystalMaxNumerology = 'Must be 1 or more.';
  if (!isWhole(v.intentionCap, 1)) e.intentionCap = 'Must be 1 or more.';
  if (!isWhole(v.engravingMaxLength, 0)) e.engravingMaxLength = 'Must be 0 or more.';
  if (v.baseMakingPrice === '' || Number(v.baseMakingPrice) < 0) e.baseMakingPrice = 'Must be 0 or more.';

  if (!v.beadSizesMm.length) e.beadSizesMm = 'Add at least one bead size.';
  else if (!v.beadSizesMm.includes(Number(v.defaultBeadSizeMm))) e.defaultBeadSizeMm = 'Choose one of the bead sizes.';
  if (!v.wristSizes.length) e.wristSizes = 'Add at least one wrist size.';
  else if (!v.wristSizes.includes(v.defaultWristSize)) e.defaultWristSize = 'Choose one of the wrist sizes.';

  const rowsCheck = (rows, prefix, withPrice) => {
    const seen = new Set();
    rows.forEach((r, i) => {
      const key = r.key.trim();
      if (!key) e[`${prefix}.${i}.key`] = 'Key is required.';
      else if (seen.has(key)) e[`${prefix}.${i}.key`] = 'Keys must be unique.';
      seen.add(key);
      if (!r.label.trim()) e[`${prefix}.${i}.label`] = 'Label is required.';
      if (withPrice && (r.price === '' || Number(r.price) < 0)) e[`${prefix}.${i}.price`] = 'Must be 0 or more.';
    });
  };
  rowsCheck(v.threadTypes, 'threadTypes', false);
  rowsCheck(v.czOptions, 'czOptions', true);
  if (v.threadTypes.length && !v.threadTypes.some((t) => t.key.trim() === v.defaultThreadType)) e.defaultThreadType = 'Choose one of the thread types.';
  if (!v.czOptions.length) e.czOptions = 'Add at least one CZ option.';
  else if (!v.czOptions.some((t) => t.key.trim() === v.defaultCzStyle)) e.defaultCzStyle = 'Choose one of the CZ options.';

  for (const { key } of PACKAGING_PRICES) if (v.packaging[key] === '' || Number(v.packaging[key]) < 0) e[`packaging.${key}`] = 'Must be 0 or more.';
  v.studioModes.forEach((m, i) => {
    if (!m.label.trim()) e[`studioModes.${i}.label`] = 'Label is required.';
    if (!m.short.trim()) e[`studioModes.${i}.short`] = 'Short label is required.';
  });
  if (v.studioModes.length && !v.studioModes.some((m) => m.isActive)) e.studioModes = 'Keep at least one path active.';
  return e;
}

/** Same maths as the server's strandBeadCount (pricingService). */
function strandBeadCount(wristSize, beadSizeMm, min, max) {
  const inches = parseFloat(String(wristSize || '').replace(/[^\d.]/g, ''));
  const mm = Number(beadSizeMm) || 8;
  const count = Math.round(((Number.isFinite(inches) && inches > 0 ? inches : 6.5) * 25.4) / mm);
  return Math.max(min, Math.min(max, count));
}

export default function StudioConfig() {
  const query = useStudioCharms();
  return (
    <>
      <PageHeader title="Studio settings" description="Limits, sizes, threads, CZ accents, packaging prices and the paths of the bracelet studio. Charms are edited on Beads & charms." />
      {query.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : query.error || !query.config ? (
        <Card>
          <ErrorState error={query.error || { message: 'Settings could not be loaded.' }} onRetry={query.refetch} />
        </Card>
      ) : (
        <ConfigForm config={query.config} charms={query.charms} />
      )}
    </>
  );
}

function ConfigForm({ config, charms }) {
  const form = useForm(configToForm(config));
  const v = form.values;
  const [submitted, setSubmitted] = useState(false);
  useUnsavedWarning(form.dirty);
  const liveErrors = useMemo(() => validate(v), [v]);
  const errors = { ...form.errors, ...(submitted ? liveErrors : {}) };
  const errorCount = Object.keys(liveErrors).length;

  const save = useApiMutation((values) => apiSend('put', `${STUDIO}/config`, toBody(values)), {
    invalidate: STUDIO_INVALIDATE,
    success: 'Studio settings saved.',
    onSuccess: (data) => {
      setSubmitted(false);
      form.reset(configToForm(data?.config || config));
    },
    onError: (info) => form.setServerErrors(info.fields),
  });

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (errorCount) return;
    save.mutate(v);
  };

  const numField = (key, props = {}) => (
    <NumberInput value={v[key]} onChange={(x) => form.set(key, x)} invalid={Boolean(errors[key])} min={0} {...props} />
  );

  return (
    <form onSubmit={submit} className="pb-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader title="Strand limits" description="How many beads and crystals a customer can choose." />
            <FormGrid cols={3}>
              <Field label="Minimum beads" required error={errors.minBeads}>
                {({ id }) => numField('minBeads', { id, min: 1 })}
              </Field>
              <Field label="Bead limit" required error={errors.beadLimit} hint="Most beads one bracelet can hold.">
                {({ id }) => numField('beadLimit', { id, min: 1 })}
              </Field>
              <Field label="Zodiac beads" error={errors.zodiacBeadCount} hint="Placed either side of the charm (1–4).">
                {({ id }) => numField('zodiacBeadCount', { id, min: 1, max: 4 })}
              </Field>
              <Field label="Crystals, minimum" error={errors.crystalMin} hint="Distinct crystals to choose.">
                {({ id }) => numField('crystalMin', { id, min: 1 })}
              </Field>
              <Field label="Crystals, maximum" error={errors.crystalMax}>
                {({ id }) => numField('crystalMax', { id, min: 1 })}
              </Field>
              <Field label="Crystals, max (numerology)" error={errors.crystalMaxNumerology}>
                {({ id }) => numField('crystalMaxNumerology', { id, min: 1 })}
              </Field>
              <Field label="Intentions per bracelet" error={errors.intentionCap} hint="How many intentions a customer can combine.">
                {({ id }) => numField('intentionCap', { id, min: 1 })}
              </Field>
              <Field label="Engraving length" error={errors.engravingMaxLength} hint="Maximum characters.">
                {({ id }) => numField('engravingMaxLength', { id })}
              </Field>
            </FormGrid>
          </Card>

          <Card>
            <CardHeader title="Sizes" description="Wrist and bead sizes decide how many beads fit on the strand." />
            <div className="space-y-5">
              <FormGrid>
                <Field label="Bead sizes (mm)" error={errors.beadSizesMm} hint="Press Enter after each size.">
                  <TagInput
                    value={v.beadSizesMm.map(String)}
                    onChange={(list) => form.set('beadSizesMm', [...new Set(list.map(Number).filter((n) => Number.isFinite(n) && n > 0))].sort((a, b) => a - b))}
                    placeholder="e.g. 8"
                  />
                </Field>
                <Field label="Default bead size" error={errors.defaultBeadSizeMm}>
                  {({ id }) => (
                    <Select
                      id={id}
                      placeholder="Choose a default"
                      options={v.beadSizesMm.map((mm) => ({ value: mm, label: `${mm} mm` }))}
                      value={v.beadSizesMm.includes(Number(v.defaultBeadSizeMm)) ? v.defaultBeadSizeMm : ''}
                      onChange={(e) => form.set('defaultBeadSizeMm', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  )}
                </Field>
              </FormGrid>
              <FormGrid>
                <Field label="Wrist sizes" error={errors.wristSizes} hint={'Press Enter after each size, e.g. 6.5".'}>
                  <TagInput value={v.wristSizes} onChange={(list) => form.set('wristSizes', list)} placeholder={'e.g. 7"'} />
                </Field>
                <Field label="Default wrist size" error={errors.defaultWristSize}>
                  {({ id }) => <Select id={id} placeholder="Choose a default" options={v.wristSizes} value={v.wristSizes.includes(v.defaultWristSize) ? v.defaultWristSize : ''} onChange={(e) => form.set('defaultWristSize', e.target.value)} />}
                </Field>
              </FormGrid>
            </div>
          </Card>

          <Card>
            <CardHeader title="Thread types" description="Shown on the finish step. Every thread costs the Thread packaging price." />
            <RowListEditor
              rows={v.threadTypes}
              onChange={(rows) => form.set('threadTypes', rows)}
              addLabel="Add thread type"
              title={(t, i) => t.label || `Thread ${i + 1}`}
              makeRow={() => ({ key: '', label: '', detail: '', icon: '', image: '', _k: newKey() })}
              render={(t, update, i) => <OptionFields row={t} update={update} errors={errors} prefix={`threadTypes.${i}`} />}
            />
            <Divider className="my-4" />
            <Field label="Default thread" error={errors.defaultThreadType}>
              {({ id }) => <Select id={id} placeholder="Choose a default" options={v.threadTypes.filter((t) => t.key.trim()).map((t) => ({ value: t.key.trim(), label: t.label || t.key }))} {...form.bind('defaultThreadType')} />}
            </Field>
          </Card>

          <Card>
            <CardHeader title="CZ accents" description="The accent beads beside the charm. The chosen option’s price is added to every bracelet." />
            {errors.czOptions && <p className="mb-3 text-xs text-rose-300">{errors.czOptions}</p>}
            <RowListEditor
              rows={v.czOptions}
              onChange={(rows) => form.set('czOptions', rows)}
              minRows={1}
              addLabel="Add CZ option"
              title={(t, i) => t.label || `Option ${i + 1}`}
              makeRow={() => ({ key: '', label: '', detail: '', icon: '', image: '', price: 0, _k: newKey() })}
              render={(t, update, i) => <OptionFields row={t} update={update} errors={errors} prefix={`czOptions.${i}`} withPrice />}
            />
            <p className="mt-3 text-xs text-lilac">
              The options with keys <span className="font-mono text-ivory">cz</span> and <span className="font-mono text-ivory">round</span> also update the stored CZ and Round CZ packaging prices, so keep those keys for the classic and round accents.
            </p>
            <Divider className="my-4" />
            <Field label="Default CZ" error={errors.defaultCzStyle}>
              {({ id }) => <Select id={id} placeholder="Choose a default" options={v.czOptions.filter((t) => t.key.trim()).map((t) => ({ value: t.key.trim(), label: t.label || t.key }))} {...form.bind('defaultCzStyle')} />}
            </Field>
          </Card>

          <Card>
            <CardHeader title="Packaging" description="Added to every bracelet on top of the beads. Labels appear in the price breakdown." />
            <div className="space-y-3">
              {PACKAGING_PRICES.map(({ key, label, hint }) => (
                <div key={key} className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                  <Field label={`${label} label`} hint={hint}>
                    {({ id }) => <Input id={id} value={v.packagingLabels[key]} onChange={(e) => form.set(`packagingLabels.${key}`, e.target.value)} placeholder={PACKAGING_LABEL_DEFAULTS[key]} />}
                  </Field>
                  <Field label="Price" error={errors[`packaging.${key}`]}>
                    {({ id }) => <MoneyInput id={id} value={v.packaging[key]} onChange={(x) => form.set(`packaging.${key}`, x)} invalid={Boolean(errors[`packaging.${key}`])} />}
                  </Field>
                </div>
              ))}
              <FormGrid>
                <Field label="CZ label" hint="Fallback name; prices come from CZ accents.">
                  {({ id }) => <Input id={id} value={v.packagingLabels.cz} onChange={(e) => form.set('packagingLabels.cz', e.target.value)} placeholder="CZ" />}
                </Field>
                <Field label="Round CZ label">
                  {({ id }) => <Input id={id} value={v.packagingLabels.roundCz} onChange={(e) => form.set('packagingLabels.roundCz', e.target.value)} placeholder="Round CZ" />}
                </Field>
              </FormGrid>
              <Field label="Base making price" error={errors.baseMakingPrice} hint="Legacy setting: not charged while packaging prices are in use.">
                {({ id }) => <MoneyInput id={id} value={v.baseMakingPrice} onChange={(x) => form.set('baseMakingPrice', x)} className="sm:w-40" />}
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Charm step" />
            <div className="space-y-4">
              <Switch label="Charm required" description="Customers must pick a charm before adding the bracelet to the cart." checked={v.charmRequired} onChange={(x) => form.set('charmRequired', x)} />
              <Field label="Charm hint" hint="Shown when a customer tries to continue without a charm.">
                {({ id }) => <Input id={id} {...form.bind('charmHint')} placeholder="Choose a charm to continue." />}
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Customisation paths" description="The ways a customer can start a bracelet. Order here is the order in the studio menu." />
            {errors.studioModes && <p className="mb-3 text-xs text-rose-300">{errors.studioModes}</p>}
            <RowListEditor
              fixed
              rows={v.studioModes}
              onChange={(rows) => form.set('studioModes', rows)}
              title={(m) => (
                <span className="flex items-center gap-2">
                  <span className="font-mono">{m.slug}</span>
                  {!m.isActive && <Badge>Off</Badge>}
                </span>
              )}
              render={(m, update, i) => (
                <div className="space-y-3">
                  <Switch label="Active" checked={m.isActive} onChange={(x) => update({ isActive: x })} />
                  <FormGrid>
                    <Field label="Short label" required error={errors[`studioModes.${i}.short`]} hint="Used in navigation.">
                      {({ id }) => <Input id={id} value={m.short} onChange={(e) => update({ short: e.target.value })} />}
                    </Field>
                    <Field label="Menu label" required error={errors[`studioModes.${i}.label`]}>
                      {({ id }) => <Input id={id} value={m.label} onChange={(e) => update({ label: e.target.value })} />}
                    </Field>
                    <Field label="Eyebrow">{({ id }) => <Input id={id} value={m.eyebrow} onChange={(e) => update({ eyebrow: e.target.value })} />}</Field>
                    <Field label="Title">{({ id }) => <Input id={id} value={m.title} onChange={(e) => update({ title: e.target.value })} />}</Field>
                  </FormGrid>
                  <Field label="Body">{({ id }) => <Textarea id={id} rows={2} value={m.body} onChange={(e) => update({ body: e.target.value })} />}</Field>
                  <Field label="Choose-step hint" hint="Shown until the customer makes a choice.">
                    {({ id }) => <Input id={id} value={m.chooseHint} onChange={(e) => update({ chooseHint: e.target.value })} />}
                  </Field>
                  <ArtFields row={m} update={update} />
                </div>
              )}
            />
          </Card>
        </div>

        <div className="min-w-0">
          <PricePreview values={v} charms={charms} />
        </div>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 mt-4 border-t border-white/[0.08] bg-ink/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            {submitted && errorCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-rose-300">
                <AlertTriangle size={14} /> Fix {plural(errorCount, 'issue')} before saving.
              </span>
            ) : form.dirty ? (
              <span className="text-ivory">You have unsaved changes.</span>
            ) : (
              <span className="text-lilac">All changes saved.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              icon={RotateCcw}
              disabled={!form.dirty || save.isPending}
              onClick={() => {
                setSubmitted(false);
                form.reset();
              }}
            >
              Discard
            </Button>
            <Button variant="primary" type="submit" icon={Save} loading={save.isPending} disabled={!form.dirty}>
              Save settings
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function ArtFields({ row, update }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <Field label="Icon" hint="Emoji; image wins.">
        {({ id }) => <Input id={id} value={row.icon} onChange={(e) => update({ icon: e.target.value })} placeholder="✨" className="text-lg" />}
      </Field>
      <Field label="Image">
        <MediaInput folder="studio" value={row.image} onChange={(x) => update({ image: x })} aspect="aspect-[4/3]" />
      </Field>
    </div>
  );
}

function OptionFields({ row, update, errors, prefix, withPrice = false }) {
  return (
    <div className="space-y-3">
      <FormGrid cols={withPrice ? 3 : 2}>
        <Field label="Label" required error={errors[`${prefix}.label`]}>
          {({ id }) => <Input id={id} value={row.label} onChange={(e) => update({ label: e.target.value })} />}
        </Field>
        <Field label="Key" required error={errors[`${prefix}.key`]} hint="Saved with orders.">
          {({ id }) => <Input id={id} value={row.key} onChange={(e) => update({ key: e.target.value })} className="font-mono" />}
        </Field>
        {withPrice && (
          <Field label="Price" error={errors[`${prefix}.price`]}>
            {({ id }) => <MoneyInput id={id} value={row.price} onChange={(x) => update({ price: x })} />}
          </Field>
        )}
      </FormGrid>
      <Field label="Detail" hint="Short description under the label.">
        {({ id }) => <Input id={id} value={row.detail} onChange={(e) => update({ detail: e.target.value })} />}
      </Field>
      <ArtFields row={row} update={update} />
    </div>
  );
}

/** Client-side copy of the server pricing (pricingService.calculateCustomTotal) using the unsaved form values. */
function PricePreview({ values: v, charms }) {
  const { beads } = useStudioBeads();
  const activeBeads = beads.filter((b) => b.isActive !== false);
  const activeCharms = charms.filter((c) => c.isActive !== false);
  const [beadId, setBeadId] = useState('');
  const [count, setCount] = useState(10);
  const [czKey, setCzKey] = useState('');
  const [charmId, setCharmId] = useState('');

  const bead = activeBeads.find((b) => b._id === beadId) || activeBeads[0];
  const charm = activeCharms.find((c) => c._id === charmId) || activeCharms[0];
  const finish = charm?.finishes?.[0];
  const czOptions = v.czOptions.filter((o) => o.key.trim());
  const cz = czOptions.find((o) => o.key.trim() === czKey) || czOptions.find((o) => o.key.trim() === v.defaultCzStyle) || czOptions[0];
  const qty = Math.max(0, Math.floor(Number(count) || 0));
  const pricePerBead = Number(bead?.pricePerBead) || 0;
  const beadsTotal = qty * pricePerBead;
  const lines = [
    { key: 'box', label: v.packagingLabels.box || 'Box', amount: Number(v.packaging.box) || 0 },
    { key: 'clasp', label: v.packagingLabels.clasp || 'Clasp', amount: Number(v.packaging.clasp) || 0 },
    { key: 'charm', label: v.packagingLabels.charm || 'Charm', amount: Number(v.packaging.charm) || 0 },
    { key: 'cz', label: cz?.label || v.packagingLabels.cz || 'CZ', amount: Number(cz?.price) || 0 },
    { key: 'thread', label: v.packagingLabels.thread || 'Thread', amount: Number(v.packaging.thread) || 0 },
  ];
  const packagingTotal = lines.reduce((s, l) => s + l.amount, 0);
  const finishPrice = Math.max(0, Number(finish?.price) || 0);
  const total = beadsTotal + packagingTotal + finishPrice;
  const minBeads = Number(v.minBeads) || 1;
  const limit = Number(v.beadLimit) || 32;
  const outOfRange = qty < minBeads || qty > limit;
  const strand = strandBeadCount(v.defaultWristSize, v.defaultBeadSizeMm, Number(v.minBeads) || 8, limit);

  return (
    <Card className="xl:sticky xl:top-4">
      <CardHeader title="Price preview" description="Updates as you edit, before saving." actions={<Calculator size={16} className="text-gold" />} />
      <div className="space-y-3">
        <FormGrid>
          <Field label="Beads">{({ id }) => <NumberInput id={id} min={0} value={count} onChange={setCount} invalid={outOfRange} />}</Field>
          <Field label="Bead">
            {({ id }) => <Select id={id} options={activeBeads.map((b) => ({ value: b._id, label: `${b.name} · ${money(b.pricePerBead)}` }))} value={bead?._id || ''} onChange={(e) => setBeadId(e.target.value)} placeholder={activeBeads.length ? undefined : 'No active beads'} />}
          </Field>
          <Field label="CZ">{({ id }) => <Select id={id} options={czOptions.map((o) => ({ value: o.key.trim(), label: o.label || o.key }))} value={cz?.key.trim() || ''} onChange={(e) => setCzKey(e.target.value)} />}</Field>
          <Field label="Charm">
            {({ id }) => <Select id={id} options={activeCharms.map((c) => ({ value: c._id, label: c.name }))} value={charm?._id || ''} onChange={(e) => setCharmId(e.target.value)} placeholder={activeCharms.length ? undefined : 'No active charms'} />}
          </Field>
        </FormGrid>
        {outOfRange && (
          <p className="text-xs text-amber-200">
            Customers can only order {minBeads}–{limit} beads; this bracelet would be refused.
          </p>
        )}
        <dl className="space-y-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-lilac">
              {qty} × {bead?.name || 'bead'} at {money(pricePerBead)}
            </dt>
            <dd className="tabular-nums text-ivory">{money(beadsTotal)}</dd>
          </div>
          {lines.map((l) => (
            <div key={l.key} className="flex justify-between gap-3">
              <dt className="text-lilac">{l.label}</dt>
              <dd className="tabular-nums text-ivory">{money(l.amount)}</dd>
            </div>
          ))}
          {finishPrice > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-lilac">{finish.label} finish</dt>
              <dd className="tabular-nums text-ivory">{money(finishPrice)}</dd>
            </div>
          )}
          <Divider className="my-2" />
          <div className="flex justify-between gap-3 font-medium">
            <dt className="text-ivory">Total</dt>
            <dd className="tabular-nums text-gold">{money(total)}</dd>
          </div>
        </dl>
        <p className="text-xs text-lilac">
          {qty} beads at {money(pricePerBead)} + {money(packagingTotal + finishPrice)} packaging{finishPrice > 0 ? ' and finish' : ''} = <span className="text-ivory">{money(total)}</span>.
        </p>
        {v.defaultWristSize && v.defaultBeadSizeMm !== '' && (
          <p className="text-xs text-lilac">
            A {v.defaultWristSize} wrist with {v.defaultBeadSizeMm} mm beads fits about <span className="text-ivory">{strand} beads</span> by default.
          </p>
        )}
      </div>
    </Card>
  );
}
