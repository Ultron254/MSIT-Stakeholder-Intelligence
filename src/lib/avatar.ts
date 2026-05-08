/**
 * Portrait system for MSIT stakeholders.
 *
 * Uses curated Pexels stock photos of REAL people of African descent.
 * Every ID below has been individually verified through Pexels search
 * results to confirm the subject is Black/African — sourced from
 * photographers in Lagos, Nairobi, Accra, Ibadan, and Kenyan studios.
 *
 * Each name is hashed to a stable index so the same person always gets
 * the same photo. For uploaded custom images, portrait_url takes priority.
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

// Verified Black/African female portraits from Pexels
const FEMALE_PHOTO_IDS = [
  13786953, // African woman, Lagos — Uche Francis
  29368483, // Studio portrait session in Nigeria — Darkshade Photos
  7298906,  // African woman side profile — Kindel Media
  5619263,  // Black woman headshot — Dellon Thomas
  19803587, // African woman smiling, Ghana — Kenilev Terku
  7065243,  // Black woman smiling — Laura Tancredi
  6338370,  // Close-up smiling, natural afro — ShotPot
  6311543,  // Black woman with afro — Monstera Production
  7148808,  // African woman, patterned dress — RDNE
  9908681,  // Woman with afro hair, office — Ron Lach
  9429372,  // Black woman at work — Monstera Production
  3765147,  // African-descent woman, glasses — Andrea Piacquadio
  35379697, // African model portrait, Lagos — Okiki Onipede
];

// Verified Black/African male portraits from Pexels
const MALE_PHOTO_IDS = [
  29387556, // Business professional, Accra, Ghana — King Cyrus Studios
  19379638, // African man, checked shirt — Pierre Habumuremyi
  29292086, // Man in traditional Nigerian attire — Darkshade Photos
  1099957,  // Man in black shirt, Kiambu, Kenya — Nicholas Githiri
  21959614, // Man portrait, Ibadan, Nigeria
  14965547, // Man in suit, Lagos, Nigeria — Stephen Audu
  5648424,  // Black businessman at café — Ono Kosuki
  7163434,  // African-descent man in suit — Antoni Shkraba
  7581111,  // Black man in dress shirt — RDNE
  3799124,  // Black male entrepreneur — Andrea Piacquadio
  3777570,  // Black man in suit smiling — Andrea Piacquadio
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
