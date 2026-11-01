import { useState } from 'react';
import { Save } from 'lucide-react';
import { apiSend, useApiMutation } from '../lib/query';
import { dateTime, number } from '../lib/format';
import { KUNDLI_SECTION_LABELS } from '../../lib/kundli';
import { Badge, Button, Card, CardHeader, Checkbox, Field, FormGrid, FormSection, Input, NumberInput, Switch } from '../ui';

const PERIODS = [
  { key: 'day', label: 'Today', limit: 'Per day' },
  { key: 'week', label: 'This week', limit: 'Per week', hint: 'Monday to Sunday' },
  { key: 'month', label: 'This month', limit: 'Per month' },
];
const PART_KEYS = ['astro', 'planets', 'chartSvg', 'dasha', 'manglik', 'gems', 'rudraksha', 'pdf'];

// IST calendar date of a stored instant, for the date input.
function istDate(value) {
  if (!value) return '';
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? '' : new Date(t + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function formOf(settings) {
  return {
    enabled: settings.enabled,
    limits: { ...settings.limits },
    parts: { ...settings.parts },
    customerRegenCap: settings.customerRegenCap,
    customerRetryCap: settings.customerRetryCap,
    placesDailyCap: settings.placesDailyCap,
    eligibleFrom: istDate(settings.storedEligibleFrom),
  };
}

const blank = (v) => (v === '' || v === undefined ? null : v);

/**
 * Admin -> Kundli -> generation settings: on/off, run limits per day / week / month (customer and
 * automatic runs wait "On hold" when a limit is full and start oldest first when there is room), the parts
 * requested per Kundli (one AstrologyAPI call each), customer limits and the launch date.
 */
export default function KundliSettings({ rules, canEdit }) {
  const { settings, usage } = rules;
  const [form, setForm] = useState(() => formOf(settings));
  const save = useApiMutation((body) => apiSend('put', '/admin/kundli/settings', body), {
    invalidate: ['/admin/kundli'],
    success: 'Kundli settings saved.',
  });

  const setLimit = (key) => (v) => setForm((f) => ({ ...f, limits: { ...f.limits, [key]: v } }));
  const setPart = (key) => (v) => setForm((f) => ({ ...f, parts: { ...f.parts, [key]: v } }));
  const setCap = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));
  const calls = PART_KEYS.filter((k) => form.parts[k]).length;
  const noData = !PART_KEYS.some((k) => k !== 'pdf' && form.parts[k]);

  const submit = (e) => {
    e.preventDefault();
    const body = {
      enabled: form.enabled,
      limits: Object.fromEntries(PERIODS.map(({ key }) => [key, blank(form.limits[key])])),
      parts: form.parts,
      customerRegenCap: blank(form.customerRegenCap),
      customerRetryCap: blank(form.customerRetryCap),
      placesDailyCap: blank(form.placesDailyCap),
    };
    if (!rules.eligibleFromEnv && form.eligibleFrom) body.eligibleFrom = form.eligibleFrom;
    save.mutate(body);
  };

  return (
    <Card className="mb-5">
      <form onSubmit={submit} className="space-y-6">
        <CardHeader
          className="mb-0"
          title="Generation settings"
          description={`Each Kundli makes one AstrologyAPI call per part: ${settings.callsPerKundli} now.${settings.updatedAt ? ` Last saved ${dateTime(settings.updatedAt)}.` : ''}`}
          actions={
            canEdit && (
              <Button type="submit" variant="primary" size="sm" icon={Save} loading={save.isPending} disabled={noData}>
                Save settings
              </Button>
            )
          }
        />

        <Switch
          checked={form.enabled}
          onChange={setCap('enabled')}
          disabled={!canEdit}
          label="Free Kundli generation"
          description={
            form.enabled
              ? 'On: Kundlis are prepared when a qualifying order is paid or delivered.'
              : 'Paused: customers can still save birth details; their Kundlis wait "On hold" and start when you switch this back on.'
          }
        />

        <FormSection
          title="Usage"
          description={`Runs started and AstrologyAPI calls made (IST). Admin Regenerate counts here but is never held.${rules.held ? '' : ' Nothing is on hold.'}`}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PERIODS.map(({ key, label }) => {
              const u = usage[key];
              const full = u.limit && u.runs >= u.limit;
              return (
                <div key={key} className="rounded-xl border border-white/[0.08] bg-raised/50 p-3">
                  <p className="text-xs text-lilac">{label}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-ivory">
                    {number(u.runs)}
                    <span className="text-sm font-normal text-lilac"> / {u.limit ? number(u.limit) : 'no limit'} Kundlis</span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-lilac">
                    {number(u.calls)} API calls {full && <Badge tone="warning">Limit reached</Badge>}
                  </p>
                </div>
              );
            })}
          </div>
          {rules.held > 0 && (
            <p className="text-xs text-amber-200">
              {number(rules.held)} Kundli{rules.held === 1 ? ' is' : 's are'} on hold. They start oldest first, one at a time, when generation is on and the
              limits leave room (checked every 2 minutes and when you save).
            </p>
          )}
        </FormSection>

        <FormSection title="Run limits" description="Most Kundlis started per period, counting first runs, retries and customer updates. Leave empty for no limit.">
          <FormGrid cols={3}>
            {PERIODS.map(({ key, limit, hint }) => (
              <Field key={key} label={limit} hint={hint}>
                <NumberInput min={1} value={form.limits[key]} onChange={setLimit(key)} placeholder="No limit" disabled={!canEdit} />
              </Field>
            ))}
          </FormGrid>
        </FormSection>

        <FormSection
          title="Parts of each Kundli"
          description={`One API call each. With these ticks: ${calls} call${calls === 1 ? '' : 's'} per Kundli. Applies to the next runs; existing Kundlis keep what they have.`}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PART_KEYS.map((key) => (
              <Checkbox key={key} checked={form.parts[key]} onChange={setPart(key)} label={KUNDLI_SECTION_LABELS[key]} disabled={!canEdit} />
            ))}
          </div>
          {noData && <p className="text-xs text-rose-300">Keep at least one part besides the PDF.</p>}
        </FormSection>

        <FormSection title="Customer limits" description="Leave empty to use the default shown.">
          <FormGrid cols={3}>
            <Field label="Updates of a ready Kundli" hint="New birth details, once a day">
              <NumberInput min={0} value={form.customerRegenCap} onChange={setCap('customerRegenCap')} placeholder={`Default ${settings.defaults.customerRegenCap}`} disabled={!canEdit} />
            </Field>
            <Field label="Retries of a failed Kundli">
              <NumberInput min={0} value={form.customerRetryCap} onChange={setCap('customerRetryCap')} placeholder={`Default ${settings.defaults.customerRetryCap}`} disabled={!canEdit} />
            </Field>
            <Field label="Place searches per day" hint={`New lookups; ${number(rules.places.today)} used today`}>
              <NumberInput min={0} value={form.placesDailyCap} onChange={setCap('placesDailyCap')} placeholder={`Default ${settings.defaults.placesDailyCap}`} disabled={!canEdit} />
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection
          title="Launch date"
          description={
            rules.eligibleFromEnv
              ? `Set by KUNDLI_ELIGIBLE_FROM on the server (${dateTime(rules.eligibleFrom)}); remove it there to edit here.`
              : 'Only orders paid (or delivered, for cash on delivery) on or after this date (IST) unlock a free Kundli.'
          }
        >
          <FormGrid cols={3}>
            <Field label="Orders from">
              <Input type="date" value={form.eligibleFrom} onChange={(e) => setCap('eligibleFrom')(e.target.value)} disabled={!canEdit || rules.eligibleFromEnv} />
            </Field>
          </FormGrid>
        </FormSection>
      </form>
    </Card>
  );
}
