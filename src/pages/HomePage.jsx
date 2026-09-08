import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/brand/logo.jpg';
import api from '../api/client';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import GemVisual from '../components/ui/GemVisual';
import Price from '../components/ui/Price';
import { FAMILIES } from '../lib/format';

export default function HomePage() {
  const [content, setContent] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [tree, setTree] = useState([]);
  const [purposes, setPurposes] = useState([]);

  useEffect(() => {
    api.get('/content').then(({ data }) => setContent(data.content)).catch(() => {});
    api.get('/products?featured=true').then(({ data }) => setFeatured(data.products || [])).catch(() => {});
    api.get('/categories').then(({ data }) => setTree(data.tree || [])).catch(() => {});
    api.get('/customizer/purposes').then(({ data }) => setPurposes(data.purposes || [])).catch(() => {});
  }, []);

  const hero = content?.hero || {};
  const claims = content?.trustClaims || [];
  const crystalKids = tree.find((t) => t.slug === 'crystals')?.children || [];

  return (
    <div>
      <section className="relative overflow-hidden lotus-corner">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">
              {hero.eyebrow || 'Energy · Abundance · Wellness'}
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight gold-text md:text-6xl">
              {hero.title || 'Heal. Align. Attract abundance.'}
            </h1>
            <p className="mt-5 max-w-lg text-lg text-lilac">
              {hero.subtitle ||
                'Build a personal bracelet from purpose and intention — every crystal chosen with a reason.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/customize">Shop by Purpose</Button>
              <Button to="/shop" variant="ghost">Shop All</Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-6 rounded-full bg-amethyst/20 blur-3xl" />
            <img
              src={logo}
              alt="Kuberstones emblem"
              className="relative mx-auto w-full max-w-md rounded-[2rem] object-cover gold-border"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="font-serif text-2xl gold-text">Three houses</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {FAMILIES.map((f) => (
            <Link key={f.slug} to={`/${f.slug}`}>
              <Card className="h-full p-6 transition hover:bg-raised">
                <h3 className="font-serif text-2xl">{f.name}</h3>
                <p className="mt-2 text-sm text-lilac">{f.blurb}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {purposes.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gold">Custom bracelet</p>
              <h2 className="mt-2 font-serif text-2xl gold-text">Shop by purpose</h2>
              <p className="mt-2 max-w-xl text-sm text-lilac">
                Choose a purpose, then an intention. Crystals are selected for you, calibrated from your Mulank, and finished with zodiac beads and a name.
              </p>
            </div>
            <Button to="/customize" variant="text">Customize</Button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {purposes.map((p) => (
              <Link key={p._id} to={`/customize?purpose=${p.slug}`}>
                <Card className="h-full p-5 transition hover:bg-raised">
                  <h3 className="font-serif text-xl">{p.name}</h3>
                  <p className="mt-2 text-sm text-lilac">{p.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-widest text-gold">Select intention →</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {crystalKids.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-end justify-between">
            <h2 className="font-serif text-2xl gold-text">Crystal collections</h2>
            <Button to="/crystals" variant="text">View all</Button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {crystalKids.map((c) => (
              <Link key={c._id} to={c.slug === 'customize-your-bracelet' ? '/customize' : `/c/${c.slug}`}>
                <Card className="p-5">
                  <h3 className="font-serif text-xl">{c.name}</h3>
                  <p className="mt-2 text-sm text-lilac">{c.description}</p>
                  {c.slug === 'customize-your-bracelet' && (
                    <p className="mt-3 text-xs uppercase tracking-widest text-gold">Primary studio</p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="font-serif text-2xl gold-text">Featured pieces</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <Link key={p._id} to={`/p/${p.slug}`}>
              <Card className="overflow-hidden">
                <GemVisual color={p.colorHex} image={p.images?.[0]} name={p.name} className="h-48 w-full" />
                <div className="p-4">
                  <h3 className="font-serif text-xl">{p.name}</h3>
                  <p className="text-sm text-lilac">{p.shortDescription}</p>
                  <p className="mt-2 text-gold"><Price value={p.price} /></p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="font-serif text-2xl gold-text">Why Kuberstones</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {claims.map((c) => (
            <Card key={c.title} className="p-5">
              <h3 className="font-serif text-lg text-gold">{c.title}</h3>
              <p className="mt-2 text-sm text-lilac">{c.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="font-serif text-3xl gold-text">Begin with intention</h2>
        <p className="mx-auto mt-3 max-w-xl text-lilac">
          The strongest gesture on this site is the same in the header, the hero, and every collection: customize.
        </p>
        <Button to="/customize" className="mt-6">Shop by Purpose</Button>
      </section>
    </div>
  );
}
