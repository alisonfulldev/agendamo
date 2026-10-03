import "server-only";

import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { DEMO_DATA_DIR } from "./mode";

/** Demo inbox: every e-mail the system would send is stored in .demo-data/emails.json. */
export interface DemoEmail {
  id: string;
  sentAt: string;
  brandKey: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  attachments: string[];
}

const FILE = path.join(process.cwd(), DEMO_DATA_DIR, "emails.json");
const MAX_EMAILS = 300;

export function listDemoEmails(): DemoEmail[] {
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as DemoEmail[];
  } catch {
    return [];
  }
}

export function saveDemoEmail(email: Omit<DemoEmail, "id" | "sentAt">): DemoEmail {
  const saved = { ...email, id: randomUUID(), sentAt: new Date().toISOString() };
  const emails = [saved, ...listDemoEmails()].slice(0, MAX_EMAILS);
  mkdirSync(path.dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(emails, null, 2));
  return saved;
}

export function clearDemoEmails(): void {
  mkdirSync(path.dirname(FILE), { recursive: true });
  writeFileSync(FILE, "[]");
}
