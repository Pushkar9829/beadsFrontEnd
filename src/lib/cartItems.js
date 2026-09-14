export function itemTitle(item) {
  const snap = item.snapshot || {};
  if (item.kind === 'custom_bracelet') {
    return snap.name || `Custom bracelet · ${snap.intention?.name || 'Intention'}`;
  }
  return snap.name || 'Piece';
}

export function itemMeta(item) {
  const snap = item.snapshot || {};
  if (item.kind !== 'custom_bracelet') return '';
  const parts = [];
  if (snap.purpose?.name) parts.push(snap.purpose.name);
  if (snap.intention?.name && snap.intention.name !== snap.purpose?.name) {
    parts.push(snap.intention.name);
  }
  if (snap.charm?.name) parts.push(snap.charm.name);
  if (snap.mulank) parts.push(`Mulank ${snap.mulank}`);
  if (snap.zodiac?.sign) parts.push(snap.zodiac.sign);
  if (snap.finish?.label && snap.finish.label !== 'Gold') parts.push(snap.finish.label);
  if (snap.wristSize) parts.push(snap.wristSize);
  const beads = snap.beads
    ?.map((b) => (b.name ? `${b.name} × ${b.quantity}` : ''))
    .filter(Boolean);
  if (beads?.length) parts.push(beads.join(' · '));
  return parts.join(' · ');
}
