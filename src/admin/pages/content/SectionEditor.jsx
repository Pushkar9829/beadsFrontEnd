import { ExternalLink, RotateCcw, Save, Undo2 } from 'lucide-react';
import { apiGet, apiSend, useApiMutation } from '../../lib/query';
import { Badge, Button, Card, useConfirm } from '../../ui';
import { SchemaFields } from './SchemaFields';
import { buildBody } from './sections';

export const CONTENT_INVALIDATE = ['/admin/content', '/content'];

async function putSection(section, values) {
  // Re-read the live document right before saving so sibling sub-pages under the same top-level
  // key (e.g. pages.shop vs pages.cart) saved by someone else in the meantime are kept.
  const fresh = await apiGet('/admin/content');
  const body = buildBody(fresh?.content || {}, section, values);
  return apiSend('put', '/admin/content', body);
}

/**
 * Right-hand editor for one section. `values` is the section's slice of the content document
 * (owned by the parent so unsaved edits survive switching sections).
 */
export function SectionEditor({ section, values, dirty, onChange, onDiscard, onSaved }) {
  const confirm = useConfirm();
  const save = useApiMutation((v) => putSection(section, section.clean ? section.clean(v) : v), {
    invalidate: CONTENT_INVALIDATE,
    success: `${section.label} saved.`,
    onSuccess: onSaved,
  });
  const reset = useApiMutation(() => putSection(section, null), {
    invalidate: CONTENT_INVALIDATE,
    success: `${section.label} reset to the default text.`,
    onSuccess: onSaved,
  });
  const busy = save.isPending || reset.isPending;

  const onReset = async () => {
    const ok = await confirm({
      title: `Reset “${section.label}” to default?`,
      message: 'The live copy, images and links of this section are replaced with the built-in defaults right away. Other sections are not affected.',
      confirmLabel: 'Reset section',
      tone: 'danger',
    });
    if (ok) reset.mutate();
  };

  const onDiscardClick = async () => {
    if (await confirm({ title: 'Discard changes?', message: `Your unsaved edits to “${section.label}” will be lost.`, confirmLabel: 'Discard', tone: 'danger' })) onDiscard();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (dirty && !busy) save.mutate(values);
      }}
      onKeyDown={(e) => {
        // Enter in a single-line field must not publish the section by accident.
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault();
      }}
      className="min-w-0"
    >
      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-ivory">{section.label}</h2>
              <Badge>{section.group}</Badge>
              {dirty && (
                <Badge tone="warning" dot>
                  Unsaved changes
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-lilac">{section.hint}. Empty fields fall back to the default text.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {section.preview && (
              <a
                href={section.preview}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs text-lilac transition-colors hover:bg-white/[0.06] hover:text-ivory"
              >
                <ExternalLink size={13} /> Preview on site
              </a>
            )}
            <Button size="sm" variant="ghost" icon={RotateCcw} onClick={onReset} disabled={busy} loading={reset.isPending}>
              Reset to default
            </Button>
          </div>
        </div>
        <div className="px-5 py-5">
          <SchemaFields fields={section.fields} values={values} onChange={onChange} base={section.base} />
        </div>
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 rounded-b-2xl border-t border-white/[0.08] bg-surface/95 px-5 py-3 backdrop-blur">
          {dirty ? <span className="mr-auto text-xs text-amber-200">Not published yet — save to update the storefront.</span> : <span className="mr-auto text-xs text-lilac">All changes saved.</span>}
          <Button variant="ghost" icon={Undo2} onClick={onDiscardClick} disabled={!dirty || busy}>
            Discard
          </Button>
          <Button variant="primary" type="submit" icon={Save} loading={save.isPending} disabled={!dirty || reset.isPending}>
            Save section
          </Button>
        </div>
      </Card>
    </form>
  );
}
