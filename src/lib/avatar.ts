/**
 * Stakeholder portrait system.
 * Serves curated Pexels photos of African professionals, assigned
 * deterministically by name hash. Custom portrait_url takes priority.
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

// Pexels IDs: verified portraits of African women in professional settings
const FEMALE_PHOTO_IDS = [
  13786953, 29368483, 7298906, 5619263, 19803587,
  7065243, 6338370, 6311543, 7148808, 9908681,
  9429372, 3765147, 35379697,
];

// Pexels IDs: verified portraits of African men in professional settings
const MALE_PHOTO_IDS = [
  29387556, 19379638, 29292086, 1099957, 21959614,
  14965547, 5648424, 7163434, 7581111, 3799124,
  3777570,
];

function pexelsUrl(id: number): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=256&h=256&dpr=1&fit=crop`;
}

export function getPortraitUrl(name: string, gender: Gender, customUrl?: string | null): string {
  if (customUrl) return customUrl;

  const hash = hashName(name);
  const pool = gender === 'female' ? FEMALE_PHOTO_IDS : MALE_PHOTO_IDS;
  return pexelsUrl(pool[hash % pool.length]);
}

export function getAvatarUrl(name: string, gender: Gender): string {
  return getPortraitUrl(name, gender);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(p => !p.match(/^\(|dr\.|hon\.|prof\.|gen\./i));
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
