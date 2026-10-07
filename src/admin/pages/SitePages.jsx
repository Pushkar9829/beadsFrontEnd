import { useMemo, useState } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiQuery } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Skeleton, useUnsavedWarning } from '../ui';
import { writePath } from './content/SchemaFields';
import { SectionEditor } from './content/SectionEditor';
import { SectionList } from './content/SectionList';
import { SECTIONS, sectionByKey, sectionValues, stable } from './content/sections';

/**
 * Site CMS: every copy block of the storefront (home, pages, studio, legal) stored in the
 * SiteContent document. Each section saves only its own top-level key(s), so this page and the
 * Homepage layout page never overwrite each other.
 */
export default function SitePages() {
  const [state, set] = useUrlState({ section: SECTIONS[0].key, q: '' });
  const content = useApiQuery('/admin/content');
  const [drafts, setDrafts] = useState({}); // sectionKey → edited values (only while editing)

  const section = sectionByKey(state.section) || SECTIONS[0];
  const serverContent = content.data?.content;

  const baselines = useMemo(() => {
    if (!serverContent) return {};
    const out = {};
    for (const s of SECTIONS) out[s.key] = sectionValues(serverContent, s);
    return out;
  }, [serverContent]);

  const dirtyKeys = useMemo(
    () => Object.keys(drafts).filter((k) => baselines[k] && stable(drafts[k]) !== stable(baselines[k])),
    [drafts, baselines]
  );
  useUnsavedWarning(dirtyKeys.length > 0);

  const values = drafts[section.key] ?? baselines[section.key];
  const dropDraft = (key) =>
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  return (
    <>
      <PageHeader
        title="Site pages"
        description="Copy, images and links across the storefront. Each section is saved and published on its own."
        meta={dirtyKeys.length > 0 && <Badge tone="warning">{dirtyKeys.length} unsaved</Badge>}
        actions={
          <Link to="/admin/home-layout" className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold-light">
            <LayoutTemplate size={15} /> Homepage layout
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
        <div className="lg:sticky lg:top-4">
          <SectionList
            sections={SECTIONS}
            active={section.key}
            onSelect={(key) => set({ section: key })}
            dirtyKeys={dirtyKeys}
            q={state.q}
            onSearch={(q) => set({ q })}
          />
        </div>
        {content.isLoading ? (
          <Card className="space-y-4">
            <Skeleton className="h-6 w-48" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </Card>
        ) : content.error ? (
          <Card padded={false}>
            <ErrorState error={content.error} onRetry={content.refetch} />
          </Card>
        ) : !values ? (
          <Card padded={false}>
            <EmptyState title="Choose a section" description="Pick a section on the left to edit its copy." />
          </Card>
        ) : (
          <SectionEditor
            key={section.key}
            section={section}
            values={values}
            dirty={dirtyKeys.includes(section.key)}
            onChange={(path, v) =>
              setDrafts((prev) => {
                const next = { ...prev, [section.key]: writePath(prev[section.key] ?? baselines[section.key], path, v) };
                // Edits undone by hand are not kept as a draft, so a later server change shows through.
                if (stable(next[section.key]) === stable(baselines[section.key])) delete next[section.key];
                return next;
              })
            }
            onDiscard={() => dropDraft(section.key)}
            onSaved={() => dropDraft(section.key)}
          />
        )}
      </div>
    </>
  );
}
