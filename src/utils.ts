export function generateRandomCode(length: number = 6): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}
