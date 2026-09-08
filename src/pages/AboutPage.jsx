import { useEffect, useState } from 'react';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import logo from '../assets/brand/logo.jpg';

export default function AboutPage() {
  const [content, setContent] = useState(null);
  useEffect(() => {
    api.get('/content').then(({ data }) => setContent(data.content)).catch(() => {});
  }, []);
  const about = content?.about || {};

  return (
    <div className="shell py-16">
      <img src={logo} alt="" className="mx-auto mb-10 h-40 w-40 rounded-full object-cover gold-border" />
      <p className="text-center text-xs uppercase tracking-[0.28em] text-gold">
        {about.tagline || 'Editorial luxury for modern seekers.'}
      </p>
      <h1 className="mt-4 text-center font-serif text-4xl gold-text">{about.headline || 'Jewellery as a quiet ritual'}</h1>
      <div className="mt-8 space-y-4 whitespace-pre-line text-lg leading-relaxed text-lilac">
        {about.body}
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {(content?.trustClaims || []).map((c) => (
          <Card key={c.title} className="p-5">
            <h3 className="font-serif text-lg text-gold">{c.title}</h3>
            <p className="mt-2 text-sm text-lilac">{c.body}</p>
          </Card>
        ))}
      </div>
      <div className="mt-12 text-center">
        <Button to="/customize">Customization</Button>
      </div>
    </div>
  );
}
