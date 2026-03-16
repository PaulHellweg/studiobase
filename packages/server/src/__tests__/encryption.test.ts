import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt } from '../middleware/encryption.js';

// Set a test encryption key (32 bytes = 64 hex chars)
beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'a'.repeat(64);
});

describe('PII Encryption (AES-256-GCM)', () => {
  it('encrypts and decrypts a string correctly', () => {
    const plaintext = 'Jane Doe';
    const ciphertext = encrypt(plaintext);

    expect(ciphertext).not.toBe(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it('produces different ciphertext for the same input (random IV)', () => {
    const plaintext = 'test@example.com';
    const ct1 = encrypt(plaintext);
    const ct2 = encrypt(plaintext);

    expect(ct1).not.toBe(ct2); // Random IV means different ciphertext each time
    expect(decrypt(ct1)).toBe(plaintext);
    expect(decrypt(ct2)).toBe(plaintext);
  });

  it('handles empty string', () => {
    const plaintext = '';
    const ciphertext = encrypt(plaintext);
    expect(decrypt(ciphertext)).toBe('');
  });

  it('handles unicode characters', () => {
    const plaintext = 'Müller Straße 123';
    const ciphertext = encrypt(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it('throws on tampered ciphertext', () => {
    const ciphertext = encrypt('test');
    // Tamper with the ciphertext
    const tampered = ciphertext.slice(0, -2) + 'XX';
    expect(() => decrypt(tampered)).toThrow();
  });

  it('throws when ENCRYPTION_KEY is missing', () => {
    const originalKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY');
    process.env.ENCRYPTION_KEY = originalKey;
  });

  it('throws when ENCRYPTION_KEY is wrong length', () => {
    const originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = 'tooshort';
    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY');
    process.env.ENCRYPTION_KEY = originalKey;
  });
});
