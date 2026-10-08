// Header bar: house menus, studio and collection mega menus, wishlist, bag and account.
import { Link, NavLink } from 'react-router-dom';
import { Heart, Menu, ShoppingBag, User, X } from 'lucide-react';
import { useState } from 'react';
import { ModeArt } from '../customizer/OptionArt';
import BrandMark from './BrandMark';

function Count({ n }) {
  if (!n) return null;
  return <span className="nxh-count">{n > 99 ? '99+' : n}</span>;
}

function Mega({ open, children, wide = false }) {
  if (!open) return null;
  return (
    <div className={`nxh-mega${wide ? ' is-wide' : ''}`}>
      <div className="nxh-mega-in">{children}</div>
    </div>
  );
}

export default function HomeHeaderBar({
  brandName,
  families,
  childrenOf,
  studioModes,
  collections,
  nav,
  mega,
  openMega,
  closeMega,
  emptyCopy,
  wishCount,
  cartCount,
  user,
  staff,
  accountOpen,
  onCart,
  onProfile,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hover = (key) => ({ onMouseEnter: () => openMega(key), onMouseLeave: closeMega, onFocus: () => openMega(key), onBlur: closeMega });

  return (
    <>
      <div className="nxh-row">
        <button type="button" className="nxh-icon nxh-burger" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
          <Menu size={20} strokeWidth={1.4} />
        </button>

        <nav className="nxh-nav" aria-label="Primary">
          {families.map((f) => (
            <div key={f.slug} className="nxh-item" {...hover(f.slug)}>
              <NavLink to={`/${f.slug}`} className="nxh-link">
                {f.name}
              </NavLink>
              <Mega open={mega === f.slug}>
                <p className="nxh-mega-h">{f.name}</p>
                {childrenOf(f.slug).length === 0 && <p className="nxh-mega-empty">{emptyCopy}</p>}
                {childrenOf(f.slug).map((c) => (
                  <Link key={c._id} to={c.slug === 'customize-your-bracelet' ? '/customize' : `/c/${c.slug}`} className="nxh-mega-link">
                    {c.name}
                  </Link>
                ))}
                <Link to={`/${f.slug}`} className="nxh-mega-all">
                  All {f.name.toLowerCase()} →
                </Link>
              </Mega>
            </div>
          ))}
          <div className="nxh-item" {...hover('customize')}>
            <NavLink to="/customize" className="nxh-link">
              {nav.customize}
            </NavLink>
            <Mega open={mega === 'customize'} wide>
              <p className="nxh-mega-h">Begin a strand</p>
              <div className="nxh-mega-grid">
                {studioModes.map((mode) => (
                  <Link key={mode.slug} to={mode.path} className="nxh-mega-link nxh-mode">
                    <ModeArt mode={mode} />
                    {mode.label}
                  </Link>
                ))}
              </div>
            </Mega>
          </div>
        </nav>

        <Link to="/" className="nxh-mark" aria-label={`${brandName} home`}>
          <BrandMark name={brandName} />
        </Link>

        <div className="nxh-right">
          <nav className="nxh-nav" aria-label="Secondary">
            <div className="nxh-item" {...hover('collections')}>
              <NavLink to="/collections" className="nxh-link">
                {nav.collections}
              </NavLink>
              <Mega open={mega === 'collections'}>
                <p className="nxh-mega-h">{nav.collections}</p>
                {collections.map((c) => (
                  <Link key={c._id} to={`/collection/${c.slug}`} className="nxh-mega-link">
                    {c.name}
                  </Link>
                ))}
                <Link to="/collections" className="nxh-mega-all">
                  All collections →
                </Link>
              </Mega>
            </div>
            <NavLink to="/shop" className="nxh-link">
              {nav.shopAll}
            </NavLink>
            <NavLink to="/journal" className="nxh-link">
              Journal
            </NavLink>
          </nav>
          <div className="nxh-icons">
            {staff && (
              <Link to="/admin" className="nxh-admin">
                Admin
              </Link>
            )}
            <Link to="/wishlist" className="nxh-icon" aria-label={`Wishlist, ${wishCount} items`}>
              <Heart size={18} strokeWidth={1.4} />
              <Count n={wishCount} />
            </Link>
            <button type="button" className="nxh-icon" aria-label={`Bag, ${cartCount} items`} onClick={onCart}>
              <ShoppingBag size={18} strokeWidth={1.4} />
              <Count n={cartCount} />
            </button>
            <button type="button" className={`nxh-icon${accountOpen ? ' is-open' : ''}`} aria-label={user ? 'Open account' : 'Sign in'} aria-expanded={accountOpen} onClick={onProfile}>
              <User size={18} strokeWidth={1.4} />
              {user && <span className="nxh-dot" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="nxh-sheet" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="nxh-sheet-top">
            <span className="nxh-mark">
              <BrandMark name={brandName} />
            </span>
            <button type="button" className="nxh-icon" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
              <X size={20} strokeWidth={1.4} />
            </button>
          </div>
          <nav className="nxh-sheet-nav" onClick={() => setMenuOpen(false)}>
            {families.map((f) => (
              <Link key={f.slug} to={`/${f.slug}`}>
                {f.name}
              </Link>
            ))}
            <Link to="/customize">{nav.customize}</Link>
            <Link to="/collections">{nav.collections}</Link>
            <Link to="/shop">{nav.shopAll}</Link>
            <Link to="/journal">Journal</Link>
            {staff && <Link to="/admin">Admin</Link>}
          </nav>
          <div className="nxh-sheet-modes">
            {studioModes.slice(0, 6).map((mode) => (
              <Link key={mode.slug} to={mode.path} onClick={() => setMenuOpen(false)}>
                <ModeArt mode={mode} small /> {mode.short || mode.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
