import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import logo from '../../assets/brand/logo.jpg';
import footerBanner from '../../assets/home/footer-banner.jpg';
import { mediaUrl } from '../../api/client';
import Button from '../ui/Button';
import ContactDrawer from './ContactDrawer';
import { useSite } from '../../store/contentStore';

const linkClass = 'footer-link';

export default function Footer() {
  const [contactOpen, setContactOpen] = useState(false);
  const site = useSite();
  const footer = site.footer;
  const houses = site.houses?.items || [];
  const banner = footer.bannerImage ? mediaUrl(footer.bannerImage) : footerBanner;

  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-invite">
          <div className="footer-invite-media" aria-hidden>
            <img src={banner} alt="" />
          </div>
          <div className="footer-invite-inner relative z-10 flex flex-col gap-6 py-10 sm:py-12 md:flex-row md:items-center md:justify-between md:gap-12 lg:gap-16">
            <div className="min-w-0 max-w-xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-gold">{footer.kicker}</p>
              <h2 className="mt-3 font-serif text-2xl gold-text md:text-3xl">{footer.title}</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-lilac">{footer.copy}</p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" onClick={() => setContactOpen(true)}>
              {footer.cta}
            </Button>
          </div>
        </div>

        <div className="grid gap-10 py-10 sm:grid-cols-2 sm:gap-12 sm:py-14 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3">
              <img src={logo} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-gold/40" />
              <span className="font-serif text-base tracking-[0.14em] gold-text sm:text-lg sm:tracking-[0.22em]">
                {footer.brandName}
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-lilac">{footer.blurb}</p>
            <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-ivory/45">{footer.tagline}</p>
            <div className="mt-6 flex gap-3">
              <a href={footer.email} className="footer-icon" aria-label="Email">
                <Mail size={15} />
              </a>
              <a href={footer.instagram} className="footer-icon" aria-label="Instagram" target="_blank" rel="noreferrer">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">Houses</h3>
            <nav className="mt-5 flex flex-col gap-2.5 text-sm">
              {houses.map((house) => (
                <Link key={house.slug} to={`/${house.slug}`} className={linkClass}>{house.name}</Link>
              ))}
              <Link to="/shop" className={linkClass}>Shop All</Link>
            </nav>
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">Studio</h3>
            <nav className="mt-5 flex flex-col gap-2.5 text-sm">
              <Link to="/customize" className={linkClass}>Customization</Link>
              <Link to="/about" className={linkClass}>About</Link>
              <Link to="/wishlist" className={linkClass}>Wishlist</Link>
              <Link to="/account" className={linkClass}>Account</Link>
              <Link to="/cart" className={linkClass}>Bag</Link>
            </nav>
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">Care</h3>
            <nav className="mt-5 flex flex-col gap-2.5 text-sm">
              <button type="button" className={`${linkClass} text-left`} onClick={() => setContactOpen(true)}>
                Contact us
              </button>
              <Link to="/returns" className={linkClass}>Return & Exchange</Link>
              <Link to="/privacy" className={linkClass}>Privacy Policy</Link>
              <Link to="/terms" className={linkClass}>Terms & Conditions</Link>
            </nav>
            <div className="mt-6 flex items-start gap-2 text-sm text-lilac">
              <MapPin size={14} className="mt-0.5 shrink-0 text-gold" />
              <span>{footer.location}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(198,167,94,0.15)]">
        <div className="shell flex flex-col gap-3 py-5 text-xs text-ivory/40 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {footer.copyright}</p>
          <p>{footer.disclaimer}</p>
        </div>
      </div>
      <ContactDrawer
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </footer>
  );
}
