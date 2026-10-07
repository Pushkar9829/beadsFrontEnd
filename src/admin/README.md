# Kuberstones admin — how pages are built

Everything admin lives in `src/admin/` (the old `src/pages/admin` and `src/components/admin` were removed).

## Rules
1. **Data only through `lib/query.js`.** `useApiQuery(url, params)` / `useApiList(url, params, { key })` for reads,
   `useApiMutation(fn, { invalidate: [urlPrefixes], success })` for writes. Never call axios directly in a
   page and never keep server data in `useState` copies. Always pass every URL prefix the write affects to
   `invalidate` (e.g. saving an order → `['/orders/admin', '/admin/dashboard', '/admin/returns']`) — this is
   what keeps every screen consistent.
2. **URLs are relative to `/api`** (e.g. `/admin/coupons`, `/orders/admin/all`, `/products/admin/all`).
   Contract: `docs/admin-api-contract.md` + changes in `docs/admin-api-v2.md` (v2 wins).
3. **Lists**: filters/search/page live in the URL via `useUrlState({...defaults})`. Server-paginated endpoints
   use `<Pagination>`; small unpaginated endpoints may be filtered/sorted client-side (`sortRows`).
4. **Forms**: `useForm(initial)`; send with `toPayload(values, { nullable: [...optional fields], numbers: [...] })`
   so cleared optional fields become `null` (otherwise the old value is kept). Dates: `toLocalInput()` for
   `<input type="datetime-local">` and `fromLocalInput()` before sending (prevents the IST shift bug).
   Pass `dirty={form.dirty}` to `Drawer`/`Modal` so closing asks before discarding. Disable submit while
   `mutation.isPending` (prevents double submits). Show server field errors via `onError: (info) => form.setServerErrors(info.fields)`.
5. **Destructive or money/stock actions** always go through `const confirm = useConfirm(); if (await confirm({...}))`.
   Use `tone: 'danger'` for deletes; `typeToConfirm` for irreversible bulk actions.
6. **Roles**: `usePermissions()` → `isAdmin`, `canManageSettings`, `canManageRoles`. Hide or disable what the API refuses.
7. **States**: every list/detail handles loading (`DataTable loading`, `Skeleton`), empty (`EmptyState` with a helpful
   action), and error (`ErrorState` / `DataTable error onRetry`). No blank screens.
8. **Status logic** comes from `lib/status.js` (order + return transitions, labels, badge tones). Only offer
   transitions listed there. 409/400 errors are shown by the mutation toast and the data is refetched.
9. **Look & feel**: use the kit only (`ui/index.js`). Page = `<PageHeader>` + optional `<Tabs>`/`<Toolbar>` +
   `<DataTable>` or `<Card>`s. Detail/edit of small records → `<Drawer>`; large records → dedicated route
   (e.g. `/admin/products/:id`). Money via `money()`, dates via `date()/dateTime()/relative()` from `lib/format.js`.
   Copy is short, plain, sentence case. Mobile: everything must work at 375px wide.
10. **Storefront refresh**: `api/client.js` already calls `publishStorefront()` after admin writes — nothing to do.

## Kit cheat sheet (`import { … } from '../ui'`)
- primitives: `Button(variant primary|secondary|ghost|danger|link, size sm|md|lg, icon, loading)`, `IconButton(icon,label)`,
  `Badge(tone neutral|info|success|warning|danger|accent|gold, dot)`, `StatusBadge(meta,value)`, `Card`, `CardHeader(title,description,actions)`,
  `Skeleton`, `EmptyState(icon,title,description,action)`, `ErrorState(error,onRetry)`, `Avatar`, `Thumb(src,size,color)`, `Spinner`, `Kbd`, `Divider`, `cx`
- form: `Field(label,hint,error,required, children | ({id}) => control)`, `Input(prefix,suffix)`, `Textarea`, `Select(options,placeholder)`,
  `NumberInput(value,onChange(number|''))`, `MoneyInput`, `Switch(checked,onChange,label,description)`, `Checkbox`, `TagInput(value[],onChange)`,
  `FormSection(title,description)`, `FormGrid(cols)`, `useForm`, `useUnsavedWarning(dirty)`, `getPath/setPath`
- overlay: `Modal(open,onClose,title,footer,size,dirty)`, `Drawer(open,onClose,title,footer,width sm|md|lg|xl,dirty)`, `useConfirm()`, `Menu(items)`
- table: `DataTable(columns,rows,loading,fetching,error,onRetry,empty,onRowClick,sort,onSort,selection,footer,dense)`, `Pagination(pagination,onPage)`,
  `SearchInput(value,onChange)` (debounced), `FilterSelect(value,onChange,options,label)`, `Toolbar(children,right)`, `Segmented(items,value,onChange)`,
  `BulkBar(count,onClear)`, `sortRows(rows,sort,accessors)`, `nextSort(sort,key)`
- page: `PageHeader(title,description,actions,back:{to,label},meta)`, `Tabs(items,value,onChange)`, `Stat(label,value,hint,icon,delta,loading,to,tone)`,
  `DescriptionList(items)`, `Timeline(items,render)`
- media: `MediaInput(value,onChange,folder,allowVideo,aspect)`, `GalleryInput(value[],onChange,folder)`, `MediaLibraryModal`
- pickers (`import … from '../ui/pickers'`): `ProductPicker(value ids[], onChange)`, `ProductPickerModal`, `CategorySelect(value,onChange)`
- lib: `money, number, date, dateTime, relative, toLocalInput, fromLocalInput, plural, downloadFile` (format.js);
  `usePermissions` (permissions.js); `ORDER_*`, `RETURN_*`, `PAYMENT_*`, `nextOrderStatuses`, `statusMeta` (status.js);
  `useUrlState` (urlState.js); `apiGet, apiSend, useApiQuery, useApiList, useApiMutation, toPayload, errorInfo, useQueryClient` (query.js)

Reference implementation: `pages/Attributes.jsx`.
