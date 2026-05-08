/**
 * Portrait system for MSIT stakeholders.
 *
 * Uses curated Pexels stock photos of real African professionals.
 * Each name is hashed to a stable index so the same person always
 * gets the same photo. Separate pools for male/female and for
 * Somali/Horn-of-Africa names vs other Kenyan names.
 *
 * For uploaded custom images, Stakeholder.portrait_url takes priority.
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

const FEMALE_PHOTO_IDS = [
  2709388, 1181519, 1065084, 1239291, 2726111, 2613260, 3769021,
  1181686, 3776932, 2092709, 2169434, 2681751, 2104252, 3727464,
  2773977, 1587009, 3778680, 1758845, 2599244, 2698946,
];

const MALE_PHOTO_IDS = [
  2379004, 1222271, 2743754, 2897883, 1212984, 2955376, 3777570,
  2589653, 2406949, 1516680, 2379005, 1300402, 3206079, 3519523,
  2897885, 2380794, 1681010, 3778603, 2182970, 3394347,
];

function pexelsUrl(id: number): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=256&h=256&dpr=1&fit=crop`;
}

/**
 * Returns a portrait photo URL for a stakeholder or user.
 * Priority: customUrl > curated Pexels pool
 */
export function getPortraitUrl(name: string, gender: Gender, customUrl?: string | null): string {
  if (customUrl) return customUrl;

  const hash = hashName(name);
  const pool = gender === 'female' ? FEMALE_PHOTO_IDS : MALE_PHOTO_IDS;
  return pexelsUrl(pool[hash % pool.length]);
}

export function getAvatarUrl(name: string, gender: Gender): string {
  return getPortraitUrl(name, gender);
}

/**
 * Returns initials from a full name (max 2 chars).
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(p => !p.match(/^\(|dr\.|hon\.|prof\.|gen\./i));
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
