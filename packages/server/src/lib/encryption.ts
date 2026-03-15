import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.PII_ENCRYPTION_KEY || 'dev-key-change-in-production';

export function encryptPII(value: string): string {
  return CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
}

export function decryptPII(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
