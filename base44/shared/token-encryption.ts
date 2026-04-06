/**
 * Token encryption utilities for storing OAuth tokens at rest.
 * Uses AES-GCM with a server-side encryption key from environment variables.
 */

const ENCRYPTION_KEY_ENV = 'TOKEN_ENCRYPTION_KEY';
const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits for AES-GCM
const TAG_LENGTH = 128; // bits

async function getEncryptionKey(): Promise<CryptoKey> {
  const keyHex = Deno.env.get(ENCRYPTION_KEY_ENV);
  if (!keyHex) {
    throw new Error(
      `Environment variable ${ENCRYPTION_KEY_ENV} is not set. ` +
      'Generate one with: openssl rand -hex 32'
    );
  }

  const keyBytes = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
  );

  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext token string.
 * Returns a base64-encoded string containing IV + ciphertext.
 */
export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    encoded
  );

  // Concatenate IV + ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Base64 encode for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64-encoded encrypted token.
 * Returns the original plaintext string.
 */
export async function decryptToken(encrypted: string): Promise<string> {
  const key = await getEncryptionKey();

  // Decode base64
  const combined = new Uint8Array(
    atob(encrypted).split('').map(c => c.charCodeAt(0))
  );

  // Extract IV and ciphertext
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Check if the encryption key is configured.
 * Returns false if TOKEN_ENCRYPTION_KEY is not set (graceful degradation).
 */
export function isEncryptionConfigured(): boolean {
  return !!Deno.env.get(ENCRYPTION_KEY_ENV);
}
