import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api, { mediaUrl } from '../api/client';
import SeoHead from '../components/SeoHead';
import { useBrand, pageTitle } from '../store/settingsStore';
import { EmptyBlock, PageIntro, StudioBand } from '../components/home/nocturne/Listing';
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

  const crumbs = [{ label: 'Home', to: '/' }, { label: 'Journal', to: '/journal' }, { label: post?.title || 'Note' }];

  if (loading) {
    return (
      <div className="nx nx-page">
        <div className="nx-w nx-article">
          <div className="nx-skel nx-post-skel" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="nx nx-page">
        <PageIntro crumbs={crumbs} eyebrow="Journal" title="Note not found." />
        <div className="nx-w nx-sec">
          <EmptyBlock title="This note is not published." actions={<Link to="/journal" className="nx-btn">All notes</Link>} />
        </div>
      </div>
    );
  }

  const paragraphs = String(post.body || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="nx nx-page">
      <SeoHead
        title={post.seo?.title || pageTitle(post.title, brand)}
        description={post.seo?.description || post.excerpt}
        keywords={post.seo?.keywords}
        image={post.seo?.ogImage || post.image}
        noIndex={post.seo?.noIndex}
      />
      <PageIntro crumbs={crumbs} eyebrow={[post.author, postDate(post)].filter(Boolean).join(' · ')} title={post.title} body={post.excerpt} narrow />
      <article className="nx-w nx-article">
        {post.image && (
          <figure className="nx-article-ph">
            <img src={mediaUrl(post.image)} alt="" />
          </figure>
        )}
        <div className="nx-prose">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <Link to="/journal" className="nx-lnk nx-article-back">
          <ArrowLeft size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> All notes
        </Link>
      </article>
      <StudioBand />
    </div>
  );
}
