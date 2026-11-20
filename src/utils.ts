/**
 * Generates a numeric code using the platform's cryptographic random source.
 */
export function generateRandomCode(length: number = 6): string {
  if (!Number.isInteger(length) || length < 1 || length > 20) {
    throw new RangeError("Code length must be an integer between 1 and 20");
  }

  let code = "";
  const bytes = new Uint8Array(length * 2);

  while (code.length < length) {
    globalThis.crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      // Discard 250-255 so every digit is equally likely.
      if (byte < 250 && code.length < length) {
        code += (byte % 10).toString();
      }
    }
  }

  return code;
}
