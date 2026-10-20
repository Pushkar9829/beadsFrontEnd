// Journal post. The source has no post page, so this follows the nearest source pattern, the About page of
// beeds_ecommerce/src/pages/InfoPages.jsx (lines 104-165): dark page, 840px column, eyebrow, section title,
// prose paragraphs, then a card. Styles: styles/atelier/info.css.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import SeoHead from '../components/SeoHead';
import { useBrand, pageTitle } from '../store/settingsStore';
import { postDate } from './BlogListPage';

export default function BlogPostPage() {
  const { slug } = useParams();
  const brand = useBrand();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get(`/blog/${slug}`)
      .then(({ data }) => alive && setPost(data.post))
      .catch(() => alive && setPost(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) return <div className="info-page" />;

  if (!post) {
    return (
      <div className="info-page">
        <div className="container-custom info-narrow">
          <span className="section-eyebrow">Journal</span>
          <h1 className="section-title info-title">Note not found.</h1>
          <div className="info-card">
            <div>
              <h3 className="info-card-title">This note is not published.</h3>
            </div>
            <Link to="/journal" className="btn-gold">
              All notes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const paragraphs = String(post.body || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="info-page">
      <SeoHead
        title={post.seo?.title || pageTitle(post.title, brand)}
        description={post.seo?.description || post.excerpt}
        keywords={post.seo?.keywords}
        image={post.seo?.ogImage || post.image}
        noIndex={post.seo?.noIndex}
      />
      <article className="container-custom info-narrow">
        <span className="section-eyebrow">{[post.author, postDate(post)].filter(Boolean).join(' · ')}</span>
        <h1 className="section-title info-title">{post.title}</h1>
        {post.image && (
          <figure className="info-post-ph">
            <img src={mediaUrl(post.image)} alt="" />
          </figure>
        )}
        <div className="info-prose">
          {post.excerpt && (
            <p>
              <strong>{post.excerpt}</strong>
            </p>
          )}
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div className="info-card">
          <div>
            <h3 className="info-card-title">More from the journal</h3>
          </div>
          <Link to="/journal" className="btn-gold">
            All notes
          </Link>
        </div>
      </article>
    </div>
  );
}
