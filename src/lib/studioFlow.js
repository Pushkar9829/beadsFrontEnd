export const STUDIO_PATHS = ['purpose', 'numerology', 'zodiac', 'planetary', 'profession'];

export function qtyOf(quantities, id) {
  if (!quantities || id == null) return 0;
  const direct = quantities[String(id)];
  if (direct != null) return Number(direct) || 0;
  return Number(quantities[id]) || 0;
}

export function isLayerPath(path) {
  return path !== 'purpose' && STUDIO_PATHS.includes(path);
}

export function selectedCrystals(state) {
  return (state.recommended || []).filter((bead) => qtyOf(state.quantities, bead._id) > 0);
}

export function crystalLimits(state) {
  const pool = (state.recommended || []).length;
  const count = selectedCrystals(state).length;
  const wantedMin = Number(state.config?.crystalMin) || 3;
  const wantedMax = state.path === 'numerology'
    ? Number(state.config?.crystalMaxNumerology) || 8
    : Number(state.config?.crystalMax) || 5;
  const min = Math.max(1, Math.min(wantedMin, pool || wantedMin));
  const max = Math.max(min, wantedMax);
  const ok = count >= min && count <= max;
  let message = '';
  if (!pool) message = 'These crystals are not in the atelier yet.';
  else if (count < min) message = `Choose at least ${min} crystal${min === 1 ? '' : 's'}.`;
  else if (count > max) message = `Keep at most ${max} crystals.`;
  return { count, min, max, pool, ok, message };
}

export function selectionReady(state) {
  if (state.path === 'purpose') {
    return Boolean(state.purpose) && (state.selectedIntentions || []).length > 0;
  }
  if (state.path === 'numerology') {
    return Boolean(state.mulankNumber || state.bhagyankNumber);
  }
  return Boolean(state.layerItem);
}

export function selectionHint(path, config) {
  const mode = (config?.studioModes || []).find((row) => row.slug === path);
  if (mode?.chooseHint) return mode.chooseHint;
  if (path === 'numerology') return 'Choose a Mulank or Bhagyank number to continue.';
  if (path === 'zodiac') return 'Choose your zodiac sign to continue.';
  if (path === 'planetary') return 'Choose a planet to continue.';
  if (path === 'profession') return 'Choose the work you do to continue.';
  const cap = Number(config?.intentionCap) || 3;
  return `Choose a purpose, then up to ${cap} intention${cap === 1 ? '' : 's'}.`;
}

export const STUDIO_FLOW = [
  {
    id: 'choose',
    label: 'Choose',
    eyebrow: 'Step 01 · Choose',
    title: 'What is this bracelet for?',
    body: 'Begin with why you wear it. Your choice sets the crystals we suggest next.',
    validate: selectionReady,
    hint: (state) => selectionHint(state.path, state.config),
  },
  {
    id: 'crystals',
    label: 'Crystals',
    eyebrow: 'Step 02 · Crystals',
    title: 'Choose your crystals',
    body: 'We have pre-selected the traditional stones. Add or remove any of them.',
    validate: (state) => crystalLimits(state).ok,
    hint: (state) => crystalLimits(state).message,
  },
  {
    id: 'fit',
    label: 'Fit',
    eyebrow: 'Step 03 · Fit',
    title: 'How it should fit',
    body: 'Bead size and wrist size together set how many beads the strand carries.',
    validate: (state) => Boolean(state.wristSize && state.beadSizeMm),
    hint: () => 'Choose a bead size and a wrist size.',
  },
  {
    id: 'finish',
    label: 'Finish',
    eyebrow: 'Step 04 · Finish',
    title: 'Finish the piece',
    body: 'Pick the charm at the clasp, the accent, the thread, and an optional name.',
    validate: (state) => state.config?.charmRequired === false || Boolean(state.charm),
    hint: (state) => (state.config?.charmRequired === false ? '' : (state.config?.charmHint || 'Choose a charm to continue.')),
  },
  {
    id: 'review',
    label: 'Review',
    eyebrow: 'Step 05 · Review',
    title: 'Review & order',
    body: 'Confirm the composition, then place the piece in your bag.',
    validate: () => true,
    hint: () => '',
  },
];

function intentionBeadsReady(state) {
  return Boolean(state.intention) && selectedCrystals(state).length > 0;
}

function charmReady(state) {
  if (state.config?.charmRequired !== false && !state.charm) return false;
  if (state.threadType === 'steel-core' && !state.wristSize) return false;
  return true;
}

// The purpose path keeps the earlier wizard: one intention, then birth, zodiac, and charm.
export const PURPOSE_FLOW = [
  {
    id: 'purpose',
    label: 'Purpose',
    eyebrow: 'Step 01 · Purpose',
    title: 'Choose a purpose',
    body: 'Start with the feeling you want this piece to hold. Intentions appear only after you choose.',
    validate: (state) => Boolean(state.purpose),
    hint: () => 'Choose a purpose to continue.',
  },
  {
    id: 'intention',
    label: 'Intention',
    eyebrow: 'Step 02 · Intention',
    title: 'Choose an intention',
    body: 'One intention sets the crystals. Each mapped stone starts on the strand. Turn any of them off before you continue.',
    validate: intentionBeadsReady,
    hint: () => 'Select an intention so its crystals are chosen.',
  },
  {
    id: 'birth',
    label: 'Birth',
    eyebrow: 'Step 03 · Birth',
    title: 'Date of birth',
    body: 'Your date sets Mulank and the repeating crystal pattern around the strand.',
    validate: (state) => Boolean(state.dateOfBirth),
    hint: () => 'Choose day, month and year to continue.',
  },
  {
    id: 'zodiac',
    label: 'Zodiac',
    eyebrow: 'Step 04 · Zodiac',
    title: 'Zodiac beads',
    body: 'The sign comes from your date. Those beads sit either side of the charm.',
    validate: (state) => Boolean(state.calibration),
    hint: () => 'Calibrate from your date of birth first.',
  },
  {
    id: 'charm',
    label: 'Charm',
    eyebrow: 'Step 05 · Charm',
    title: 'Charm and thread',
    body: 'Pick the charm at the clasp and the thread. Steel core also needs a wrist size.',
    validate: charmReady,
    hint: (state) => {
      if (state.config?.charmRequired !== false && !state.charm) return state.config?.charmHint || 'Choose a charm to continue.';
      if (state.threadType === 'steel-core' && !state.wristSize) return 'Choose a wrist size for steel core thread.';
      return '';
    },
  },
  {
    id: 'review',
    label: 'Review',
    eyebrow: 'Step 06 · Review',
    title: 'Review & order',
    body: 'Confirm the composition, then place the piece in your bag.',
    validate: () => true,
    hint: () => '',
  },
];

export const STEP_COUNT = STUDIO_FLOW.length;
export const REVIEW_STEP = STEP_COUNT;

export function flowFor(path) {
  return path === 'purpose' ? PURPOSE_FLOW : STUDIO_FLOW;
}

export function stepCountFor(path) {
  return flowFor(path).length;
}

export function stepAt(step, path) {
  const flow = flowFor(path);
  return flow[Math.min(Math.max(Number(step) || 1, 1), flow.length) - 1];
}

export function stepIndexOf(id, path) {
  const index = flowFor(path).findIndex((entry) => entry.id === id);
  return index < 0 ? 1 : index + 1;
}

// Copy can be overridden per step from the admin content panel. Entries are matched
// by id so reordering or renaming steps never shifts the wrong copy into a step.
export function stepCopy(step, cmsSteps, path) {
  const entry = stepAt(step, path);
  const override = (cmsSteps || []).find((row) => row?.id === entry.id) || {};
  return {
    eyebrow: override.eyebrow || entry.eyebrow,
    title: override.title || entry.title,
    body: override.body || entry.body,
    hint: override.hint || '',
  };
}
