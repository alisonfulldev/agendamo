import "server-only";

import { getServerEnv, requireServerEnv } from "@/lib/env";

// Vercel REST API (vercel.com/docs/rest-api): project domains and domain configuration.
const API = "https://api.vercel.com";

export function isVercelConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(env.VERCEL_API_TOKEN && env.VERCEL_PROJECT_ID);
}

async function vercel<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
): Promise<{ status: number; data: T }> {
  const env = requireServerEnv("VERCEL_API_TOKEN", "VERCEL_PROJECT_ID");
  const url = new URL(
    `${API}${path.replace(":project", encodeURIComponent(env.VERCEL_PROJECT_ID))}`,
  );
  if (env.VERCEL_TEAM_ID) url.searchParams.set("teamId", env.VERCEL_TEAM_ID);
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${env.VERCEL_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  return { status: response.status, data: (text ? JSON.parse(text) : {}) as T };
}

export interface ProjectDomain {
  name: string;
  verified: boolean;
  verification?: { type: string; domain: string; value: string; reason: string }[];
  error?: { code: string; message: string };
}

export interface DomainConfig {
  misconfigured: boolean;
  configuredBy: string | null;
  recommendedCNAME: { rank: number; value: string }[];
  recommendedIPv4: { rank: number; value: string[] }[];
}

/** POST /v10/projects/{id}/domains */
export function addProjectDomain(domain: string) {
  return vercel<ProjectDomain>("POST", "/v10/projects/:project/domains", { name: domain });
}

/** POST /v9/projects/{id}/domains/{domain}/verify */
export function verifyProjectDomain(domain: string) {
  return vercel<ProjectDomain>(
    "POST",
    `/v9/projects/:project/domains/${encodeURIComponent(domain)}/verify`,
  );
}

/** GET /v6/domains/{domain}/config — misconfigured=false means DNS is right and SSL can be issued. */
export function getDomainConfig(domain: string) {
  return vercel<DomainConfig>("GET", `/v6/domains/${encodeURIComponent(domain)}/config`);
}

/** DELETE /v9/projects/{id}/domains/{domain} */
export function removeProjectDomain(domain: string) {
  return vercel<unknown>("DELETE", `/v9/projects/:project/domains/${encodeURIComponent(domain)}`);
}
