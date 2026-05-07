/**
 * Portrait system for MSIT stakeholders.
 *
 * Uses randomuser.me direct portrait URLs for realistic, diverse human photos.
 * Each name is hashed to a stable index so the same person always gets the same face.
 * For uploaded custom images, the Stakeholder.portrait_url field takes priority.
 */

export type Gender = 'female' | 'male' | undefined;

function hashName(name: string): number {
  let hash = 0;
  const s = name.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a portrait photo URL for a stakeholder.
 * If a custom portrait_url is provided, that takes priority.
 * Otherwise uses randomuser.me which has 100 female + 100 male real photos.
 */
export function getPortraitUrl(name: string, gender: Gender, customUrl?: string | null): string {
  if (customUrl) return customUrl;
  const hash = hashName(name);
  if (gender === 'female') {
    return `https://randomuser.me/api/portraits/women/${hash % 100}.jpg`;
  }
  return `https://randomuser.me/api/portraits/men/${hash % 100}.jpg`;
}

export function getAvatarUrl(name: string, gender: Gender): string {
  return getPortraitUrl(name, gender);
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
