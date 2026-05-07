/**
 * Portrait system for MSIT stakeholders.
 *
 * Uses pravatar.cc for realistic, diverse portrait photos.
 * Each name is hashed to a stable index so the same person always gets the same face.
 * Falls back to branded initials if the image fails to load.
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
 *
 * Uses pravatar.cc which serves 70 pre-set real human photos at
 * https://i.pravatar.cc/200?img=N (N = 1–70). Photos are split into
 * female and male ID ranges for gender-consistent assignment.
 */
export function getPortraitUrl(name: string, gender: Gender): string {
  const hash = hashName(name);
  if (gender === 'female') {
    const femaleIds = [1, 5, 9, 10, 16, 20, 21, 23, 24, 25, 26, 28, 29, 31, 32, 34, 36, 38, 39, 40, 41, 43, 44, 45, 47, 48, 49];
    return `https://i.pravatar.cc/200?img=${femaleIds[hash % femaleIds.length]}`;
  }
  const maleIds = [3, 4, 6, 7, 8, 11, 12, 13, 14, 15, 17, 18, 19, 22, 27, 30, 33, 35, 37, 42, 46, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60];
  return `https://i.pravatar.cc/200?img=${maleIds[hash % maleIds.length]}`;
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
