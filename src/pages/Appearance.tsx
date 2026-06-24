import { useMemo } from 'react';
import {
  Palette, Check, RotateCcw, Type, Sparkles, Image as ImageIcon,
  ShieldCheck, Droplet, ArrowRight,
} from 'lucide-react';
import { useAppStore, useCurrentUser } from '../lib/store';
import {
  THEME_LIST, THEMES, COLOR_GROUPS, FONT_OPTIONS, resolveTokens,
  type Theme, type ThemeId, type ColorControl,
} from '../lib/theme';

export default function Appearance() {
  const themeId = useAppStore(s => s.themeId);
  const themeCustom = useAppStore(s => s.themeCustom);
  const setThemeId = useAppStore(s => s.setThemeId);
  const updateThemeTokens = useAppStore(s => s.updateThemeTokens);
  const resetTheme = useAppStore(s => s.resetTheme);
  const addToast = useAppStore(s => s.addToast);
  const me = useCurrentUser();

  const resolved = useMemo(() => resolveTokens(themeId, themeCustom), [themeId, themeCustom]);
  const hasCustom = Object.keys(themeCustom).length > 0;
  const activeTheme = THEMES[themeId];

  const choosePreset = (id: ThemeId) => {
    if (id === themeId && !hasCustom) return;
    setThemeId(id);
    addToast(`${THEMES[id].label} theme applied across the platform`, 'success');
  };

  const editColor = (control: ColorControl, hex: string) => {
    const patch = control.derive ? control.derive(hex) : { [control.key]: hex };
    updateThemeTokens(patch);
  };

  const editFont = (key: 'font-display' | 'font-body', value: string) => {
    updateThemeTokens({ [key]: value });
  };

  return (
    <div className="page-enter space-y-7" style={{ maxWidth: 1180 }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--gradient-brand)', color: 'white', boxShadow: 'var(--shadow-brand)' }}>
            <Palette size={20} />
          </div>
          <div>
            <h1 className="text-display-md" style={{ color: 'var(--text-primary)' }}>Appearance</h1>
            <p className="text-body-sm mt-1" style={{ color: 'var(--text-muted)', maxWidth: 620 }}>
              Choose a brand preset or craft your own. Everything — colours, typography, gradients, the sign-in screen and brand marks — updates across the entire platform the instant you change it.
            </p>
          </div>
        </div>
        {hasCustom && (
          <button
            onClick={() => { resetTheme(); addToast('Reverted to preset defaults', 'info'); }}
            className="flex items-center gap-2 rounded-lg btn-press"
            style={{ padding: '9px 14px', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}
          >
            <RotateCcw size={14} /> Reset to {activeTheme.label} defaults
          </button>
        )}
      </div>

      {me?.role !== 'admin' && (
        <div className="flex items-center gap-2.5 rounded-xl px-4 py-2.5" style={{ background: 'var(--brand-primary-bg)', border: '1px solid var(--border-subtle)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--brand-primary)' }} />
          <span className="text-body-sm" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            Theme changes apply to your workspace. Admins can set the organisation-wide default.
          </span>
        </div>
      )}

      {/* Presets */}
      <section className="space-y-3">
        <SectionHeading icon={Sparkles} title="Brand presets" subtitle="Two designer-built identities. Selecting one re-skins the whole system." />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {THEME_LIST.map(theme => (
            <PresetCard key={theme.id} theme={theme} active={theme.id === themeId} onSelect={() => choosePreset(theme.id)} />
          ))}
        </div>
      </section>

      {/* Live preview */}
      <section className="space-y-3">
        <SectionHeading icon={ImageIcon} title="Live preview" subtitle="A snapshot of real components rendered with your current theme." />
        <LivePreview />
      </section>

      {/* Customization */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Colours */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Droplet size={16} style={{ color: 'var(--brand-primary)' }} />
            <h3 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>Colours</h3>
          </div>
          <p className="text-body-sm mb-4" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Fine-tune any colour. Brand and headline cascade automatically to hovers, gradients and tints.
          </p>
          <div className="space-y-5">
            {COLOR_GROUPS.map(group => (
              <div key={group.group}>
                <div className="text-label mb-2" style={{ fontSize: '0.5625rem' }}>{group.group}</div>
                <div className="space-y-2">
                  {group.controls.map(control => (
                    <ColorRow key={control.key} control={control} value={resolved[control.key] ?? '#000000'} onChange={(hex) => editColor(control, hex)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography + assets */}
        <div className="space-y-5">
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Type size={16} style={{ color: 'var(--brand-primary)' }} />
              <h3 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>Typography</h3>
            </div>
            <p className="text-body-sm mb-4" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Set the display and body typefaces used everywhere.
            </p>
            <div className="space-y-4">
              <FontSelect label="Display / headings" value={resolved['font-display'] ?? ''} onChange={(v) => editFont('font-display', v)} previewWeight={600} />
              <FontSelect label="Body / interface" value={resolved['font-body'] ?? ''} onChange={(v) => editFont('font-body', v)} previewWeight={400} />
            </div>
            <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', lineHeight: 1.1, color: 'var(--text-primary)' }}>
                Intelligence in motion
              </div>
              <p className="mt-1" style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                The quick brown fox maps the people who move policy — 0123456789.
              </p>
            </div>
          </div>

          {/* Brand assets */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} style={{ color: 'var(--brand-primary)' }} />
              <h3 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>Brand identity</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-lg px-3 py-2.5 flex items-center shrink-0" style={{ background: '#FFFFFF', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
                <img src={activeTheme.brand.logo} alt={activeTheme.brand.name} className="h-7 w-auto object-contain block" style={{ maxWidth: 150 }} />
              </div>
              <div className="min-w-0">
                <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{activeTheme.brand.name}</div>
                <div className="text-body-sm truncate" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{activeTheme.brand.tagline}</div>
              </div>
            </div>
            <p className="text-body-sm mt-3" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
              The logo, product name and sign-in artwork are bound to the active preset.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preset card — renders each theme's OWN identity (literal tokens), not the
// globally-applied one, so both cards always show their true look.
// ---------------------------------------------------------------------------
function PresetCard({ theme, active, onSelect }: { theme: Theme; active: boolean; onSelect: () => void }) {
  const t = theme.tokens;
  const swatches = ['brand-primary', 'brand-navy', 'accent-warm', 'status-success', 'status-danger'];
  return (
    <button
      onClick={onSelect}
      className="text-left rounded-2xl overflow-hidden transition-all duration-200 btn-press"
      style={{
        background: 'var(--bg-elevated)',
        border: active ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
        boxShadow: active ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        outline: active ? '4px solid rgba(var(--brand-primary-rgb), 0.12)' : 'none',
      }}
    >
      {/* Mock chrome band using the theme's own dark gradient */}
      <div className="relative h-24 flex items-center px-4" style={{ background: t['gradient-brand-hero'] }}>
        <div className="rounded-md px-2.5 py-1.5 flex items-center" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
          <img src={theme.brand.logo} alt={theme.brand.name} className="h-5 w-auto object-contain block" style={{ maxWidth: 110 }} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {theme.brand.loginShowcase === 'orb' ? (
            <span className="block w-10 h-10 rounded-full" style={{ background: t['gradient-brand'], boxShadow: `0 0 18px ${t['brand-primary']}88` }} />
          ) : (
            <span className="block w-10 h-10" style={{ background: t['gradient-brand'], WebkitMaskImage: 'url(/login-africa.png)', maskImage: 'url(/login-africa.png)', WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
          )}
        </div>
        {active && (
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'white', color: t['brand-primary'] }}>
            <Check size={14} strokeWidth={3} />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: theme.fonts.display, fontSize: '1.35rem', color: 'var(--text-primary)' }}>{theme.label}</span>
          <span className="px-2 py-0.5 rounded-full" style={{ background: active ? 'var(--brand-primary-bg)' : 'var(--bg-inset)', color: active ? 'var(--brand-primary-dark)' : 'var(--text-muted)', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {active ? 'Active' : 'Preview'}
          </span>
        </div>
        <p className="text-body-sm mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', minHeight: 32 }}>{theme.description}</p>

        {/* Swatches */}
        <div className="flex items-center gap-1.5 mt-3">
          {swatches.map(k => (
            <span key={k} className="w-7 h-7 rounded-lg" style={{ background: t[k], border: '1px solid rgba(0,0,0,0.06)' }} title={k} />
          ))}
          <span className="ml-2 text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{theme.fonts.display.split(',')[0].replace(/'/g, '')}</span>
        </div>

        {/* Mini component row */}
        <div className="flex items-center gap-2 mt-4">
          <span className="rounded-lg px-3 py-1.5" style={{ background: t['gradient-brand'], color: 'white', fontSize: '0.6875rem', fontWeight: 700 }}>Primary</span>
          <span className="rounded-lg px-3 py-1.5" style={{ background: t['quadrant-ally-bg'], color: t['quadrant-ally-text'], fontSize: '0.6875rem', fontWeight: 700 }}>Ally</span>
          <span className="rounded-lg px-3 py-1.5" style={{ background: t['quadrant-power-gap-bg'], color: t['quadrant-power-gap-text'], fontSize: '0.6875rem', fontWeight: 700 }}>Power gap</span>
          <span className="ml-auto inline-flex items-center gap-1" style={{ color: t['brand-primary'], fontSize: '0.6875rem', fontWeight: 700 }}>
            {active ? 'Applied' : 'Apply'} <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Live preview — uses var() so it reflects custom overrides in real time.
// ---------------------------------------------------------------------------
function LivePreview() {
  const bars = [62, 78, 45, 88, 71, 56];
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Hero */}
      <div className="relative px-6 py-5 overflow-hidden" style={{ background: 'var(--gradient-brand-hero)' }}>
        <div className="hero-shine" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="text-label" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.5625rem' }}>Live focal point</div>
            <div className="font-display" style={{ color: 'white', fontSize: '1.5rem', lineHeight: 1.1 }}>Renewable Energy Bill</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', marginTop: 2 }}>42 stakeholders mapped · 6 at risk</div>
          </div>
          <div className="text-right">
            <div className="text-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.5625rem' }}>Portfolio SIS</div>
            <div className="font-display" style={{ color: 'white', fontSize: '2.25rem', lineHeight: 1 }}>74.2</div>
          </div>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Controls */}
        <div className="space-y-3">
          <button className="w-full rounded-lg btn-press" style={{ padding: '10px 14px', background: 'var(--gradient-brand)', color: 'white', fontWeight: 600, fontSize: '0.8125rem', boxShadow: 'var(--shadow-brand)' }}>Primary action</button>
          <button className="w-full rounded-lg" style={{ padding: '10px 14px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8125rem', border: '1px solid var(--border-default)' }}>Secondary</button>
          <input placeholder="Search stakeholders…" className="msit-input" />
          <div className="flex flex-wrap gap-1.5">
            <Chip bg="var(--quadrant-ally-bg)" color="var(--quadrant-ally-text)">Strategic ally</Chip>
            <Chip bg="var(--quadrant-hidden-bg)" color="var(--quadrant-hidden-text)">Hidden champion</Chip>
            <Chip bg="var(--quadrant-monitor-bg)" color="var(--quadrant-monitor-text)">Monitor</Chip>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl p-4 card-hover" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between">
            <span className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>Hon. A. Mwangi</span>
            <span className="px-2 py-0.5 rounded" style={{ background: 'var(--brand-primary)', color: 'white', fontSize: '0.6875rem', fontWeight: 700 }}>86</span>
          </div>
          <div className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Chair, Energy Committee</div>
          <div className="mt-3 space-y-1.5">
            <PreviewMeter label="Influence" pct={84} />
            <PreviewMeter label="Relationship" pct={67} />
            <PreviewMeter label="Sentiment" pct={72} />
          </div>
        </div>

        {/* Mini chart */}
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
          <div className="text-label mb-3" style={{ fontSize: '0.5625rem' }}>SIS trend</div>
          <div className="flex items-end gap-1.5" style={{ height: 90 }}>
            {bars.map((b, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${b}%`, background: i === 3 ? 'var(--brand-primary)' : 'var(--brand-primary-light)', opacity: i === 3 ? 1 : 0.55 }} />
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.625rem' }}>
            <span>Nov</span><span>Apr</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewMeter({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between" style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
        <span>{label}</span><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{pct}</span>
      </div>
      <div className="h-1.5 rounded-full mt-0.5" style={{ background: 'var(--bg-inset)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--gradient-brand)' }} />
      </div>
    </div>
  );
}

function Chip({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return <span className="px-2 py-0.5 rounded" style={{ background: bg, color, fontSize: '0.625rem', fontWeight: 700 }}>{children}</span>;
}

function ColorRow({ control, value, onChange }: { control: ColorControl; value: string; onChange: (hex: string) => void }) {
  const safe = /^#([0-9a-fA-F]{6})$/.test(value) ? value : '#000000';
  return (
    <div className="flex items-center gap-3">
      <label className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 cursor-pointer" style={{ background: safe, border: '1px solid var(--border-strong)' }}>
        <input type="color" value={safe} onChange={(e) => onChange(e.target.value.toUpperCase())} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={control.label} />
      </label>
      <div className="min-w-0 flex-1">
        <div className="text-body-sm" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8125rem' }}>{control.label}</div>
        {control.hint && <div style={{ color: 'var(--text-muted)', fontSize: '0.625rem' }}>{control.hint}</div>}
      </div>
      <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{safe}</span>
    </div>
  );
}

function FontSelect({ label, value, onChange, previewWeight }: { label: string; value: string; onChange: (v: string) => void; previewWeight: number }) {
  return (
    <div>
      <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {FONT_OPTIONS.map(f => {
          const on = f.value === value;
          return (
            <button
              key={f.label}
              onClick={() => onChange(f.value)}
              className="rounded-lg px-2 py-2.5 text-center transition-colors"
              style={{ background: on ? 'var(--brand-primary-bg)' : 'var(--bg-secondary)', border: `1px solid ${on ? 'var(--brand-primary)' : 'var(--border-default)'}` }}
            >
              <div style={{ fontFamily: f.value, fontWeight: previewWeight, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{f.sample}</div>
              <div style={{ fontSize: '0.5625rem', color: on ? 'var(--brand-primary-dark)' : 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{f.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={16} style={{ color: 'var(--text-muted)' }} />
      <div>
        <h2 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        <p className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{subtitle}</p>
      </div>
    </div>
  );
}
