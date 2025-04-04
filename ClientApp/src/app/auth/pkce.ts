import { sha256 } from 'js-sha256';
import { base64URLEncode } from './base64';

/**
 * Generates a random code verifier for PKCE
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Generates a code challenge from a code verifier for PKCE
 */
export function generateCodeChallenge(verifier: string): string {
  const hash = sha256(verifier);
  return base64URLEncode(hash);
} 