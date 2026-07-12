const TOKEN_PREFIX = "of_";
const TOKEN_BYTES = 24;

export function generateApiToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${TOKEN_PREFIX}${hex}`;
}

export function tokenPrefix(token: string): string {
  return token.slice(0, TOKEN_PREFIX.length + 8);
}

export async function hashApiToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function isValidTokenFormat(token: string): boolean {
  return /^of_[0-9a-f]{48}$/.test(token);
}
