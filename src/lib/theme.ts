// ============================================================================
// Theme engine
// ----------------------------------------------------------------------------
// The whole product is driven by CSS custom properties (design tokens) defined
// in index.css. A "theme" is just a complete map of those tokens plus brand
// metadata (name, logo, fonts, login art). Switching a theme writes the tokens
// onto <html> so every component — which already reads var(--token) — recolors
// instantly, system-wide.
//
// Two presets ship:
//   • momentum — the existing Momentum Africa Partners identity (green / navy)
//   • oxygene  — Oxygène MCL's identity (vivid orange + dark slate, airy white),
//                taken from their official wordmark.
//
// Users (admins especially) can also override individual tokens on top of a
// preset; those overrides are persisted and re-applied on boot.
// ============================================================================

export type ThemeId = 'momentum' | 'oxygene';

export interface ThemeBrand {
  /** Brand / company name shown in chrome. */
  name: string;
  /** Product label under the logo. */
  product: string;
  /** One-line positioning statement. */
  tagline: string;
  /** Logo asset path (in /public). */
  logo: string;
  /** Render the logo on a white chip (for dark surfaces). */
  logoChip: boolean;
  /** Placeholder email domain on the login form. */
  emailDomain: string;
  /** Login showcase art treatment. */
  loginShowcase: 'africa' | 'orb';
  /** Full-bleed login backdrop gradient. */
  loginBackdrop: string;
  /** Scrim drawn over the login backdrop for legibility. */
  loginScrim: string;
  /** Duotone tint applied over the showcase imagery. */
  loginTint: string;
  /** Headline lines rotated on the login screen. */
  slides: { image: string; title: string; subtitle: string }[];
}

export interface ThemeFonts {
  display: string;
  body: string;
  mono: string;
}

export interface Theme {
  id: ThemeId;
  label: string;
  description: string;
  brand: ThemeBrand;
  fonts: ThemeFonts;
  /** css-var-name (without leading --) -> value */
  tokens: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Momentum Africa Partners — green / navy (the original identity)
// ---------------------------------------------------------------------------
const momentum: Theme = {
  id: 'momentum',
  label: 'Momentum',
  description: 'Momentum Africa Partners — emerald & deep navy. Serif display, people-centred and warm.',
  brand: {
    name: 'Momentum',
    product: 'Stakeholder Intelligence Tool',
    tagline: 'Map the people who move policy across Africa.',
    logo: '/momentum-logo.png',
    logoChip: true,
    emailDomain: 'momentum.africa',
    loginShowcase: 'africa',
    loginBackdrop: 'linear-gradient(135deg, #0A201B 0%, #0C2A22 55%, #0A1F1B 100%)',
    loginScrim: 'linear-gradient(110deg, rgba(10,32,27,0.96) 0%, rgba(10,32,27,0.84) 45%, rgba(10,32,27,0.42) 100%)',
    loginTint: 'linear-gradient(135deg, rgba(11,42,36,0.55) 0%, rgba(17,74,59,0.4) 55%, rgba(45,166,126,0.55) 100%)',
    slides: [
      { image: '/login-team.png', title: 'Map the people who move policy', subtitle: "Score, classify and engage the stakeholders shaping Africa's agenda." },
      { image: '/login-pair.png', title: 'Turn intelligence into influence', subtitle: 'Data-driven decisions for smarter advocacy and partnerships.' },
      { image: '/login-focus.png', title: 'See the whole board, in real time', subtitle: 'Track quadrants, risks and engagement gaps as every focal point moves.' },
    ],
  },
  fonts: {
    display: "'Instrument Serif', Georgia, serif",
    body: "'Instrument Sans', -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  tokens: {
    'bg-primary': '#FAFAF8',
    'bg-secondary': '#F4F3F0',
    'bg-elevated': '#FFFFFF',
    'bg-inset': '#EEEDEA',
    'bg-dark': '#1A2D3A',
    'bg-texture': 'none',
    'text-primary': '#1A2D3A',
    'text-secondary': '#4A5C68',
    'text-muted': '#8C9AA3',
    'text-inverse': '#FAFAF8',
    'border-default': '#E5E4E0',
    'border-subtle': '#F0EFEC',
    'border-strong': '#D0CFC8',
    'quadrant-ally': '#2DA67E',
    'quadrant-ally-bg': '#E8F6F0',
    'quadrant-ally-text': '#1F7A5C',
    'quadrant-power-gap': '#C0392B',
    'quadrant-power-gap-bg': '#FBEAEA',
    'quadrant-power-gap-text': '#922B21',
    'quadrant-hidden': '#D4A017',
    'quadrant-hidden-bg': '#FDF6E3',
    'quadrant-hidden-text': '#9A7611',
    'quadrant-monitor': '#7F8C8D',
    'quadrant-monitor-bg': '#F2F3F3',
    'quadrant-monitor-text': '#5D6868',
    'brand-primary': '#2DA67E',
    'brand-primary-hover': '#228866',
    'brand-primary-dark': '#1F7A5C',
    'brand-primary-light': '#5BC09D',
    'brand-primary-bg': '#E8F6F0',
    'brand-primary-rgb': '45, 166, 126',
    'brand-navy': '#1A2D3A',
    'brand-navy-dark': '#0F1E29',
    'brand-navy-light': '#2A4253',
    'brand-accent': '#2DA67E',
    'accent-primary': '#2DA67E',
    'accent-primary-hover': '#228866',
    'accent-warm': '#C4956A',
    'status-success': '#2DA67E',
    'status-warning': '#D97706',
    'status-danger': '#DC2626',
    'status-info': '#1A2D3A',
    'shadow-sm': '0 1px 2px rgba(26, 45, 58, 0.05)',
    'shadow-md': '0 4px 12px rgba(26, 45, 58, 0.07)',
    'shadow-lg': '0 12px 40px rgba(26, 45, 58, 0.1)',
    'shadow-xl': '0 24px 64px rgba(26, 45, 58, 0.14)',
    'shadow-brand': '0 8px 24px rgba(45, 166, 126, 0.22)',
    'gradient-brand': 'linear-gradient(135deg, #2DA67E 0%, #5BC09D 100%)',
    'gradient-brand-dark': 'linear-gradient(135deg, #0F1E29 0%, #1A2D3A 60%, #2A4253 100%)',
    'gradient-brand-hero': 'linear-gradient(135deg, #0F1E29 0%, #1A2D3A 50%, #1F4D45 100%)',
    'gradient-sidebar': 'linear-gradient(180deg, #0F1E29 0%, #1A2D3A 100%)',
    'selection-bg': 'rgba(45, 166, 126, 0.2)',
    'font-display': "'Instrument Serif', Georgia, serif",
    'font-body': "'Instrument Sans', -apple-system, sans-serif",
    'font-mono': "'JetBrains Mono', 'Fira Code', monospace",
  },
};

// ---------------------------------------------------------------------------
// Oxygène MCL — vivid orange + dark slate, airy white. Geometric sans.
// Palette sampled from the official OXYGÈNE wordmark (orange O + slate type).
// ---------------------------------------------------------------------------
const oxygene: Theme = {
  id: 'oxygene',
  label: 'Oxygène',
  description: 'Oxygène MCL — electric orange & slate navy on airy white. Geometric Poppins display, crisp and modern.',
  brand: {
    name: 'Oxygène',
    product: 'Stakeholder Intelligence',
    tagline: 'Earn attention. Incite action. Grow influence.',
    logo: '/oxygene-logo.png',
    logoChip: false,
    emailDomain: 'oxygene.co.ke',
    loginShowcase: 'orb',
    loginBackdrop: 'linear-gradient(135deg, #161D2B 0%, #1E2738 55%, #241A14 100%)',
    loginScrim: 'linear-gradient(110deg, rgba(22,29,43,0.95) 0%, rgba(22,29,43,0.82) 45%, rgba(22,29,43,0.42) 100%)',
    loginTint: 'linear-gradient(135deg, rgba(30,39,56,0.45) 0%, rgba(194,65,12,0.35) 55%, rgba(241,90,41,0.6) 100%)',
    slides: [
      { image: '/login-team.png', title: 'Communications that move markets', subtitle: 'Map, score and engage the stakeholders behind every reputation.' },
      { image: '/login-pair.png', title: 'Integration at the heart of influence', subtitle: 'People, culture and relationships — turned into measurable action.' },
      { image: '/login-focus.png', title: 'See every relationship in real time', subtitle: 'Track quadrants, risk and momentum across each engagement.' },
    ],
  },
  fonts: {
    display: "'Poppins', 'Montserrat', sans-serif",
    body: "'Inter', -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  tokens: {
    'bg-primary': '#F7F8FA',
    'bg-secondary': '#EEF1F5',
    'bg-elevated': '#FFFFFF',
    'bg-inset': '#E7EBF1',
    'bg-dark': '#1E2738',
    'bg-texture': 'radial-gradient(rgba(241,90,41,0.05) 1px, transparent 1px)',
    'text-primary': '#1E2738',
    'text-secondary': '#4C586E',
    'text-muted': '#8B95A7',
    'text-inverse': '#F7F8FA',
    'border-default': '#E2E7EE',
    'border-subtle': '#EEF1F6',
    'border-strong': '#CBD2DD',
    // Quadrants stay semantic (ally green, risk red…) but are tuned to sit
    // beside the orange brand without clashing.
    'quadrant-ally': '#1F9D6B',
    'quadrant-ally-bg': '#E5F6EE',
    'quadrant-ally-text': '#167A52',
    'quadrant-power-gap': '#E5484D',
    'quadrant-power-gap-bg': '#FCEAEA',
    'quadrant-power-gap-text': '#B4232A',
    'quadrant-hidden': '#E0A92E',
    'quadrant-hidden-bg': '#FBF3DE',
    'quadrant-hidden-text': '#956F12',
    'quadrant-monitor': '#7C8696',
    'quadrant-monitor-bg': '#F1F3F6',
    'quadrant-monitor-text': '#586273',
    'brand-primary': '#F15A29',
    'brand-primary-hover': '#DB4A1C',
    'brand-primary-dark': '#C2410C',
    'brand-primary-light': '#FF8551',
    'brand-primary-bg': '#FDEDE5',
    'brand-primary-rgb': '241, 90, 41',
    'brand-navy': '#2E3A50',
    'brand-navy-dark': '#1E2738',
    'brand-navy-light': '#3D4B66',
    'brand-accent': '#F15A29',
    'accent-primary': '#F15A29',
    'accent-primary-hover': '#DB4A1C',
    'accent-warm': '#E0A92E',
    'status-success': '#1F9D6B',
    'status-warning': '#E8902A',
    'status-danger': '#E5484D',
    'status-info': '#2E3A50',
    'shadow-sm': '0 1px 2px rgba(30, 39, 56, 0.06)',
    'shadow-md': '0 4px 14px rgba(30, 39, 56, 0.09)',
    'shadow-lg': '0 12px 40px rgba(30, 39, 56, 0.12)',
    'shadow-xl': '0 24px 64px rgba(30, 39, 56, 0.16)',
    'shadow-brand': '0 8px 24px rgba(241, 90, 41, 0.28)',
    'gradient-brand': 'linear-gradient(135deg, #F15A29 0%, #FF8551 100%)',
    'gradient-brand-dark': 'linear-gradient(135deg, #161D2B 0%, #1E2738 60%, #2E3A50 100%)',
    'gradient-brand-hero': 'linear-gradient(135deg, #161D2B 0%, #1E2738 48%, #5C2E1A 100%)',
    'gradient-sidebar': 'linear-gradient(180deg, #161D2B 0%, #232E42 100%)',
    'selection-bg': 'rgba(241, 90, 41, 0.2)',
    'font-display': "'Poppins', 'Montserrat', sans-serif",
    'font-body': "'Inter', -apple-system, sans-serif",
    'font-mono': "'JetBrains Mono', 'Fira Code', monospace",
  },
};

export const THEMES: Record<ThemeId, Theme> = { momentum, oxygene };
export const THEME_LIST: Theme[] = [momentum, oxygene];
export const DEFAULT_THEME_ID: ThemeId = 'momentum';

// Tokens exposed in the customizer, grouped for the UI. Each maps to one or
// more css vars; `derive` lets a single colour cascade to related tokens.
export interface ColorControl {
  key: string;        // primary token edited
  label: string;
  hint?: string;
  derive?: (hex: string) => Record<string, string>;
}

export const COLOR_GROUPS: { group: string; controls: ColorControl[] }[] = [
  {
    group: 'Brand',
    controls: [
      {
        key: 'brand-primary',
        label: 'Primary / brand',
        hint: 'Buttons, links, highlights',
        derive: (hex) => ({
          'brand-primary': hex,
          'brand-accent': hex,
          'accent-primary': hex,
          'brand-primary-hover': shade(hex, -0.12),
          'accent-primary-hover': shade(hex, -0.12),
          'brand-primary-dark': shade(hex, -0.24),
          'brand-primary-light': shade(hex, 0.22),
          'brand-primary-bg': mix(hex, '#FFFFFF', 0.88),
          'brand-primary-rgb': hexToRgbString(hex),
          'gradient-brand': `linear-gradient(135deg, ${hex} 0%, ${shade(hex, 0.2)} 100%)`,
          'shadow-brand': `0 8px 24px ${hexToRgba(hex, 0.26)}`,
          'selection-bg': hexToRgba(hex, 0.2),
        }),
      },
      {
        key: 'brand-navy',
        label: 'Headline / navy',
        hint: 'Sidebar, hero & dark surfaces',
        derive: (hex) => ({
          'brand-navy': hex,
          'brand-navy-dark': shade(hex, -0.3),
          'brand-navy-light': shade(hex, 0.22),
          'bg-dark': hex,
          'gradient-sidebar': `linear-gradient(180deg, ${shade(hex, -0.25)} 0%, ${shade(hex, 0.08)} 100%)`,
          'gradient-brand-dark': `linear-gradient(135deg, ${shade(hex, -0.3)} 0%, ${hex} 60%, ${shade(hex, 0.2)} 100%)`,
          'gradient-brand-hero': `linear-gradient(135deg, ${shade(hex, -0.3)} 0%, ${hex} 50%, ${shade(hex, 0.18)} 100%)`,
        }),
      },
      { key: 'accent-warm', label: 'Warm accent', hint: 'Secondary highlights' },
    ],
  },
  {
    group: 'Surfaces',
    controls: [
      { key: 'bg-primary', label: 'App background' },
      { key: 'bg-elevated', label: 'Card surface' },
      { key: 'bg-secondary', label: 'Muted surface' },
    ],
  },
  {
    group: 'Text',
    controls: [
      { key: 'text-primary', label: 'Primary text' },
      { key: 'text-secondary', label: 'Secondary text' },
      { key: 'text-muted', label: 'Muted text' },
    ],
  },
  {
    group: 'Status',
    controls: [
      { key: 'status-success', label: 'Success' },
      { key: 'status-warning', label: 'Warning' },
      { key: 'status-danger', label: 'Danger' },
    ],
  },
];

export const FONT_OPTIONS: { label: string; value: string; sample: string }[] = [
  { label: 'Instrument Serif', value: "'Instrument Serif', Georgia, serif", sample: 'Aa' },
  { label: 'Poppins', value: "'Poppins', 'Montserrat', sans-serif", sample: 'Aa' },
  { label: 'Montserrat', value: "'Montserrat', sans-serif", sample: 'Aa' },
  { label: 'Sora', value: "'Sora', sans-serif", sample: 'Aa' },
  { label: 'Instrument Sans', value: "'Instrument Sans', -apple-system, sans-serif", sample: 'Aa' },
  { label: 'Inter', value: "'Inter', -apple-system, sans-serif", sample: 'Aa' },
];

// ---------------------------------------------------------------------------
// Colour helpers (also used by the customizer for live cascades)
// ---------------------------------------------------------------------------
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function hexToRgbString(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}
export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function clamp(n: number): number { return Math.max(0, Math.min(255, Math.round(n))); }
function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('').toUpperCase();
}
/** Lighten (amt > 0) or darken (amt < 0) a hex colour. */
export function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  return toHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
}
/** Mix two hex colours; ratio is weight of `b`. */
export function mix(a: string, b: string, ratio: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return toHex(ar + (br - ar) * ratio, ag + (bg - ag) * ratio, ab + (bb - ab) * ratio);
}

// ---------------------------------------------------------------------------
// Apply + persist
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'msit-theme-v1';

export interface ThemePref {
  id: ThemeId;
  custom: Record<string, string>;
}

/** Resolve the final token map: preset tokens overlaid with user overrides. */
export function resolveTokens(id: ThemeId, custom: Record<string, string>): Record<string, string> {
  const base = THEMES[id]?.tokens ?? THEMES[DEFAULT_THEME_ID].tokens;
  return { ...base, ...custom };
}

/** Write the resolved tokens onto <html> so the whole app recolors. */
export function applyTheme(id: ThemeId, custom: Record<string, string> = {}): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const tokens = resolveTokens(id, custom);
  for (const [k, v] of Object.entries(tokens)) root.style.setProperty(`--${k}`, v);
  root.setAttribute('data-theme', id);
  const themeColor = tokens['brand-primary'];
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && themeColor) meta.setAttribute('content', themeColor);
}

export function loadThemePref(): ThemePref {
  if (typeof localStorage === 'undefined') return { id: DEFAULT_THEME_ID, custom: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { id: DEFAULT_THEME_ID, custom: {} };
    const parsed = JSON.parse(raw) as Partial<ThemePref>;
    const id: ThemeId = parsed.id === 'oxygene' || parsed.id === 'momentum' ? parsed.id : DEFAULT_THEME_ID;
    return { id, custom: parsed.custom ?? {} };
  } catch {
    return { id: DEFAULT_THEME_ID, custom: {} };
  }
}

export function saveThemePref(pref: ThemePref): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pref)); } catch { /* ignore */ }
}

/** Read the stored preference and apply it. Call once, before render. */
export function initTheme(): ThemePref {
  const pref = loadThemePref();
  applyTheme(pref.id, pref.custom);
  return pref;
}
