import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Pencil, RotateCw, Sparkles } from 'lucide-react';
import api, { mediaUrl } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { formatInr } from '../../lib/format';
import {
  GEM_SLOTS,
  astroSummary,
  birthFormError,
  birthPayload,
  birthToForm,
  dashaDate,
  formatDegree,
  planetRows,
  safePdfUrl,
  svgDataUrl,
} from '../../lib/kundli';
import Spinner from '../ui/Spinner';
import PlaceAutocomplete from '../kundli/PlaceAutocomplete';

const POLL_MS = 5000;
const POLL_LIMIT_MS = 2 * 60 * 1000;
const WORKING = ['queued', 'generating'];

// Account → My Kundli: the free Kundli (AstrologyAPI) for orders at or above the CMS threshold.
// States follow the API status: not eligible / details needed / generating (polled) / ready / failed.
// Panel look follows the source "Vedic Guidance" tab (AuthPage.jsx 612-650). Styles: commerce.css "Kundli".
export default function MyKundli({ shopTo = '/shop' }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const pollStart = useRef(0);
  const [pollExpired, setPollExpired] = useState(false);
  // Bumped by "Check again" so polling restarts even when the status did not change.
  const [pollRound, setPollRound] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: next } = await api.get('/kundli/mine');
      setData(next);
      setError('');
      return next;
    } catch (err) {
      setError(err.message || 'Could not load your Kundli.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const status = data?.kundli?.status;
  useEffect(() => {
    if (!WORKING.includes(status)) {
      pollStart.current = 0;
      return undefined;
    }
    if (!pollStart.current) pollStart.current = Date.now();
    setPollExpired(false);
    const timer = setInterval(() => {
      if (Date.now() - pollStart.current > POLL_LIMIT_MS) {
        clearInterval(timer);
        setPollExpired(true);
        return;
      }
      load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [status, load, pollRound]);

  const checkAgain = () => {
    pollStart.current = Date.now();
    setPollExpired(false);
    setPollRound((n) => n + 1);
    load();
  };

  if (!data && !error) return <Spinner label="Loading your Kundli" />;
  if (!data) {
    return (
      <div className="acct-panel kd-panel">
        <p className="acct-muted" role="alert">
          {error}
        </p>
        <div className="acct-form-acts kd-acts">
          <button type="button" className="btn-outline acct-btn-o" onClick={load} disabled={loading}>
            <RotateCw size={13} /> {loading ? 'Trying…' : 'Try again'}
          </button>
        </div>
      </div>
    );
  }

  const { kundli, eligible, thresholdLabel } = data;
  const orderNumber = kundli?.eligibleOrderNumber || data.eligibleOrderNumber || '';
  const saved = (next) => {
    setEditing(false);
    setData(next);
  };

  if (editing || (eligible && (!kundli || kundli.status === 'details_needed'))) {
    const failedEdit = kundli?.status === 'failed';
    return (
      <div className="acct-panel kd-panel">
        <span className="kd-eyebrow">Free Vedic Kundli</span>
        <h3 className="acct-panel-t kd-title">{editing ? 'Edit birth details' : 'Add your birth details'}</h3>
        <p className="acct-muted kd-lead">
          {!eligible
            ? `Save your birth details now. Your Kundli is prepared automatically once an order of ${thresholdLabel} or more is paid online, or delivered if you pay on delivery.`
            : failedEdit
              ? 'Correct the details if needed and we will try again.'
              : kundli?.status === 'on_hold'
                ? 'Correct the details if needed. Your place in the queue is kept.'
              : editing
                ? `Saving new details prepares your Kundli again. Details can be changed once a day${
                    kundli?.regensLeft != null ? `, ${kundli.regensLeft} more time${kundli.regensLeft === 1 ? '' : 's'}` : ''
                  }.`
                : `Your order ${orderNumber} qualifies for a complimentary Kundli. Enter the birth details and we will prepare it right away.`}
        </p>
        <KundliForm
          birth={kundli?.birth}
          onSaved={saved}
          onCancel={editing ? () => setEditing(false) : null}
          submitLabel={failedEdit ? 'Save & try again' : eligible ? 'Save & prepare my Kundli' : 'Save birth details'}
        />
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="acct-panel kd-panel">
        <span className="kd-eyebrow">Free Vedic Kundli</span>
        <h3 className="acct-panel-t kd-title">Your Kundli, on us</h3>
        <p className="acct-muted kd-lead">
          Place an order of <strong className="kd-gold">{thresholdLabel}</strong> or more and your personalised Vedic Kundli (birth chart, planets,
          dasha, manglik check, gemstone and rudraksha guidance, and a PDF) appears here automatically, once the order is paid online or, for cash
          on delivery, delivered.
        </p>
        {kundli?.birth ? (
          <p className="acct-muted">
            Birth details saved for <strong className="kd-gold">{kundli.birth.name}</strong> · {kundli.birth.dob} · {kundli.birth.place}.
          </p>
        ) : null}
        <div className="acct-form-acts kd-acts">
          <Link to={shopTo} className="btn-gold acct-btn">
            <Sparkles size={14} /> Explore sacred pieces
          </Link>
          <button type="button" className="btn-outline acct-btn-o" onClick={() => setEditing(true)}>
            <Pencil size={13} /> {kundli?.birth ? 'Edit birth details' : 'Add birth details now'}
          </button>
        </div>
      </div>
    );
  }

  // Waiting for the store's daily/weekly/monthly limits (or a pause): no polling, it can take a while.
  if (kundli.status === 'on_hold') {
    return (
      <div className="acct-panel kd-panel">
        <span className="kd-eyebrow">Free Vedic Kundli</span>
        <h3 className="acct-panel-t kd-title">Your Kundli is in the queue</h3>
        <div className="kd-working">
          <span className="kd-orb" aria-hidden />
          <p className="acct-muted">
            We have your details for {kundli.birth?.name || 'you'} and your Kundli will be prepared shortly, usually within a day. It appears here
            automatically once it is ready.
          </p>
        </div>
        <div className="acct-form-acts kd-acts">
          <button type="button" className="btn-outline acct-btn-o" onClick={load} disabled={loading}>
            <RotateCw size={13} /> {loading ? 'Checking…' : 'Check again'}
          </button>
          <button type="button" className="btn-outline acct-btn-o" onClick={() => setEditing(true)}>
            <Pencil size={13} /> Correct birth details
          </button>
        </div>
      </div>
    );
  }

  if (WORKING.includes(kundli.status)) {
    return (
      <div className="acct-panel kd-panel">
        <span className="kd-eyebrow">Free Vedic Kundli</span>
        <h3 className="acct-panel-t kd-title">Preparing your Kundli</h3>
        <div className="kd-working">
          <span className="kd-orb" aria-hidden />
          <p className="acct-muted">
            {pollExpired
              ? 'This is taking longer than usual. Check back in a few minutes.'
              : `We are calculating the chart for ${kundli.birth?.name || 'you'}. This usually takes under a minute.`}
          </p>
        </div>
        {pollExpired && (
          <button type="button" className="btn-outline acct-btn-o" onClick={checkAgain} disabled={loading}>
            <RotateCw size={13} /> Check again
          </button>
        )}
      </div>
    );
  }

  if (kundli.status === 'failed') {
    return <KundliFailed kundli={kundli} onEdit={() => setEditing(true)} onRetried={setData} />;
  }

  return <KundliReady data={data} onEdit={() => setEditing(true)} />;
}

function whenLabel(d) {
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

// Failed first generation: the customer can retry (limited, a few minutes apart) or correct the details.
function KundliFailed({ kundli, onEdit, onRetried }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const retry = kundli.retry || { left: 0, after: null };
  const after = retry.after ? new Date(retry.after) : null;
  const canRetry = retry.left > 0;

  async function runRetry() {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/kundli/retry');
      onRetried(data);
    } catch (err) {
      setError(err.message || 'Could not try again. Please try later.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="acct-panel kd-panel">
      <span className="kd-eyebrow">Free Vedic Kundli</span>
      <h3 className="acct-panel-t kd-title">Your Kundli needs a moment</h3>
      <p className="acct-muted kd-lead">
        {canRetry
          ? 'We could not prepare your Kundli just now. Our team has been notified. You can try again, or check your birth details first.'
          : 'We could not prepare your Kundli after several tries. Our team has been notified and will have it ready for you shortly.'}
      </p>
      {kundli.birth && (
        <p className="acct-muted">
          Birth details: <strong className="kd-gold">{kundli.birth.name}</strong> · {kundli.birth.dob} · {kundli.birth.tobUnknown ? 'time unknown' : kundli.birth.tob} ·{' '}
          {kundli.birth.place}
        </p>
      )}
      {canRetry && after && <p className="acct-hint">You can try again after {whenLabel(after)}.</p>}
      {error && (
        <p className="acct-bad" role="alert">
          {error}
        </p>
      )}
      {canRetry && (
        <div className="acct-form-acts kd-acts">
          <button type="button" className="btn-gold acct-btn" onClick={runRetry} disabled={busy || Boolean(after)}>
            <RotateCw size={13} /> {busy ? 'Trying…' : 'Try again'}
          </button>
          <button type="button" className="btn-outline acct-btn-o" onClick={onEdit} disabled={Boolean(after)}>
            <Pencil size={13} /> Edit birth details
          </button>
        </div>
      )}
    </div>
  );
}

function KundliReady({ data, onEdit }) {
  const { kundli, suggestions = {} } = data;
  const s = kundli.sections || {};
  const b = kundli.birth || {};
  const chips = astroSummary(s.astro);
  const planets = planetRows(s.planets);
  const chart = svgDataUrl(s.chartSvg);
  const dasha = s.dasha && typeof s.dasha === 'object' ? s.dasha : null;
  const manglik = s.manglik && typeof s.manglik === 'object' ? s.manglik : null;
  const gems = s.gems && typeof s.gems === 'object' ? s.gems : {};
  const rud = s.rudraksha && typeof s.rudraksha === 'object' ? s.rudraksha : null;
  const editableAfter = kundli.editableAfter ? new Date(kundli.editableAfter) : null;
  const pdfUrl = safePdfUrl(kundli.pdfUrl);
  const locked = Boolean(kundli.editLocked);
  const pending = Boolean(kundli.updatePending);

  return (
    <div className="kd-ready">
      <div className="acct-panel kd-panel">
        <div className="kd-head">
          <div>
            <span className="kd-eyebrow">Natal planetary harmony</span>
            <h3 className="acct-panel-t kd-title">{b.name ? `${b.name}’s Vedic Kundli` : 'Your Vedic Kundli'}</h3>
            <p className="acct-muted kd-born">
              {b.dob} · {b.tobUnknown ? 'birth time unknown (12:00 used)' : b.tob} · {b.place}
            </p>
          </div>
          <div className="kd-head-acts">
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-gold acct-btn">
                <Download size={14} /> Download Kundli PDF
              </a>
            )}
            {!locked && !pending && (
              <button
                type="button"
                className="btn-outline acct-btn-o"
                onClick={onEdit}
                disabled={Boolean(editableAfter)}
                title={editableAfter ? `You can edit again after ${whenLabel(editableAfter)}` : undefined}
              >
                <Pencil size={13} /> Edit birth details
              </button>
            )}
          </div>
        </div>
        {kundli.updateFailed && (
          <p className="acct-hint kd-warn" role="status">
            We could not update your Kundli with the new birth details, so your previous Kundli is shown. Please try again later.
          </p>
        )}
        {pending && (
          <p className="acct-hint" role="status">
            Your new birth details are in the queue. The updated Kundli replaces this one shortly, usually within a day.
          </p>
        )}
        {editableAfter && !pending && <p className="acct-hint">Birth details can be changed once a day: next after {whenLabel(editableAfter)}.</p>}
        {locked && <p className="acct-hint">Your Kundli has been updated the maximum number of times. Contact us if the birth details need another change.</p>}
        {chips.length > 0 && (
          <div className="kd-chips">
            {chips.map(([k, v]) => (
              <div key={k} className="kd-chip">
                <span className="kd-chip-k">{k}</span>
                <span className="kd-chip-v">{String(v)}</span>
              </div>
            ))}
          </div>
        )}
        {kundli.missing?.length > 0 && (
          <p className="acct-hint">Some parts could not be prepared this time ({kundli.missing.join(', ')}). Our team has been notified.</p>
        )}
      </div>

      {(chart || planets.length > 0) && (
        <div className="kd-grid">
          {chart && (
            <div className="acct-panel kd-panel kd-chart-card">
              <h4 className="kd-h">Lagna chart (D1)</h4>
              <img src={chart} alt={`North Indian birth chart for ${b.name || 'you'}`} className="kd-chart" />
            </div>
          )}
          {planets.length > 0 && (
            <div className="acct-panel kd-panel">
              <h4 className="kd-h">Planetary positions</h4>
              <div className="kd-table-wrap">
                <table className="kd-table">
                  <thead>
                    <tr>
                      <th>Planet</th>
                      <th>Sign</th>
                      <th>House</th>
                      <th>Degree</th>
                      <th>Retro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planets.map((p) => (
                      <tr key={p.name}>
                        <td>{p.name}</td>
                        <td>{p.sign}</td>
                        <td>{p.house}</td>
                        <td>{formatDegree(p.degree)}</td>
                        <td>{p.retro ? <span className="kd-gold">R</span> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {(dasha || manglik) && (
        <div className="kd-grid">
          {dasha && (
            <div className="acct-panel kd-panel">
              <h4 className="kd-h">Current Vimshottari dasha</h4>
              <div className="kd-dasha">
                {[
                  ['Mahadasha', dasha.major],
                  ['Antardasha', dasha.minor],
                  ['Pratyantar', dasha.sub_minor],
                ]
                  .filter(([, d]) => d && d.planet)
                  .map(([label, d]) => (
                    <div key={label} className="kd-dasha-row">
                      <span className="kd-chip-k">{label}</span>
                      <strong className="kd-dasha-p">{d.planet}</strong>
                      <span className="acct-muted-i">
                        {dashaDate(d.start)} – {dashaDate(d.end)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {manglik && (
            <div className="acct-panel kd-panel">
              <h4 className="kd-h">Manglik dosha</h4>
              <p className={`kd-manglik${manglik.is_present ? ' is-on' : ''}`}>
                {manglik.manglik_status || (manglik.is_present ? 'Manglik' : 'Not manglik')}
              </p>
              {Number.isFinite(Number(manglik.percentage_manglik_present)) && (
                <p className="acct-muted">
                  Manglik influence {Number(manglik.percentage_manglik_present)}%
                  {Number.isFinite(Number(manglik.percentage_manglik_after_cancellation))
                    ? ` · ${Number(manglik.percentage_manglik_after_cancellation)}% after cancellation`
                    : ''}
                </p>
              )}
              {manglik.manglik_report && <p className="acct-muted kd-report">{String(manglik.manglik_report)}</p>}
            </div>
          )}
        </div>
      )}

      {(GEM_SLOTS.some(({ key }) => gems[key]) || rud) && (
        <div className="acct-panel kd-panel">
          <span className="kd-eyebrow">Your gemstone matrix</span>
          <h4 className="kd-h">Recommended stones &amp; rudraksha</h4>
          <div className="kd-gems">
            {GEM_SLOTS.filter(({ key }) => gems[key]).map(({ key, label }) => {
              const g = gems[key];
              return (
                <div key={key} className="kd-gem">
                  <span className="kd-chip-k">{label}</span>
                  <h5 className="kd-gem-n">{g.name}</h5>
                  {g.semi_gem && <p className="kd-gem-sub">Alternative: {g.semi_gem}</p>}
                  <dl className="kd-gem-dl">
                    {g.wear_metal && (
                      <>
                        <dt>Metal</dt>
                        <dd>{g.wear_metal}</dd>
                      </>
                    )}
                    {g.wear_finger && (
                      <>
                        <dt>Finger</dt>
                        <dd>{g.wear_finger}</dd>
                      </>
                    )}
                    {g.wear_day && (
                      <>
                        <dt>Day</dt>
                        <dd>{g.wear_day}</dd>
                      </>
                    )}
                  </dl>
                  <SuggestedProducts items={suggestions[key]} />
                </div>
              );
            })}
            {rud && (
              <div className="kd-gem">
                <span className="kd-chip-k">Rudraksha</span>
                <h5 className="kd-gem-n">{rud.name ? `${rud.name} Rudraksha`.replace(/Rudraksha Rudraksha/i, 'Rudraksha') : 'Rudraksha'}</h5>
                {rud.recommend && <p className="kd-gem-sub">{rud.recommend}</p>}
                {rud.detail && <p className="acct-muted kd-report">{String(rud.detail).slice(0, 320)}</p>}
                <SuggestedProducts items={suggestions.rudraksha} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestedProducts({ items }) {
  if (!items?.length) return null;
  return (
    <div className="kd-products">
      {items.map((p) => (
        <Link key={`${p.kind}-${p.slug}`} to={p.to || `/p/${p.slug}`} className="kd-product">
          {p.image ? <img src={mediaUrl(p.image)} alt="" loading="lazy" /> : <span className="kd-product-ph" aria-hidden />}
          <span className="kd-product-n">{p.name}</span>
          <span className="kd-product-p">{p.kind === 'bead' ? `${formatInr(p.price)} / bead` : formatInr(p.price)}</span>
        </Link>
      ))}
    </div>
  );
}

function KundliForm({ birth, onSaved, onCancel, submitLabel }) {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState(() => birthToForm(birth, user?.name || ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  async function submit(e) {
    e.preventDefault();
    const invalid = birthFormError(form);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { data } = await api.put('/kundli/details', birthPayload(form));
      onSaved(data);
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="kd-form" onSubmit={submit} noValidate>
      <div className="acct-fields">
        <div>
          <label className="acct-label" htmlFor="kd-name">Full name</label>
          <input id="kd-name" type="text" className="acct-input" value={form.name} onChange={set('name')} autoComplete="name" />
        </div>
        <div>
          <label className="acct-label" htmlFor="kd-gender">Gender</label>
          <select id="kd-gender" required className="acct-input kd-select" value={form.gender} onChange={set('gender')}>
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
        <div>
          <label className="acct-label" htmlFor="kd-dob">Date of birth</label>
          <input id="kd-dob" type="date" max={today} className="acct-input kd-date" value={form.dob} onChange={set('dob')} />
        </div>
        <div>
          <label className="acct-label" htmlFor="kd-tob">Time of birth</label>
          <input id="kd-tob" type="time" className="acct-input kd-date" value={form.tob} onChange={set('tob')} disabled={form.tobUnknown} />
          <label className="acct-check kd-check">
            <input type="checkbox" checked={form.tobUnknown} onChange={set('tobUnknown')} />
            I don&apos;t know my birth time
          </label>
        </div>
        <div className="is-wide">
          <label className="acct-label" htmlFor="kd-place">Place of birth</label>
          <PlaceAutocomplete id="kd-place" value={form.place} onChange={(place) => setForm((f) => ({ ...f, place }))} inputClassName="acct-input" />
        </div>
      </div>
      {error && (
        <p className="acct-bad" role="alert">
          {error}
        </p>
      )}
      <div className="acct-form-acts">
        <button type="submit" className="btn-gold acct-btn" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-outline acct-btn-o" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
