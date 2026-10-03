import "server-only";

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { isDemoMode } from "@/lib/demo/mode";
import {
  deleteDemoObject,
  deleteDemoPrefix,
  demoObjectSize,
  demoPublicUrl,
  demoUploadUrl,
} from "@/lib/demo/storage";
import { getServerEnv, requireServerEnv } from "@/lib/env";

let client: S3Client | undefined;

function r2() {
  const env = requireServerEnv(
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
  );
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  });
  return { client, bucket: env.R2_BUCKET };
}

export function isStorageConfigured(): boolean {
  if (isDemoMode()) return true;
  const env = getServerEnv();
  return Boolean(
    env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET,
  );
}

/** One year: object keys are unique (uuid), so files never change under the same URL. */
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

/**
 * Presigned PUT URL. The browser uploads straight to R2 (rule 7). Content type, length and cache
 * headers are part of the signature, so the client cannot change them.
 */
export async function createUploadUrl(
  key: string,
  contentType: string,
  contentLength: number,
): Promise<string> {
  if (isDemoMode()) return demoUploadUrl(key, contentType, contentLength);
  const { client, bucket } = r2();
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
      CacheControl: IMMUTABLE_CACHE,
    }),
    {
      expiresIn: 120,
      signableHeaders: new Set(["content-type", "content-length", "cache-control"]),
    },
  );
}

/** Size of an uploaded object, or null when it does not exist. */
export async function objectSize(key: string): Promise<number | null> {
  if (isDemoMode()) return demoObjectSize(key);
  const { client, bucket } = r2();
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return head.ContentLength ?? null;
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  if (isDemoMode()) return deleteDemoObject(key);
  if (!isStorageConfigured()) return;
  const { client, bucket } = r2();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** Deletes every object under a prefix (e.g. all images of a business). */
export async function deletePrefix(prefix: string): Promise<number> {
  if (isDemoMode()) return deleteDemoPrefix(prefix);
  if (!isStorageConfigured()) return 0;
  const { client, bucket } = r2();
  let deleted = 0;
  let token: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
    );
    const keys = (page.Contents ?? []).flatMap((object) =>
      object.Key ? [{ Key: object.Key }] : [],
    );
    if (keys.length > 0) {
      await client.send(
        new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys, Quiet: true } }),
      );
      deleted += keys.length;
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return deleted;
}

/** Public URL through the R2 public domain (long cache, no Vercel image optimization). */
export function publicUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (isDemoMode()) return demoPublicUrl(key);
  const base = getServerEnv().R2_PUBLIC_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${key}`;
}

export function businessPrefix(businessId: string): string {
  return `businesses/${businessId}/`;
}
