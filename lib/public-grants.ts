import { formatDistanceToNow } from "date-fns";

export type GrantStatusFilter = "all" | "open" | "closed";

export interface PublicGrant {
  id: string;
  title: string;
  organization: string;
  amount?: string | null;
  amountMin?: number | null;
  amountMax?: number | null;
  deadline?: Date | string | null;
  location: string;
  description: string;
  eligibility?: string | null;
  applicationUrl?: string | null;
  category?: string | null;
  tags?: Array<{
    tag: {
      name: string;
      slug: string;
    };
  }>;
}

export interface PublicFilters {
  search: string;
  categories: string[];
  persona: string;
  status: GrantStatusFilter;
}

export const EMPTY_PUBLIC_FILTERS: PublicFilters = {
  search: "",
  categories: [],
  persona: "",
  status: "all",
};

export function formatGrantAmount(grant: {
  amount?: string | null;
  amountMin?: number | null;
  amountMax?: number | null;
}): string | null {
  if (grant.amountMin !== null && grant.amountMin !== undefined && grant.amountMax !== null && grant.amountMax !== undefined) {
    if (grant.amountMin === grant.amountMax) {
      return `$${grant.amountMin.toLocaleString()}`;
    }
    return `$${grant.amountMin.toLocaleString()} - $${grant.amountMax.toLocaleString()}`;
  }
  if (grant.amountMax !== null && grant.amountMax !== undefined) {
    return `Up to $${grant.amountMax.toLocaleString()}`;
  }
  if (grant.amountMin !== null && grant.amountMin !== undefined) {
    return `From $${grant.amountMin.toLocaleString()}`;
  }
  if (grant.amount) {
    return grant.amount;
  }
  return null;
}

export function isGrantClosed(deadline?: Date | string | null, now = new Date()): boolean {
  if (!deadline) return false;
  const date = deadline instanceof Date ? deadline : new Date(deadline);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < now.getTime();
}

export function deadlineLabel(deadline?: Date | string | null, now = new Date()): string {
  if (!deadline) return "No deadline listed";
  const date = deadline instanceof Date ? deadline : new Date(deadline);
  if (Number.isNaN(date.getTime())) return "Deadline unavailable";
  if (date.getTime() < now.getTime()) return "Applications Closed";
  return `Due in ${formatDistanceToNow(date)}`;
}
