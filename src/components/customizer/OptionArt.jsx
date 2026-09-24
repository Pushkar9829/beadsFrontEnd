import { mediaUrl } from '../../api/client';

export default function OptionArt({ option, className = 'studio-charm-thumb' }) {
  if (option?.image) return <img src={mediaUrl(option.image)} alt="" className={className} />;
  if (option?.icon) return <span className="studio-option-icon" aria-hidden>{option.icon}</span>;
  return null;
}

export function ModeArt({ mode, small = false }) {
  const size = small ? 'h-4 w-4 text-sm' : 'h-5 w-5 text-base';
  if (mode?.image) return <img src={mediaUrl(mode.image)} alt="" className={`${size} shrink-0 object-contain`} />;
  if (mode?.icon) return <span className={`${size} grid shrink-0 place-items-center leading-none`} aria-hidden>{mode.icon}</span>;
  return null;
}
