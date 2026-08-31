// Client-side decryption of the CV payload. The site ships only AES-GCM
// ciphertext (src/lib/cv-payload.ts); the key is derived from the visitor's
// passphrase with PBKDF2-SHA256 (600k iterations) and never leaves the browser.

import { CV_PAYLOAD } from "./cv-payload";
import type { CvData } from "./cv-types";

export interface UnlockedCv {
  cv: CvData;
  portraitDataUrl: string;
}

const STORAGE_KEY = "cv-unlocked-v1";

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: b64ToBytes(CV_PAYLOAD.kdf.salt) as BufferSource,
      iterations: CV_PAYLOAD.kdf.iterations,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

async function decryptBytes(key: CryptoKey, iv: string, data: string): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(iv) as BufferSource },
    key,
    b64ToBytes(data) as BufferSource,
  );
}

// True when the build had no passphrase configured — the payload ships in the
// clear and the gate is bypassed entirely.
export const IS_OPEN: boolean = !(CV_PAYLOAD.locked as boolean);

// Reads an unencrypted (open) payload straight out of the bundle.
export function readOpenPayload(): UnlockedCv {
  const cv = JSON.parse(new TextDecoder().decode(b64ToBytes(CV_PAYLOAD.cv.data))) as CvData;
  return {
    cv,
    portraitDataUrl: `data:${CV_PAYLOAD.portrait.type};base64,${CV_PAYLOAD.portrait.data}`,
  };
}

// Returns the decrypted CV, or null when the passphrase is wrong —
// AES-GCM authentication fails on any mismatch, no separate check needed.
export async function unlockWithPassphrase(passphrase: string): Promise<UnlockedCv | null> {
  if (IS_OPEN) return readOpenPayload();
  try {
    const key = await deriveKey(passphrase);
    const cvBytes = await decryptBytes(key, CV_PAYLOAD.cv.iv, CV_PAYLOAD.cv.data);
    const cv = JSON.parse(new TextDecoder().decode(cvBytes)) as CvData;
    const picBytes = await decryptBytes(key, CV_PAYLOAD.portrait.iv, CV_PAYLOAD.portrait.data);
    const portraitDataUrl = `data:${CV_PAYLOAD.portrait.type};base64,${bytesToB64(new Uint8Array(picBytes))}`;
    return { cv, portraitDataUrl };
  } catch {
    return null;
  }
}


// Persist the unlocked payload for the tab session so a refresh stays unlocked.
export function saveUnlocked(value: UnlockedCv): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private mode / quota exceeded — unlocking still works for this view.
  }
}

export function loadUnlocked(): UnlockedCv | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UnlockedCv) : null;
  } catch {
    return null;
  }
}

export function clearUnlocked(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
