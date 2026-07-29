export type EmailDraft = {
  id: string;
  title: string;
  occasion: string;
  recipient: string;
  tone: string;
  length: string;
  details: string;
  body: string;
  savedAt: number;
};

const KEY = "monocle.email-drafts.v1";

export function newDraftId() {
  return Math.random().toString(36).slice(2, 10);
}

export function loadDrafts(): EmailDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as EmailDraft[]) : [];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.savedAt - a.savedAt) : [];
  } catch {
    return [];
  }
}

export function saveDrafts(drafts: EmailDraft[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(drafts));
  } catch {
    /* ignore */
  }
}
