/**
 * Avatar utilities — uses DiceBear (free, no API key) for gendered, deterministic
 * avatars. Same name + gender always returns the same image.
 *
 * Docs: https://www.dicebear.com/styles/
 */

const DICEBEAR_BASE = 'https://api.dicebear.com/9.x';

export type Gender = 'female' | 'male' | undefined;

/**
 * Returns a deterministic SVG avatar URL for the given user.
 * - female -> `lorelei` (warm, illustrated, female-leaning)
 * - male   -> `notionists` (clean editorial-style male portraits)
 * - undefined -> `initials` fallback styled with brand colors
 */
export function getAvatarUrl(name: string, gender: Gender): string {
  const seed = encodeURIComponent(name.trim().toLowerCase());

  if (gender === 'female') {
    return `${DICEBEAR_BASE}/lorelei/svg?seed=${seed}&backgroundColor=e8f6f0,d6efe2,c8e8d6&backgroundType=gradientLinear&radius=50`;
  }
  if (gender === 'male') {
    return `${DICEBEAR_BASE}/notionists/svg?seed=${seed}&backgroundColor=e8f6f0,d6efe2,c8e8d6&backgroundType=gradientLinear&radius=50`;
  }
  return `${DICEBEAR_BASE}/initials/svg?seed=${seed}&backgroundColor=2DA67E&textColor=ffffff&radius=50`;
}

/**
 * Returns initials from a full name (max 2 chars).
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
