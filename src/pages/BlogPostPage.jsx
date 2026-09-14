import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { mediaUrl } from '../api/client';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Spinner from '../components/ui/Spinner';
import SeoHead from '../components/SeoHead';
import { useBrand, pageTitle } from '../store/settingsStore';

export default function BlogPostPage() {
  const { slug } = useParams();
  const brand = useBrand();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/blog/${slug}`).then(({ data }) => setPost(data.post)).catch(() => setPost(null)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Spinner />;
  if (!post) return <div className="shell py-16 text-lilac">This note is not published.</div>;

  return (
    <div className="shell py-10">
      <SeoHead
        title={post.seo?.title || pageTitle(post.title, brand)}
        description={post.seo?.description || post.excerpt}
        keywords={post.seo?.keywords}
        image={post.seo?.ogImage || post.image}
        noIndex={post.seo?.noIndex}
      />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Journal', to: '/journal' }, { label: post.title }]} />
      <article className="mx-auto mt-8 max-w-2xl">
        {post.image && <img src={mediaUrl(post.image)} alt="" className="mb-6 w-full rounded-2xl object-cover" />}
        <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{post.author}</p>
        <h1 className="mt-2 font-serif text-3xl gold-text">{post.title}</h1>
        <div className="mt-6 whitespace-pre-wrap leading-relaxed text-ivory/80">{post.body}</div>
      </article>
    </div>
  );
}
