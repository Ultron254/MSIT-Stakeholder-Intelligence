/**
 * Portrait system for MSIT stakeholders.
 *
 * Uses avatars.tzador.com — DALL-E 3 generated realistic faces with
 * ethnicity, gender, and age filters. Each name is hashed to a stable
 * numeric ID so the same person always gets the same face.
 *
 * Ethnicity is inferred from name patterns common in Kenya:
 *  - Somali / Cushitic names → "middle eastern" filter (closest match)
 *  - All other Kenyan names  → "black" filter
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

const SOMALI_MARKERS = [
  'abdullahi', 'hassan', 'hussein', 'fatuma', 'amina', 'abdi',
  'omar', 'mohamed', 'ali', 'adan', 'isse', 'yusuf', 'farah',
  'halima', 'habiba', 'maalim', 'noor', 'warsame', 'osman',
  'sheikh', 'haji', 'sharif', 'diallo',
];

function inferEthnicity(name: string): 'black' | 'middle+eastern' {
  const lower = name.trim().toLowerCase();
  for (const marker of SOMALI_MARKERS) {
    if (lower.includes(marker)) return 'middle+eastern';
  }
  return 'black';
}

function inferAge(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('prof.') || lower.includes('gen.') || lower.includes('rtd')) return '50+';
  if (lower.includes('dr.') || lower.includes('hon.')) return '35-50';
  if (lower.includes('junior') || lower.includes('jr')) return '26-35';
  return '35-50';
}

/**
 * Returns a portrait photo URL for a stakeholder or user.
 * Priority: customUrl > generated from avatars.tzador.com
 */
export function getPortraitUrl(name: string, gender: Gender, customUrl?: string | null): string {
  if (customUrl) return customUrl;

  const id = hashName(name);
  const g = gender === 'female' ? 'female' : 'male';
  const ethnicity = inferEthnicity(name);
  const age = inferAge(name);

  return `https://avatars.tzador.com/face?id=${id}&gender=${g}&ethnicity=${ethnicity}&age=${age}&size=200`;
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
