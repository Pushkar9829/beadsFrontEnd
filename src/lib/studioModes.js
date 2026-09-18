const SHARED_STEPS =
  'Then the same four steps for every path: crystals, fit, finish, review.';

export const STUDIO_MODES = [
  {
    slug: 'purpose',
    path: '/customize?path=purpose',
    label: 'Customise by purpose',
    short: 'Purpose',
    eyebrow: 'Studio',
    title: 'Customise by purpose',
    body: `Begin with why you wear it. One purpose opens its intentions. ${SHARED_STEPS}`,
    chooseHint: 'Choose a purpose, then pick your intentions.',
    isActive: true,
    sortOrder: 1,
  },
  {
    slug: 'numerology',
    path: '/customize?path=numerology',
    label: 'Customise by numerology',
    short: 'Numerology',
    eyebrow: 'Mulank · Bhagyank',
    title: 'Customise by numerology',
    body: `Mulank and Bhagyank stay as two separate layers. Use one or both. Matching stones stay once in the strand, with both roles kept. ${SHARED_STEPS}`,
    chooseHint: 'Choose a Mulank or Bhagyank number to continue.',
    isActive: true,
    sortOrder: 2,
  },
  {
    slug: 'zodiac',
    path: '/customize?path=zodiac',
    label: 'Customise by zodiac sign',
    short: 'Zodiac',
    eyebrow: 'Rashi',
    title: 'Customise by zodiac sign',
    body: `Twelve signs, each with a recommended four-crystal core. Keep those, or swap in other suitable catalog stones. ${SHARED_STEPS}`,
    chooseHint: 'Choose your zodiac sign to continue.',
    isActive: true,
    sortOrder: 3,
  },
  {
    slug: 'planetary',
    path: '/customize?path=planetary',
    label: 'Customise by planetary',
    short: 'Planetary',
    eyebrow: 'Graha',
    title: 'Customise by planetary',
    body: `Choose a planet. Traditional crystal associations from the atelier catalog become the strand. ${SHARED_STEPS}`,
    chooseHint: 'Choose a planet to continue.',
    isActive: true,
    sortOrder: 4,
  },
  {
    slug: 'profession',
    path: '/customize?path=profession',
    label: 'Customise by profession',
    short: 'Profession',
    eyebrow: 'Work',
    title: 'Customise by profession',
    body: `Choose the work you do. The atelier suggests crystals for that field. ${SHARED_STEPS}`,
    chooseHint: 'Choose the work you do to continue.',
    isActive: true,
    sortOrder: 5,
  },
];

export function resolveStudioModes(config) {
  const rows = config?.studioModes?.length ? config.studioModes : STUDIO_MODES;
  return rows
    .filter((mode) => mode && mode.slug && mode.isActive !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((mode) => {
      const fallback = STUDIO_MODES.find((row) => row.slug === mode.slug) || {};
      return {
        ...fallback,
        ...mode,
        path: `/customize?path=${mode.slug}`,
      };
    });
}

export function studioMode(slug, config) {
  const modes = resolveStudioModes(config);
  return modes.find((mode) => mode.slug === slug) || modes[0] || STUDIO_MODES[0];
}

export function studioPaths(config) {
  const slugs = resolveStudioModes(config).map((mode) => mode.slug);
  return slugs.length ? slugs : STUDIO_MODES.map((mode) => mode.slug);
}
