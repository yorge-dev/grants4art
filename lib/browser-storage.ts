import { GRANT_TAGS } from "@/lib/constants";
import { formatGrantAmount, type PublicGrant } from "@/lib/public-grants";

export const PERSONA_STORAGE_KEY = "grants4art.persona";
export const SAVED_GRANTS_STORAGE_KEY = "grants4art.savedGrants";
export const SAVED_GRANTS_CHANGED_EVENT = "grants4art:saved-grants-changed";

export interface SavedGrant {
  id: string;
  title: string;
  organization: string;
  amountLabel: string | null;
  deadline: string | null;
  location: string;
  applicationUrl: string | null;
  savedAt: string;
}

export type SavedGrantChange =
  | { action: "saved"; title: string }
  | { action: "removed"; title: string }
  | { action: "error"; title: string };

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function canUseDocument(): boolean {
  return typeof document !== "undefined";
}

function readCookie(key: string): string | null {
  if (!canUseDocument()) return null;
  const prefix = `${key}=`;
  const row = document.cookie.split("; ").find((part) => part.startsWith(prefix));
  if (!row) return null;
  try {
    return decodeURIComponent(row.slice(prefix.length));
  } catch {
    return null;
  }
}

function writeCookie(key: string, value: string): boolean {
  if (!canUseDocument()) return false;
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  return readCookie(key) === value;
}

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(key);
    if (stored !== null) return stored;
  } catch {
    // localStorage can throw in private browsing; fall through to cookies.
  }
  return readCookie(key);
}

function writeRaw(key: string, value: string | null): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
    return true;
  } catch {
    if (value === null) {
      if (!canUseDocument()) return false;
      document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
      return true;
    }
    return writeCookie(key, value);
  }
}

function dispatchSavedChange(detail: SavedGrantChange) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<SavedGrantChange>(SAVED_GRANTS_CHANGED_EVENT, { detail }));
}

function isSavedGrant(value: unknown): value is SavedGrant {
  if (!value || typeof value !== "object") return false;
  const grant = value as SavedGrant;
  return typeof grant.id === "string" && typeof grant.title === "string" && typeof grant.organization === "string";
}

export function readPersona(): string {
  const value = readRaw(PERSONA_STORAGE_KEY) ?? "";
  return GRANT_TAGS.some((tag) => tag.slug === value) ? value : "";
}

export function writePersona(slug: string): void {
  const next = GRANT_TAGS.some((tag) => tag.slug === slug) ? slug : "";
  writeRaw(PERSONA_STORAGE_KEY, next || null);
}

export function readSavedGrants(): SavedGrant[] {
  const raw = readRaw(SAVED_GRANTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedGrant);
  } catch {
    return [];
  }
}

export function isGrantSaved(id: string): boolean {
  return readSavedGrants().some((grant) => grant.id === id);
}

function toSavedGrant(grant: PublicGrant): SavedGrant {
  const deadline = grant.deadline ? new Date(grant.deadline) : null;
  return {
    id: grant.id,
    title: grant.title,
    organization: grant.organization,
    amountLabel: formatGrantAmount(grant),
    deadline: deadline && !Number.isNaN(deadline.getTime()) ? deadline.toISOString() : null,
    location: grant.location,
    applicationUrl: grant.applicationUrl ?? null,
    savedAt: new Date().toISOString(),
  };
}

function persistSavedGrants(grants: SavedGrant[]): boolean {
  return writeRaw(SAVED_GRANTS_STORAGE_KEY, JSON.stringify(grants));
}

export function toggleSavedGrant(grant: PublicGrant): SavedGrantChange {
  const current = readSavedGrants();
  const existing = current.find((item) => item.id === grant.id);
  const next = existing
    ? current.filter((item) => item.id !== grant.id)
    : [toSavedGrant(grant), ...current];

  if (!persistSavedGrants(next)) {
    const change: SavedGrantChange = { action: "error", title: grant.title };
    dispatchSavedChange(change);
    return change;
  }

  const change: SavedGrantChange = existing
    ? { action: "removed", title: grant.title }
    : { action: "saved", title: grant.title };
  dispatchSavedChange(change);
  return change;
}

export function removeSavedGrant(id: string): void {
  const current = readSavedGrants();
  const existing = current.find((grant) => grant.id === id);
  if (!existing) return;
  if (!persistSavedGrants(current.filter((grant) => grant.id !== id))) {
    dispatchSavedChange({ action: "error", title: existing.title });
    return;
  }
  dispatchSavedChange({ action: "removed", title: existing.title });
}
