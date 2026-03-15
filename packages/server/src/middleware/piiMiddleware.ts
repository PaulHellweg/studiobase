import { Prisma } from '@prisma/client';
import { encryptPII, decryptPII } from '../lib/encryption';

const PII_FIELDS = ['email', 'firstName', 'lastName', 'phone'] as const;

function encryptUserProfilePII(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  for (const field of PII_FIELDS) {
    if (typeof result[field] === 'string') {
      result[field] = encryptPII(result[field] as string);
    }
  }
  return result;
}

function decryptUserProfilePII(record: Record<string, unknown>): Record<string, unknown> {
  const result = { ...record };
  for (const field of PII_FIELDS) {
    if (typeof result[field] === 'string') {
      try {
        result[field] = decryptPII(result[field] as string);
      } catch {
        // If decryption fails, leave the value as-is (may be plaintext legacy data)
      }
    }
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function piiMiddleware(params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>): Promise<any> {
  if (params.model !== 'UserProfile') {
    return next(params);
  }

  // Encrypt on write operations
  if (params.action === 'create' || params.action === 'update' || params.action === 'upsert') {
    if (params.args.data) {
      params.args.data = encryptUserProfilePII(params.args.data as Record<string, unknown>);
    }
    // upsert has separate create/update blocks
    if (params.action === 'upsert') {
      if (params.args.create) {
        params.args.create = encryptUserProfilePII(params.args.create as Record<string, unknown>);
      }
      if (params.args.update) {
        params.args.update = encryptUserProfilePII(params.args.update as Record<string, unknown>);
      }
    }
  }

  return next(params).then((result: unknown) => {
    if (!result) return result;

    // Decrypt on read operations
    if (
      params.action === 'findUnique' ||
      params.action === 'findFirst' ||
      params.action === 'create' ||
      params.action === 'update' ||
      params.action === 'upsert'
    ) {
      return decryptUserProfilePII(result as Record<string, unknown>);
    }

    if (params.action === 'findMany') {
      return (result as Record<string, unknown>[]).map(decryptUserProfilePII);
    }

    return result;
  });
}
