import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  if (hex === '0'.repeat(64)) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must not be the default all-zeros value in production');
    }
    console.warn('WARNING: Using all-zeros ENCRYPTION_KEY — not safe for production');
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns: base64(iv + ciphertext + authTag)
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // iv (12) + ciphertext (variable) + tag (16)
  const combined = Buffer.concat([iv, encrypted, tag]);
  return combined.toString('base64');
}

/**
 * Safely decrypt a value. Returns the original string if decryption fails
 * (e.g., plaintext data from before encryption was enabled).
 */
export function safeDecrypt(value: string | null | undefined): string | null {
  if (!value) return value as null;
  try {
    return decrypt(value);
  } catch {
    // Value may not be encrypted (e.g., seeded plaintext data)
    return value;
  }
}

/**
 * Decrypt PII fields on an object containing user data.
 * Decrypts: name, email, phone, studentName, studentEmail, teacherName
 */
export function decryptPII<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of ['name', 'email', 'phone', 'studentName', 'studentEmail', 'teacherName'] as const) {
    if (key in result && typeof result[key] === 'string') {
      (result as any)[key] = safeDecrypt(result[key] as string);
    }
  }
  return result;
}

/**
 * Decrypt PII fields on an array of objects.
 */
export function decryptPIIList<T extends Record<string, unknown>>(list: T[]): T[] {
  return list.map(decryptPII);
}

/**
 * Decrypt ciphertext produced by encrypt().
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const combined = Buffer.from(ciphertext, 'base64');

  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(combined.length - TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
