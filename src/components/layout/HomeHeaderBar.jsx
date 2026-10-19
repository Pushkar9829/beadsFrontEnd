// Header bar: notice strip, house menus, studio and collection dropdowns, wishlist, bag and account.
// Markup and styling follow beeds_ecommerce/src/components/Header.jsx (styles/atelier/header.css).
import { Link, NavLink } from 'react-router-dom';
import { Heart, Menu, ShoppingBag, User, X } from 'lucide-react';
import { useState } from 'react';
import emblem from '../../assets/brand/emblem.png';

function Count({ n }) {
  if (!n) return null;
  return <span className="at-icon-count">{n > 99 ? '99+' : n}</span>;
}

function Dropdown({ open, title, account = false, children, all, onHover }) {
  return (
    <div className={`header-dropdown-menu${account ? ' is-account' : ''}${open ? ' is-open' : ''}`} {...onHover}>
      <div className="at-dd-panel">
        <div className="at-dd-eyebrow">{title}</div>
        {children}
        {all}
      </div>
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
  notice,
  mega,
  openMega,
  closeMega,
  emptyCopy,
  wishCount,
  cartCount,
  user,
  staff,
  onCart,
  onProfile,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hover = (key) => ({ onMouseEnter: () => openMega(key), onMouseLeave: closeMega, onFocus: () => openMega(key), onBlur: closeMega });
  const item = (key) => `at-nav-item${mega === key ? ' is-hover' : ''}`;
  const close = () => openMega(null);
  const notices = (notice || []).filter(Boolean);

  return (
    <>
      {notices.length > 0 && (
        <div className="at-header-notice">
          {notices.map((n, i) => (
            <span key={n} className={i ? 'at-header-notice-rest' : ''}>
              {i > 0 && <span className="at-header-notice-sep">· </span>}
              {n}
            </span>
          ))}
        </div>
      )}

      <div className="container-custom at-header-row">
        <nav className="at-nav at-nav-left" aria-label="Primary">
          <ul className="at-nav-list">
            {families.map((f) => (
              <li key={f.slug} className={item(f.slug)} {...hover(f.slug)}>
                <NavLink to={`/${f.slug}`} className="at-nav-link">
                  <span>{f.name}</span>
                </NavLink>
                <Dropdown
                  open={mega === f.slug}
                  title={f.name}
                  onHover={hover(f.slug)}
                  all={
                    <div className="at-dd-foot">
                      <Link to={`/${f.slug}`} className="at-dd-all" onClick={close}>
                        All {f.name.toLowerCase()} →
                      </Link>
                    </div>
                  }
                >
                  <div className="at-dd-links">
                    {childrenOf(f.slug).length === 0 && <p className="at-dd-empty">{emptyCopy}</p>}
                    {childrenOf(f.slug).map((c) => (
                      <Link key={c._id} to={c.slug === 'customize-your-bracelet' ? '/customize' : `/c/${c.slug}`} className="at-dd-link" onClick={close}>
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </Dropdown>
              </li>
            ))}
            <li className={item('customize')} {...hover('customize')}>
              <NavLink to="/customize" className="at-nav-link">
                <span>{nav.customize}</span>
              </NavLink>
              <Dropdown
                open={mega === 'customize'}
                title={nav.studioMenu}
                onHover={hover('customize')}
                all={
                  <div className="at-dd-foot">
                    <Link to="/customize" className="at-dd-all" onClick={close}>
                      Open the studio →
                    </Link>
                  </div>
                }
              >
                <div className="at-dd-links">
                  {studioModes.map((mode) => (
                    <Link key={mode.slug} to={mode.path} className="at-dd-link" onClick={close}>
                      {mode.label}
                    </Link>
                  ))}
                </div>
              </Dropdown>
            </li>
          </ul>
        </nav>

        <button type="button" className="at-mobile-toggle" aria-label="Toggle navigation menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="at-brand" aria-label={`${brandName} home`}>
          <img src={emblem} alt="" className="at-brand-emblem" />
          <span className="at-brand-word">{brandName}</span>
        </Link>

        <div className="at-header-right">
          <nav className="at-nav at-nav-right" aria-label="Secondary">
            <ul className="at-nav-list">
              <li className={item('collections')} {...hover('collections')}>
                <NavLink to="/collections" className="at-nav-link">
                  <span>{nav.collections}</span>
                </NavLink>
                <Dropdown
                  open={mega === 'collections'}
                  title={nav.collections}
                  onHover={hover('collections')}
                  all={
                    <div className="at-dd-foot">
                      <Link to="/collections" className="at-dd-all" onClick={close}>
                        {nav.allCollections} →
                      </Link>
                    </div>
                  }
                >
                  <div className="at-dd-links">
                    {collections.map((c) => (
                      <Link key={c._id} to={`/collection/${c.slug}`} className="at-dd-link" onClick={close}>
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </Dropdown>
              </li>
              <li className="at-nav-item">
                <NavLink to="/shop" className="at-nav-link">
                  <span>{nav.shopAll}</span>
                </NavLink>
              </li>
              <li className="at-nav-item">
                <NavLink to="/journal" className="at-nav-link">
                  <span>{nav.journal}</span>
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="at-icons">
            {staff && (
              <Link to="/admin" className="at-admin-link">
                Admin
              </Link>
            )}
            <NavLink to="/wishlist" className={({ isActive }) => `at-icon${isActive ? ' is-active' : ''}`} aria-label={`Wishlist, ${wishCount} items`}>
              <Heart size={18} strokeWidth={1.5} fill={wishCount > 0 ? 'rgba(197, 165, 114, 0.25)' : 'none'} />
              <Count n={wishCount} />
            </NavLink>
            <button type="button" className="at-icon" aria-label={`Bag, ${cartCount} items`} onClick={onCart}>
              <ShoppingBag size={18} strokeWidth={1.5} />
              <Count n={cartCount} />
            </button>
            <div className="at-account" {...hover('account')}>
              <button type="button" className={`at-icon${mega === 'account' ? ' is-active' : ''}`} aria-label={user ? 'Your account' : 'Sign in'} onClick={onProfile}>
                <User size={18} strokeWidth={1.5} />
                {user && <span className="at-icon-dot" />}
              </button>
              <Dropdown
                account
                open={mega === 'account'}
                title={user ? 'Member' : 'Account'}
                onHover={hover('account')}
                all={
                  <div className="at-dd-foot">
                    {user ? (
                      <button
                        type="button"
                        className="at-dd-all is-gold"
                        onClick={() => {
                          close();
                          onLogout();
                        }}
                      >
                        Sign out →
                      </button>
                    ) : (
                      <Link to="/register" className="at-dd-all" onClick={close}>
                        Create an account →
                      </Link>
                    )}
                  </div>
                }
              >
                {user && <div className="at-dd-greeting">Namaste, {user.name}</div>}
                <div className="at-dd-links">
                  {user ? (
                    <>
                      <Link to="/account" className="at-dd-link" onClick={close}>
                        My orders
                      </Link>
                      <Link to="/account" className="at-dd-link" onClick={close}>
                        My account
                      </Link>
                      <Link to="/wishlist" className="at-dd-link" onClick={close}>
                        Wishlist
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="at-dd-link" onClick={close}>
                        Sign in
                      </Link>
                      <Link to="/register" className="at-dd-link" onClick={close}>
                        Create account
                      </Link>
                      <Link to="/login" className="at-dd-link is-muted" onClick={close}>
                        Forgot password?
                      </Link>
                    </>
                  )}
                </div>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="at-mobile-drawer" role="dialog" aria-label="Menu" onClick={(e) => e.target.closest('a') && setMenuOpen(false)}>
          <div className="at-mobile-brand">
            <img src={emblem} alt="" />
            <span>{brandName}</span>
          </div>
          <ul className="at-mobile-list">
            {families.map((f) => (
              <li key={f.slug}>
                <NavLink to={`/${f.slug}`} className="at-mobile-link">
                  {f.name}
                </NavLink>
              </li>
            ))}
            <li>
              <NavLink to="/customize" className="at-mobile-link">
                {nav.customize}
              </NavLink>
            </li>
            <li>
              <NavLink to="/collections" className="at-mobile-link">
                {nav.collections}
              </NavLink>
            </li>
            <li>
              <NavLink to="/shop" className="at-mobile-link">
                {nav.shopAll}
              </NavLink>
            </li>
            <li>
              <NavLink to="/journal" className="at-mobile-link">
                {nav.journal}
              </NavLink>
            </li>
            {staff && (
              <li>
                <Link to="/admin" className="at-mobile-link">
                  Admin
                </Link>
              </li>
            )}
          </ul>
          <div className="at-mobile-auth">
            {user ? (
              <Link to="/account" className="btn-gold">
                Namaste, {user.name} · Account
              </Link>
            ) : (
              <div className="at-mobile-auth-duo">
                <Link to="/login" className="btn-gold">
                  Sign In
                </Link>
                <Link to="/register" className="btn-outline">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
