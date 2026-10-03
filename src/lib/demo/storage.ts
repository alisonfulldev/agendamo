import "server-only";

import { createHmac } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

import { DEMO_DATA_DIR } from "./mode";

/**
 * Demo stand-in for R2: files live in .demo-data/files and are served by /api/demo/files.
 * Upload URLs are signed like presigned R2 URLs (key, type and size cannot be changed).
 */
const ROOT = path.join(process.cwd(), DEMO_DATA_DIR, "files");
const SECRET = "lively-local-demo-storage";

function filePath(key: string): string {
  const resolved = path.resolve(ROOT, key);
  if (!resolved.startsWith(ROOT + path.sep)) throw new Error("Demo: invalid object key");
  return resolved;
}

export function demoUploadSignature(key: string, contentType: string, length: number): string {
  return createHmac("sha256", SECRET).update(`${key}|${contentType}|${length}`).digest("hex");
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function demoUploadUrl(key: string, contentType: string, length: number): string {
  const url = new URL("/api/demo/upload", appUrl());
  url.searchParams.set("key", key);
  url.searchParams.set("type", contentType);
  url.searchParams.set("len", String(length));
  url.searchParams.set("sig", demoUploadSignature(key, contentType, length));
  return url.toString();
}

export function demoPublicUrl(key: string): string {
  return `${appUrl()}/api/demo/files/${key}`;
}

export function writeDemoObject(key: string, body: Buffer): void {
  const target = filePath(key);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, body);
}

export function readDemoObject(key: string): Buffer | null {
  try {
    return readFileSync(filePath(key));
  } catch {
    return null;
  }
}

export function demoObjectSize(key: string): number | null {
  try {
    return statSync(filePath(key)).size;
  } catch {
    return null;
  }
}

export function deleteDemoObject(key: string): void {
  rmSync(filePath(key), { force: true });
}

export function deleteDemoPrefix(prefix: string): number {
  const target = path.resolve(ROOT, prefix);
  if (!target.startsWith(ROOT + path.sep)) return 0;
  rmSync(target, { recursive: true, force: true });
  return 0;
}
