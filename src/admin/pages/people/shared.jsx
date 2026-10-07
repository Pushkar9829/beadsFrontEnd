// Small pieces shared by the people / settings pages (Customers, CustomerDetail, Users, Groups,
// Contacts, Newsletter, Settings). Candidates for promotion into the kit.
import { useState } from 'react';
import { Check, Copy, Dices, Eye, EyeOff } from 'lucide-react';
import { apiSend, useApiMutation } from '../../lib/query';
import { downloadFile } from '../../lib/format';
import { toast } from '../../../lib/adminToast';
import { Badge, IconButton, Input, cx } from '../../ui';

/** Today's date for export file names: customers-2026-10-07.csv */
export const csvName = (base) => `${base}-${new Date().toISOString().slice(0, 10)}.csv`;

/**
 * CSV export through the shared client (auth header, error normalisation).
 *   const exp = useCsvExport('/admin/customers/export', 'customers');
 *   exp.mutate({ q, group })
 */
export function useCsvExport(url, base) {
  return useApiMutation(
    async (params) => {
      const clean = Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'all'));
      const blob = await apiSend('get', url, undefined, { params: clean, responseType: 'blob' });
      downloadFile(blob, csvName(base));
      return true;
    },
    { success: 'Export downloaded.' }
  );
}

/** Strong random password (no ambiguous characters). */
export function generatePassword(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*?-_';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export async function copyText(text, label = 'Copied to clipboard.') {
  try {
    await navigator.clipboard.writeText(text);
    toast(label);
  } catch {
    toast('Could not copy. Select the text and copy it manually.', 'error');
  }
}

/** Password input with show/hide, generate and copy buttons. */
export function PasswordInput({ id, value, onChange, invalid, placeholder = 'At least 12 characters' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-1.5">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete="new-password"
        value={value}
        invalid={invalid}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono"
      />
      <IconButton icon={show ? EyeOff : Eye} label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)} />
      <IconButton
        icon={Dices}
        label="Generate a strong password"
        onClick={() => {
          onChange(generatePassword());
          setShow(true);
        }}
      />
      <IconButton icon={Copy} label="Copy password" disabled={!value} onClick={() => copyText(value, 'Password copied.')} />
    </div>
  );
}

export const MIN_PASSWORD = 12;

export function passwordError(pw) {
  if (!pw) return 'Password is required.';
  if (pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (pw.length > 128) return 'Use at most 128 characters.';
  return null;
}

/** Customer-group chip; accepts a populated group or a bare id + lookup map. */
export function GroupChip({ group }) {
  if (!group) return null;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-ivory ring-1 ring-inset ring-white/10">
      <span className="h-2 w-2 rounded-full" style={{ background: group.color || '#C6A75E' }} />
      {group.name || 'Group'}
    </span>
  );
}

/** Resolve groupIds (ids or populated docs) against a lookup map from /admin/groups. */
export function resolveGroups(groupIds, byId) {
  return (groupIds || [])
    .map((g) => (g && typeof g === 'object' ? { ...byId?.get(String(g._id)), ...g } : byId?.get(String(g))))
    .filter(Boolean);
}

export function GroupChips({ groups, max = 3 }) {
  if (!groups?.length) return <span className="text-lilac/60">—</span>;
  const shown = groups.slice(0, max);
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((g) => (
        <GroupChip key={g._id || g.name} group={g} />
      ))}
      {groups.length > max && <Badge>+{groups.length - max}</Badge>}
    </div>
  );
}

export const SEGMENT_META = {
  new: { label: 'New', tone: 'info' },
  repeat: { label: 'Repeat', tone: 'accent' },
  vip: { label: 'VIP', tone: 'gold' },
  inactive: { label: 'Inactive', tone: 'neutral' },
};

/** Monospace value with a copy button (webhook URLs, ids). */
export function CopyField({ value, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-raised px-3 py-2">
      <code className={cx('min-w-0 flex-1 break-all text-xs', value ? 'text-ivory/90' : 'text-lilac/60')}>{value || 'Not available'}</code>
      <IconButton
        icon={copied ? Check : Copy}
        size="sm"
        label={label}
        disabled={!value}
        onClick={async () => {
          await copyText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      />
    </div>
  );
}
