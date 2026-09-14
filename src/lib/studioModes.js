export const STUDIO_MODES = [
  {
    slug: 'purpose',
    path: '/customize/purpose',
    label: 'Customise by purpose',
    short: 'Purpose',
    eyebrow: 'Studio',
    title: 'Customise by purpose',
    body: 'Begin with why you wear it. One purpose opens its intentions, then the atelier places crystals.',
  },
  {
    slug: 'numerology',
    path: '/customize/numerology',
    label: 'Customise by numerology',
    short: 'Numerology',
    eyebrow: 'Mulank · Bhagyank',
    title: 'Customise by numerology',
    body: 'Choose a number, or enter a date of birth. Mulank and Bhagyank stay as two layers. Pick 3 or 4 crystals from each, then continue in the studio.',
  },
  {
    slug: 'zodiac',
    path: '/customize/zodiac',
    label: 'Customise by zodiac sign',
    short: 'Zodiac',
    eyebrow: 'Rashi',
    title: 'Customise by zodiac sign',
    body: 'Twelve signs, each with a recommended four-crystal core from the Kuberstones catalog. Pick a sign, keep 3 or 4 stones, then continue to charm and review.',
  },
  {
    slug: 'planetary',
    path: '/customize/planetary',
    label: 'Customise by planetary',
    short: 'Planetary',
    eyebrow: 'Graha',
    title: 'Customise by planetary',
    body: 'Choose a planet. Traditional crystal associations from the atelier catalog become the strand, then you finish it in the studio.',
  },
  {
    slug: 'profession',
    path: '/customize/profession',
    label: 'Customise by profession',
    short: 'Profession',
    eyebrow: 'Work',
    title: 'Customise by profession',
    body: 'Choose the work you do. The atelier suggests crystals for that field, then you set charm, thread and review.',
  },
];

export function studioMode(slug) {
  return STUDIO_MODES.find((mode) => mode.slug === slug) || STUDIO_MODES[0];
}
