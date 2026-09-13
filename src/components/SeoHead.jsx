import { useEffect } from 'react';
import { mediaUrl } from '../api/client';

export default function SeoHead({ title, description, keywords, image, noIndex }) {
  useEffect(() => {
    if (title) document.title = title;
    const setMeta = (name, content, attr = 'name') => {
      if (!content && content !== '') return;
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    if (description) setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    const ogImage = image ? mediaUrl(image) : '';
    if (ogImage) {
      setMeta('og:image', ogImage, 'property');
      if (ogImage.startsWith('http')) setMeta('og:image:secure_url', ogImage, 'property');
    }
    if (title) setMeta('og:title', title, 'property');
    if (description) setMeta('og:description', description, 'property');
    setMeta('robots', noIndex ? 'noindex,nofollow' : 'index,follow');
  }, [title, description, keywords, image, noIndex]);
  return null;
}
