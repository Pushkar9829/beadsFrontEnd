// "Beads" step for the non-purpose paths: the strand, adjusted until it matches the strand
// length. No date of birth is asked here (numerology takes it on its first step).
import { useCustomizerStore } from '../../../store/customizerStore';
import StrandList from '../StrandList';

// On these paths the core stones come from the chosen sign, planet or profession.
const CORE_LABEL = { zodiac: 'Sign', planetary: 'Planet', profession: 'Profession', numerology: 'Number' };

export default function StudioBeads() {
  const path = useCustomizerStore((s) => s.path);
  const layerItem = useCustomizerStore((s) => s.layerItem);
  const recommended = useCustomizerStore((s) => s.recommended);
  const signName = path === 'zodiac' ? layerItem?.name : '';
  const signRange = path === 'zodiac' ? layerItem?.dates : '';

  return (
    <div>
      {path === 'zodiac' && signName && (
        <div className="sb-box sb-banner">
          <div>
            <div className="sb-ck">Zodiac</div>
            <div className="sb-banner-t">{signName}</div>
            <div className="sb-rv-s">{[signRange, layerItem?.theme].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
      )}
      <StrandList rows={recommended} roleLabels={{ intention: CORE_LABEL[path], 'intention-primary': CORE_LABEL[path] }} />
    </div>
  );
}
