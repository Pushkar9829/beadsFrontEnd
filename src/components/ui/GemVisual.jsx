export default function GemVisual({ color = '#6B3FA0', name = '', className = '', image }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`bg-black object-cover ${className}`}
      />
    );
  }
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 35% 30%, #fff8 0%, transparent 28%),
            radial-gradient(circle at 70% 70%, ${color} 0%, #000 75%)`,
        }}
      />
      <div
        className="absolute inset-[12%] rounded-full opacity-80"
        style={{
          background: `radial-gradient(circle at 30% 25%, #ffffff55, ${color} 45%, #00000088 80%)`,
          boxShadow: `inset 0 0 24px ${color}, 0 0 18px ${color}55`,
        }}
      />
    </div>
  );
}
