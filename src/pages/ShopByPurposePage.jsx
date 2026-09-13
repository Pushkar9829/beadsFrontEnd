import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SectionHead from '../components/home/SectionHead';
import SeoHead from '../components/SeoHead';
import Spinner from '../components/ui/Spinner';
import { PurposeIcon, purposeHasImage, purposeToneStyle } from '../components/customizer/PurposeGrid';

export default function ShopByPurposePage() {
  const [purposes, setPurposes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/customizer/purposes').then(({ data }) => setPurposes(data.purposes || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative">
      <SeoHead title="Shop by purpose · Kuberstones" description="Begin with why you wear it." />
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-8 sm:py-10 md:py-12">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shop by purpose' }]} />
        <div className="mt-8">
          <SectionHead eyebrow="Studio" title="Shop by purpose" body="Choose the reason first. The studio then places crystals for that intention." />
        </div>
        {loading ? <Spinner /> : (
          <div className="purpose-pick mt-10">
            {purposes.map((p) => (
              <Link key={p._id || p.slug} to={`/customize?purpose=${p.slug}`} className="purpose-pick-card" style={purposeToneStyle(p)}>
                <span className={`purpose-pick-emoji ${purposeHasImage(p) ? 'is-image' : ''}`} aria-hidden>
                  <PurposeIcon purpose={p} />
                </span>
                <span className="purpose-pick-copy">
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                </span>
              </Link>
            ))}
            {!purposes.length && <p className="text-lilac">Purposes will appear here once the studio is configured.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
