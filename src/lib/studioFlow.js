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
  if (state.path === 'numerology') {
    return Boolean(state.mulankNumber || state.bhagyankNumber);
  }
  return Boolean(state.layerItem);
}

export function selectionHint(path, config) {
  const mode = (config?.studioModes || []).find((row) => row.slug === path);
  if (mode?.chooseHint) return mode.chooseHint;
  if (path === 'numerology') return 'Enter your date of birth to continue.';
  if (path === 'zodiac') return 'Choose your zodiac sign to continue.';
  if (path === 'planetary') return 'Choose a planet to continue.';
  if (path === 'profession') return 'Choose the work you do to continue.';
  return 'Choose an option to continue.';
}

// Step one of the numerology, zodiac, planetary and profession paths.
const CHOOSE_STEP = {
  id: 'choose',
  label: 'Choose',
  eyebrow: 'Step 01 · Choose',
  title: 'What is this bracelet for?',
  body: 'Begin with why you wear it. Your choice sets the crystals we suggest next.',
  validate: selectionReady,
  hint: (state) => selectionHint(state.path, state.config),
};

function numbersChosen(state) {
  const picked = (value) => value === true || value === false;
  return picked(state.includeMulankBead) && picked(state.includeBhagyankBead) && picked(state.includeZodiacBead);
}

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
    body: 'Your date sets Mulank, Bhagyank, and your zodiac sign. Then choose the number beads and the sign’s crystals.',
    validate: (state) => {
      if (state.path !== 'purpose') return Boolean(state.dateOfBirth);
      if (!state.dateOfBirth) return false;
      if (!numbersChosen(state)) return false;
      const target = [16, 18, 22].includes(Number(state.strandCount)) ? Number(state.strandCount) : 18;
      const total = Object.values(state.quantities || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
      return total === target;
    },
    hint: (state) => {
      if (!state.dateOfBirth) return 'Choose day, month and year to continue.';
      if (state.path !== 'purpose') return '';
      if (!numbersChosen(state)) return 'Choose yes or no for the Mulank bead, the Bhagyank bead, and the zodiac bead.';
      const target = [16, 18, 22].includes(Number(state.strandCount)) ? Number(state.strandCount) : 18;
      const total = Object.values(state.quantities || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
      if (total !== target) return `This strand is ${target} beads. You have ${total}. Adjust the counts to match.`;
      return '';
    },
  },
  {
    id: 'charm',
    label: 'Charm',
    eyebrow: 'Step 04 · Charm',
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
    eyebrow: 'Step 05 · Review',
    title: 'Review & order',
    body: 'Confirm the composition, then place the piece in your bag.',
    validate: () => true,
    hint: () => '',
  },
];

function strandTarget(state) {
  return [16, 18, 22].includes(Number(state.strandCount)) ? Number(state.strandCount) : 18;
}

function strandTotal(state) {
  return Object.values(state.quantities || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

function strandMatched(state) {
  const matched = strandTotal(state) === strandTarget(state);
  if (state.path === 'numerology' || state.path === 'zodiac') return matched;
  return Boolean(state.zodiacAdded) && matched;
}

function strandHint(state) {
  // Planetary and profession strands carry the zodiac crystal from the date of birth.
  if (state.path !== 'zodiac' && state.path !== 'numerology' && !state.zodiacAdded) {
    return state.dateOfBirth ? 'Placing your zodiac crystal…' : 'Enter your date of birth to add your zodiac crystal.';
  }
  if (!state.calibration && state.path === 'numerology') return 'Placing the beads…';
  const target = strandTarget(state);
  const total = strandTotal(state);
  if (total !== target) return `This strand is ${target} beads. You have ${total}. Adjust the counts to match.`;
  return '';
}

const PURPOSE_CHARM = PURPOSE_FLOW.find((entry) => entry.id === 'charm');
const PURPOSE_REVIEW = PURPOSE_FLOW.find((entry) => entry.id === 'review');

// Every non-purpose path takes the date of birth elsewhere (numerology on its first step,
// planetary and profession on the beads step; zodiac needs none), so none has a birth step.
const LAYER_FLOW = [
  CHOOSE_STEP,
  {
    id: 'crystals',
    label: 'Crystals',
    eyebrow: 'Step 02 · Crystals',
    title: 'Choose your crystals',
    body: 'Select the stones, then choose a strand of 16, 18, or 22 beads.',
    validate: (state) => selectedCrystals(state).length > 0 && strandTotal(state) === strandTarget(state),
    hint: (state) => {
      if (!selectedCrystals(state).length) return 'Select a crystal to continue.';
      const target = strandTarget(state);
      const total = strandTotal(state);
      if (total !== target) return `Choose 16, 18, or 22 beads. You have ${total}.`;
      return '';
    },
  },
  {
    id: 'beads',
    label: 'Beads',
    eyebrow: 'Step 03 · Beads',
    title: 'Beads on this strand',
    body: 'Adjust each crystal until the total matches the strand.',
    validate: strandMatched,
    hint: strandHint,
  },
  { ...PURPOSE_CHARM, eyebrow: 'Step 04 · Charm' },
  { ...PURPOSE_REVIEW, eyebrow: 'Step 05 · Review' },
];

// Every step that appears on any path, once, in first-seen order (the admin edits their copy).
export const STUDIO_STEPS = [...PURPOSE_FLOW, ...LAYER_FLOW].filter((entry, i, all) => all.findIndex((e) => e.id === entry.id) === i);

export function flowFor(path) {
  return path === 'purpose' ? PURPOSE_FLOW : LAYER_FLOW;
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
