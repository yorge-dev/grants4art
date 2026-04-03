/** Column identifiers for the admin grants table (includes Actions). */
export const GRANT_TABLE_COLUMN_IDS = [
  'actions',
  'title',
  'organization',
  'location',
  'amountMin',
  'amountMax',
  'deadline',
  'applicationUrl',
  'category',
  'tags',
  'createdAt',
] as const;

export type GrantTableColumnId = (typeof GRANT_TABLE_COLUMN_IDS)[number];

export const DEFAULT_GRANT_COLUMN_ORDER: GrantTableColumnId[] = [...GRANT_TABLE_COLUMN_IDS];

const GRANT_ID_SET = new Set<string>(GRANT_TABLE_COLUMN_IDS);

export function normalizeGrantColumnOrder(saved: unknown): GrantTableColumnId[] {
  const defaults = [...DEFAULT_GRANT_COLUMN_ORDER];
  if (!Array.isArray(saved)) return defaults;
  const seen = new Set<string>();
  const result: GrantTableColumnId[] = [];
  for (const k of saved) {
    if (typeof k === 'string' && GRANT_ID_SET.has(k) && !seen.has(k)) {
      result.push(k as GrantTableColumnId);
      seen.add(k);
    }
  }
  for (const k of defaults) {
    if (!seen.has(k)) result.push(k);
  }
  return result;
}

/** Column identifiers for the grant sources / scrape jobs table. */
export const SOURCES_TABLE_COLUMN_IDS = ['status', 'source', 'lastScraped', 'actions'] as const;

export type SourcesTableColumnId = (typeof SOURCES_TABLE_COLUMN_IDS)[number];

export const DEFAULT_SOURCES_COLUMN_ORDER: SourcesTableColumnId[] = [...SOURCES_TABLE_COLUMN_IDS];

const SOURCES_ID_SET = new Set<string>(SOURCES_TABLE_COLUMN_IDS);

export function normalizeSourcesColumnOrder(saved: unknown): SourcesTableColumnId[] {
  const defaults = [...DEFAULT_SOURCES_COLUMN_ORDER];
  if (!Array.isArray(saved)) return defaults;
  const seen = new Set<string>();
  const result: SourcesTableColumnId[] = [];
  for (const k of saved) {
    if (typeof k === 'string' && SOURCES_ID_SET.has(k) && !seen.has(k)) {
      result.push(k as SourcesTableColumnId);
      seen.add(k);
    }
  }
  for (const k of defaults) {
    if (!seen.has(k)) result.push(k);
  }
  return result;
}

/** Move dragId to the position of dropId (insert before drop's previous position after removal). */
export function reorderColumnIds(order: readonly string[], dragId: string, dropId: string): string[] {
  if (dragId === dropId) return [...order];
  const next = [...order];
  const fromIdx = next.indexOf(dragId);
  const toIdx = next.indexOf(dropId);
  if (fromIdx === -1 || toIdx === -1) return [...order];
  const [item] = next.splice(fromIdx, 1);
  const adjustedTo = fromIdx < toIdx ? toIdx - 1 : toIdx;
  next.splice(adjustedTo, 0, item);
  return next;
}

export const ADMIN_GRANT_TABLE_COLUMN_ORDER_KEY = 'adminGrantTableColumnOrder';
export const ADMIN_SOURCES_TABLE_COLUMN_ORDER_KEY = 'adminSourcesTableColumnOrder';

export const ADMIN_TABLE_COLUMN_MIME = 'application/x-grants4art-admin-table-column';
