// Shared country options for stakeholder and client forms.
// Kenya keeps the seeded id (c-001) so existing data resolves; the rest cover
// Momentum Africa Partners' active and prospective markets.
export interface CountryOption {
  id: string;
  name: string;
  region: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { id: 'c-001', name: 'Kenya', region: 'East Africa' },
  { id: 'c-tza', name: 'Tanzania', region: 'East Africa' },
  { id: 'c-uga', name: 'Uganda', region: 'East Africa' },
  { id: 'c-rwa', name: 'Rwanda', region: 'East Africa' },
  { id: 'c-eth', name: 'Ethiopia', region: 'East Africa' },
  { id: 'c-nga', name: 'Nigeria', region: 'West Africa' },
  { id: 'c-gha', name: 'Ghana', region: 'West Africa' },
  { id: 'c-sen', name: 'Senegal', region: 'West Africa' },
  { id: 'c-civ', name: "Côte d'Ivoire", region: 'West Africa' },
  { id: 'c-zaf', name: 'South Africa', region: 'Southern Africa' },
  { id: 'c-zmb', name: 'Zambia', region: 'Southern Africa' },
  { id: 'c-zwe', name: 'Zimbabwe', region: 'Southern Africa' },
  { id: 'c-bwa', name: 'Botswana', region: 'Southern Africa' },
  { id: 'c-moz', name: 'Mozambique', region: 'Southern Africa' },
  { id: 'c-egy', name: 'Egypt', region: 'North Africa' },
  { id: 'c-mar', name: 'Morocco', region: 'North Africa' },
  { id: 'c-cod', name: 'DR Congo', region: 'Central Africa' },
];

export function countryNameById(id: string | undefined | null): string {
  if (!id) return '';
  return COUNTRY_OPTIONS.find(c => c.id === id)?.name ?? '';
}

export function countryIdByName(name: string): string {
  return COUNTRY_OPTIONS.find(c => c.name === name)?.id ?? 'c-001';
}
