import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[rgba(198,167,94,0.22)] lotus-corner">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="font-serif text-lg tracking-[0.2em] gold-text">KUBERSTONES</div>
          <p className="mt-3 text-sm text-lilac">Heal. Align. Attract abundance.</p>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-ivory/50">Energy · Abundance · Wellness</p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-gold">Shop</h4>
          <div className="mt-3 flex flex-col gap-2 text-sm text-lilac">
            <Link to="/crystals">Crystals</Link>
            <Link to="/rudraksha">Rudraksha</Link>
            <Link to="/gemstones">Gemstones</Link>
            <Link to="/shop">Shop All</Link>
          </div>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-gold">Atelier</h4>
          <div className="mt-3 flex flex-col gap-2 text-sm text-lilac">
            <Link to="/customize">Shop by Purpose</Link>
            <Link to="/about">About</Link>
            <Link to="/account">Account</Link>
          </div>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-gold">Note</h4>
          <p className="mt-3 text-sm leading-relaxed text-lilac">
            Crystal associations are traditional and spiritual. They are not medical claims.
          </p>
        </div>
      </div>
      <div className="border-t border-[rgba(198,167,94,0.15)] py-4 text-center text-xs text-ivory/40">
        © {new Date().getFullYear()} Kuberstones. All rights reserved.
      </div>
    </footer>
  );
}
