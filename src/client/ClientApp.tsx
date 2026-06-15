import { useMemo, useState } from 'react';
import {
  LogOut, MapPin, Calendar, Sparkles, ArrowRight, X, Send, ShieldCheck,
  Clock, Target, Users as UsersIcon, Star, Building2,
} from 'lucide-react';
import { useAppStore, useCurrentUser } from '../lib/store';
import { QUADRANT_COLORS, QUADRANT_LABELS, SECTOR_LABELS } from '../lib/types';
import type { Quadrant, StakeholderWithScore } from '../lib/types';
import { formatDate, formatSIS, daysUntil } from '../lib/formatters';
import Portrait from '../components/ui/Portrait';

const QUADRANT_WHY: Record<Quadrant, string> = {
  strategic_ally: 'A committed supporter with real influence — a natural champion for your cause.',
  power_gap: 'Highly influential but not yet on side — a high-value conversion opportunity.',
  hidden_champion: 'Strongly supportive and ready to advocate — amplify their voice.',
  monitor_exit: 'Lower priority right now — worth monitoring as the campaign evolves.',
};

export default function ClientApp() {
  const me = useCurrentUser();
  const logout = useAppStore(s => s.logout);
  const addToast = useAppStore(s => s.addToast);
  const clients = useAppStore(s => s.clients);
  const campaigns = useAppStore(s => s.campaigns);
  const storeStakeholders = useAppStore(s => s.storeStakeholders);
  const snapshots = useAppStore(s => s.snapshots);
  const engagements = useAppStore(s => s.engagements);

  const [selected, setSelected] = useState<string | null>(null);

  const client = useMemo(
    () => clients.find(c => c.email.toLowerCase() === me?.email.toLowerCase()) ?? clients.find(c => c.status === 'approved') ?? null,
    [clients, me]
  );
  const campaign = useMemo(() => campaigns.find(c => c.id === client?.campaign_id) ?? null, [campaigns, client]);

  const curated: StakeholderWithScore[] = useMemo(() => {
    if (!client) return [];
    return client.curated_stakeholder_ids
      .map(id => storeStakeholders.find(s => s.id === id))
      // Never expose partner-restricted VIP contacts to a client, even if curated.
      .filter((s): s is NonNullable<typeof s> => Boolean(s) && !s!.vip_owner_id)
      .map(s => {
        const snap = snapshots
          .filter(sn => sn.stakeholder_id === s.id)
          .sort((a, b) => new Date(b.scored_at).getTime() - new Date(a.scored_at).getTime())[0] ?? null;
        const engs = engagements.filter(e => e.stakeholder_id === s.id);
        return {
          ...s, latestSnapshot: snap, engagementCount: engs.length,
          lastEngagementDate: engs.length ? engs[0].date : null, redFlags: [],
        };
      })
      .sort((a, b) => (b.latestSnapshot?.sis_score ?? 0) - (a.latestSnapshot?.sis_score ?? 0));
  }, [client, storeStakeholders, snapshots, engagements]);

  const kpis = useMemo(() => {
    const scored = curated.filter(s => s.latestSnapshot);
    const avg = scored.length ? scored.reduce((a, s) => a + (s.latestSnapshot?.sis_score ?? 0), 0) / scored.length : 0;
    const allies = curated.filter(s => s.latestSnapshot?.quadrant === 'strategic_ally').length;
    const champions = curated.filter(s => s.latestSnapshot?.quadrant === 'hidden_champion').length;
    const gaps = curated.filter(s => s.latestSnapshot?.quadrant === 'power_gap').length;
    return { avg, allies, champions, gaps, total: curated.length };
  }, [curated]);

  const detail = curated.find(s => s.id === selected) ?? null;

  if (!client || client.status !== 'approved' || !campaign) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center max-w-md">
          <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ background: 'rgba(217,119,6,0.12)', color: '#B45309' }}><Clock size={28} /></div>
          <h1 className="text-heading-lg mt-4" style={{ color: 'var(--text-primary)' }}>Your access is being prepared</h1>
          <p className="text-body-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Your curated workspace is pending final approval from the Momentum partner team. You'll be notified as soon as it's live.
          </p>
          <button onClick={logout} className="mt-5 rounded-lg" style={{ padding: '9px 18px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-brand)' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '0.8125rem' }}>M</span>
          </div>
          <div className="leading-tight">
            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.875rem' }}>Momentum Intel · Client Portal</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Curated stakeholder intelligence</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div style={{ color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 600 }}>{client.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{client.organization}</div>
          </div>
          <Portrait name={client.name} gender={client.gender} portraitUrl={client.portrait_url} size={36} />
          <button onClick={() => { logout(); addToast('Signed out', 'success'); }} aria-label="Sign out" className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="px-6 py-6 mx-auto" style={{ maxWidth: 1180 }}>
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl mb-6" style={{ background: 'var(--gradient-brand-hero)', boxShadow: 'var(--shadow-lg)' }}>
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(45,166,126,0.7) 0%, transparent 70%)' }} />
          <div className="relative p-7 md:p-9">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', color: '#86EFAC', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.08em' }}>CURATED FOR YOU</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.625rem', letterSpacing: '0.06em' }}>{campaign.policy_domain}</span>
            </div>
            <h1 className="font-display" style={{ color: 'white', fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{campaign.name}</h1>
            <p className="text-body-sm mt-2 max-w-2xl" style={{ color: 'rgba(255,255,255,0.78)', lineHeight: 1.55 }}>{client.brief}</p>
            <div className="flex flex-wrap items-center gap-4 mt-5" style={{ color: 'rgba(255,255,255,0.85)' }}>
              <span className="flex items-center gap-2 text-body-sm"><MapPin size={14} style={{ color: 'var(--brand-accent)' }} /> {campaign.region}</span>
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
              <span className="flex items-center gap-2 text-body-sm"><Calendar size={14} style={{ color: 'var(--brand-accent)' }} /> Target {formatDate(campaign.target_date)}</span>
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
              <span className="flex items-center gap-2 text-body-sm"><Clock size={14} style={{ color: 'var(--brand-accent)' }} /> {daysUntil(campaign.target_date)} days remaining</span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={<UsersIcon size={16} />} label="Stakeholders shared" value={kpis.total} />
          <KpiCard icon={<Star size={16} />} label="Strategic allies" value={kpis.allies} color="var(--quadrant-ally)" />
          <KpiCard icon={<Sparkles size={16} />} label="Hidden champions" value={kpis.champions} color="#7C3AED" />
          <KpiCard icon={<Target size={16} />} label="Avg. intelligence score" value={formatSIS(kpis.avg)} />
        </div>

        {/* Curated list */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>Recommended stakeholders to engage</h2>
          <span className="text-body-sm" style={{ color: 'var(--text-muted)' }}>Ranked by engagement priority</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {curated.map(s => {
            const q = s.latestSnapshot?.quadrant;
            const colors = q ? QUADRANT_COLORS[q] : null;
            return (
              <div key={s.id} className="rounded-xl overflow-hidden card-hover" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <Portrait name={s.full_name} gender={s.gender} portraitUrl={s.portrait_url} size={48} />
                    <div className="flex-1 min-w-0">
                      <div className="text-heading-sm truncate" style={{ color: 'var(--text-primary)' }}>{s.full_name}</div>
                      <div className="text-body-sm truncate" style={{ color: 'var(--text-muted)' }}>{s.title}</div>
                      <div className="text-body-sm truncate" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.organization}</div>
                    </div>
                  </div>
                  {q && colors && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-2 py-0.5 rounded" style={{ background: colors.bg, color: colors.text, fontSize: '0.6875rem', fontWeight: 600 }}>{QUADRANT_LABELS[q]}</span>
                      <span className="ml-auto font-display" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{formatSIS(s.latestSnapshot?.sis_score ?? 0)}</span>
                    </div>
                  )}
                  <p className="text-body-sm mt-3" style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.5 }}>{q ? QUADRANT_WHY[q] : ''}</p>
                  <div className="flex items-center gap-2 mt-4">
                    {client.access_level === 'detailed' && (
                      <button onClick={() => setSelected(s.id)} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg" style={{ padding: '7px 12px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>
                        View profile
                      </button>
                    )}
                    <button onClick={() => addToast(`Introduction requested for ${s.full_name}`, 'success')} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg btn-press" style={{ padding: '7px 12px', background: 'var(--gradient-brand)', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>
                      <Send size={13} /> Request intro
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 justify-center mt-8 text-body-sm" style={{ color: 'var(--text-muted)' }}>
          <ShieldCheck size={14} style={{ color: 'var(--brand-primary)' }} />
          This view is curated by your Momentum engagement team. Contact them to expand your access.
        </div>
      </main>

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0" style={{ background: 'rgba(15,30,41,0.45)' }} onClick={() => setSelected(null)} />
          <div className="relative h-full overflow-y-auto" style={{ width: 'min(440px, 100%)', background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-xl)', animation: 'slideInRight 0.25s ease' }}>
            <div className="sticky top-0 flex items-center justify-between px-5 py-4" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>Stakeholder profile</span>
              <button onClick={() => setSelected(null)} aria-label="Close"><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <Portrait name={detail.full_name} gender={detail.gender} portraitUrl={detail.portrait_url} size={56} />
                <div>
                  <div className="text-heading-md" style={{ color: 'var(--text-primary)' }}>{detail.full_name}</div>
                  <div className="text-body-sm" style={{ color: 'var(--text-muted)' }}>{detail.title}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5">
                <DrawerMeta icon={<Building2 size={14} />} label="Organization" value={detail.organization} />
                <DrawerMeta icon={<Target size={14} />} label="Sector" value={SECTOR_LABELS[detail.sector]} />
              </div>
              {detail.latestSnapshot && (
                <div className="rounded-xl p-4 mt-4" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-label">Intelligence score</span>
                    <span className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>{formatSIS(detail.latestSnapshot.sis_score)}</span>
                  </div>
                  <div className="mt-2">
                    <span className="px-2 py-0.5 rounded" style={{ background: QUADRANT_COLORS[detail.latestSnapshot.quadrant].bg, color: QUADRANT_COLORS[detail.latestSnapshot.quadrant].text, fontSize: '0.6875rem', fontWeight: 600 }}>
                      {QUADRANT_LABELS[detail.latestSnapshot.quadrant]}
                    </span>
                  </div>
                  <p className="text-body-sm mt-3" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{QUADRANT_WHY[detail.latestSnapshot.quadrant]}</p>
                </div>
              )}
              <button onClick={() => addToast(`Introduction requested for ${detail.full_name}`, 'success')} className="w-full flex items-center justify-center gap-2 rounded-lg btn-press mt-4" style={{ padding: '10px 16px', background: 'var(--gradient-brand)', color: 'white', fontSize: '0.8125rem', fontWeight: 600 }}>
                <Send size={15} /> Request an introduction <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>{icon}<span className="text-label" style={{ fontSize: '0.5625rem' }}>{label}</span></div>
      <div className="font-display mt-2" style={{ fontSize: '1.75rem', color: color ?? 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function DrawerMeta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--bg-secondary)' }}>
      <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>{icon}<span className="text-label" style={{ fontSize: '0.5rem' }}>{label}</span></div>
      <div className="text-body-sm mt-1" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</div>
    </div>
  );
}
