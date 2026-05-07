const FEMALE_PORTRAITS = Array.from({ length: 25 }, (_, i) => 
  `/portraits/f-${String(i + 1).padStart(2, '0')}.webp`
);
const MALE_PORTRAITS = Array.from({ length: 25 }, (_, i) => 
  `/portraits/m-${String(i + 1).padStart(2, '0')}.webp`
);

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getPortraitUrl(name: string, gender: 'female' | 'male' | undefined): string {
  const hash = hashString(name.trim().toLowerCase());
  if (gender === 'female') {
    return FEMALE_PORTRAITS[hash % FEMALE_PORTRAITS.length];
  }
  return MALE_PORTRAITS[hash % MALE_PORTRAITS.length];
}

export const getAvatarUrl = getPortraitUrl;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type Gender = 'female' | 'male' | undefined;
