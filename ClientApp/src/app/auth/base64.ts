/**
 * Encodes a string or Uint8Array to base64URL format
 */
export function base64URLEncode(buffer: string | Uint8Array): string {
  const base64 = btoa(typeof buffer === 'string' ? buffer : String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
} 