import GemVisual from '../ui/GemVisual';

export default function StrandReorder({ layout = [], hint }) {
  if (!layout.length) return null;

  return (
    <div>
      <p className="studio-birth-note">
        {hint || 'Fixed repeating pattern. The 3D view uses this sequence for every combination.'}
      </p>
      <div className="studio-birth-strand-wrap">
        <div className="studio-birth-strand">
          {layout.map((slot, index) => (
            <div
              key={`${slot.beadId || slot._id || slot.name}-${index}`}
              className="studio-birth-bead"
              title={`${slot.position}. ${slot.name}`}
            >
              <GemVisual
                color={slot.colorHex}
                image={slot.image}
                name={slot.name}
                className="studio-birth-gem"
              />
              <span>{slot.position}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
