import { useMemo, useState, useRef, useEffect } from 'react';
import {
  LogOut, MapPin, Calendar, Sparkles, ArrowRight, X, Send, ShieldCheck,
  Clock, Target, Users as UsersIcon, Star, Building2, LayoutGrid, Share2,
  MessageSquare, ChevronLeft, ChevronRight, CalendarPlus, Handshake, CheckCircle2,
  Briefcase, Gauge, Layers, Compass, TrendingUp, Activity, Phone, Mail, CalendarDays,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from 'recharts';
import { useAppStore, useCurrentUser } from '../lib/store';
import { QUADRANT_COLORS, QUADRANT_LABELS, SECTOR_LABELS, COMPONENT_DESCRIPTIONS } from '../lib/types';
import type { Quadrant, StakeholderWithScore, ClientRequest, EngagementRecord } from '../lib/types';
import { formatDate, formatSIS, daysUntil, formatRelativeDate, formatLayer, formatAxis } from '../lib/formatters';
import Portrait from '../components/ui/Portrait';
import RelationshipNetwork from '../components/RelationshipNetwork';
import EgoNetwork from '../components/EgoNetwork';

const QUADRANT_WHY: Record<Quadrant, string> = {
  strategic_ally: 'A committed supporter with real influence — a natural champion for your cause.',
  power_gap: 'Highly influential but not yet on side — a high-value conversion opportunity.',
  hidden_champion: 'Strongly supportive and ready to advocate — amplify their voice.',
  monitor_exit: 'Lower priority right now — worth monitoring as the focal point evolves.',
};

// Monotonic id generator — avoids impure Date.now() calls inside render scope.
let _seq = 0;
const seqId = (prefix: string) => `${prefix}-${++_seq}`;

type ClientTab = 'overview' | 'network' | 'engage' | 'assistant';

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
  const [tab, setTab] = useState<ClientTab>('overview');
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<StakeholderWithScore | null>(null);

  const client = useMemo(
    () => clients.find(c => c.email.toLowerCase() === me?.email.toLowerCase()) ?? clients.find(c => c.status === 'approved') ?? null,
    [clients, me]
  );

  // A client can hold multiple focal points; they scroll between them.
  const clientCampaigns = useMemo(
    () => (client?.campaign_ids ?? []).map(id => campaigns.find(c => c.id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [client, campaigns]
  );
  const campaign = useMemo(
    () => clientCampaigns.find(c => c.id === activeCampaignId) ?? clientCampaigns[0] ?? null,
    [clientCampaigns, activeCampaignId]
  );

  // Curated stakeholders scoped to the active focal point (and never VIPs).
  const curated: StakeholderWithScore[] = useMemo(() => {
    if (!client || !campaign) return [];
    return client.curated_stakeholder_ids
      .map(id => storeStakeholders.find(s => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s) && !s!.vip_owner_id && s!.campaign_id === campaign.id)
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
  }, [client, campaign, storeStakeholders, snapshots, engagements]);

  const kpis = useMemo(() => {
    const scored = curated.filter(s => s.latestSnapshot);
    const avg = scored.length ? scored.reduce((a, s) => a + (s.latestSnapshot?.sis_score ?? 0), 0) / scored.length : 0;
    const allies = curated.filter(s => s.latestSnapshot?.quadrant === 'strategic_ally').length;
    const champions = curated.filter(s => s.latestSnapshot?.quadrant === 'hidden_champion').length;
    const gaps = curated.filter(s => s.latestSnapshot?.quadrant === 'power_gap').length;
    return { avg, allies, champions, gaps, total: curated.length };
  }, [curated]);

  const cycleCampaign = (dir: 1 | -1) => {
    if (clientCampaigns.length < 2 || !campaign) return;
    const idx = clientCampaigns.findIndex(c => c.id === campaign.id);
    const next = (idx + dir + clientCampaigns.length) % clientCampaigns.length;
    setActiveCampaignId(clientCampaigns[next].id);
    setSelected(null);
  };

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
          <img src="/momentum-logo.png" alt="Momentum Africa Partners" className="h-8 w-auto object-contain" />
          <div className="leading-tight pl-3" style={{ borderLeft: '1px solid var(--border-default)' }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.875rem' }}>Client Portal</div>
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
        {/* Focal point switcher — scroll across the client's focal points */}
        {clientCampaigns.length > 0 && (
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-label" style={{ fontSize: '0.625rem' }}>Your focal points</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {clientCampaigns.map(c => {
                  const on = c.id === campaign.id;
                  return (
                    <button key={c.id} onClick={() => { setActiveCampaignId(c.id); setSelected(null); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                      style={{ background: on ? c.accent : 'var(--bg-elevated)', color: on ? 'white' : 'var(--text-secondary)', border: `1px solid ${on ? c.accent : 'var(--border-default)'}`, fontSize: '0.75rem', fontWeight: 600 }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: on ? 'rgba(255,255,255,0.9)' : c.accent }} />
                      {c.short_name}
                    </button>
                  );
                })}
              </div>
            </div>
            {clientCampaigns.length > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => cycleCampaign(-1)} aria-label="Previous focal point" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}><ChevronLeft size={16} /></button>
                <button onClick={() => cycleCampaign(1)} aria-label="Next focal point" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        )}

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl mb-6" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${campaign.accent || 'var(--brand-primary)'} 16%, #0A1722) 0%, color-mix(in srgb, ${campaign.accent || 'var(--brand-primary)'} 30%, #0A1722) 48%, color-mix(in srgb, ${campaign.accent || 'var(--brand-primary)'} 58%, #0A1722) 100%)`, boxShadow: 'var(--shadow-lg)' }}>
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle, color-mix(in srgb, ${campaign.accent || 'var(--brand-primary)'} 70%, transparent) 0%, transparent 70%)` }} />
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

        {/* Nav tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
          {([
            { id: 'overview', label: 'Overview', icon: LayoutGrid },
            { id: 'network', label: 'Relationship Map', icon: Share2 },
            { id: 'engage', label: 'Engagements', icon: Handshake },
            { id: 'assistant', label: 'Assistant', icon: Sparkles },
          ] as { id: ClientTab; label: string; icon: typeof LayoutGrid }[]).map(t => {
            const on = tab === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all"
                style={{ background: on ? 'var(--gradient-brand)' : 'transparent', color: on ? 'white' : 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}>
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'overview' && (<>
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
                    <button onClick={() => setRequesting(s)} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg btn-press" style={{ padding: '7px 12px', background: 'var(--gradient-brand)', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>
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
        </>)}

        {/* Relationship map tab */}
        {tab === 'network' && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center justify-between mb-2 px-1">
              <div>
                <h2 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>How your stakeholders connect</h2>
                <p className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Explore the relationship network across your curated stakeholders. Click any node to open their profile and personal network.</p>
              </div>
            </div>
            {curated.filter(s => s.latestSnapshot).length > 0 ? (
              <RelationshipNetwork stakeholders={curated} onSelect={(id) => setSelected(id)} />
            ) : (
              <div className="py-16 text-center text-body-sm" style={{ color: 'var(--text-muted)' }}>No scored stakeholders to map for this focal point yet.</div>
            )}
          </div>
        )}

        {/* Engagements tab — what's possible + the client's requests */}
        {tab === 'engage' && (
          <ClientEngage
            client={client} curated={curated} campaignId={campaign.id}
            onRequest={(s) => setRequesting(s)}
          />
        )}

        {/* AI assistant tab */}
        {tab === 'assistant' && (
          <ClientChat curated={curated} campaignName={campaign.name} onSelect={(id) => setSelected(id)} onRequest={(s) => setRequesting(s)} />
        )}
      </main>

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0" style={{ background: 'rgba(15,30,41,0.45)' }} onClick={() => setSelected(null)} />
          <div className="relative h-full overflow-y-auto" style={{ width: 'min(560px, 100%)', background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-xl)', animation: 'slideInRight 0.25s ease' }}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>Stakeholder dossier</span>
              <button onClick={() => setSelected(null)} aria-label="Close"><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <StakeholderDossier
              detail={detail}
              engagements={engagements.filter(e => e.stakeholder_id === detail.id)}
              curated={curated}
              onSelect={(id) => setSelected(id)}
              onRequest={(s) => setRequesting(s)}
            />
          </div>
        </div>
      )}

      {/* Request engagement modal */}
      {requesting && (
        <ClientRequestModal
          stakeholder={requesting}
          clientId={client.id}
          campaignId={campaign.id}
          onClose={() => setRequesting(null)}
        />
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

const tierLabel = (v: number) => v >= 4.5 ? 'Dominant' : v >= 3.5 ? 'High' : v >= 2.5 ? 'Moderate' : v >= 1.5 ? 'Low' : 'Minimal';

// Client-friendly interpretation of each scoring component. `invert` marks
// components where a higher value is less favourable (risk).
const CLIENT_COMPONENTS = [
  { key: 'influence_score', label: 'Influence', desc: COMPONENT_DESCRIPTIONS.influence, invert: false },
  { key: 'relationship_score', label: 'Relationship', desc: COMPONENT_DESCRIPTIONS.relationship, invert: false },
  { key: 'sentiment_score', label: 'Sentiment', desc: COMPONENT_DESCRIPTIONS.sentiment, invert: false },
  { key: 'alignment_score', label: 'Alignment', desc: COMPONENT_DESCRIPTIONS.alignment, invert: false },
  { key: 'impact_score', label: 'Strategic impact', desc: COMPONENT_DESCRIPTIONS.impact, invert: false },
  { key: 'risk_score', label: 'Risk', desc: COMPONENT_DESCRIPTIONS.risk, invert: true },
] as const;

const ENG_ICON: Record<EngagementRecord['engagement_type'], React.ReactNode> = {
  meeting: <UsersIcon size={13} />, phone_call: <Phone size={13} />, email: <Mail size={13} />,
  event: <CalendarDays size={13} />, social: <Share2 size={13} />, third_party_intro: <Handshake size={13} />,
  formal_submission: <Briefcase size={13} />,
};
const OUTCOME_STYLE: Record<EngagementRecord['outcome'], { label: string; bg: string; text: string }> = {
  positive: { label: 'Positive', bg: 'var(--quadrant-ally-bg)', text: 'var(--quadrant-ally-text)' },
  neutral: { label: 'Neutral', bg: 'rgba(100,116,139,0.12)', text: '#475569' },
  negative: { label: 'Negative', bg: 'rgba(220,38,38,0.1)', text: '#B91C1C' },
  pending: { label: 'Pending', bg: 'rgba(217,119,6,0.12)', text: '#B45309' },
};

function shortLast(full: string) {
  return full.replace(/^(Hon\.|Dr\.|Eng\.|Prof\.|Amb\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').split(' ').slice(-1)[0];
}

function buildNarrative(d: StakeholderWithScore): string {
  const snap = d.latestSnapshot;
  const name = shortLast(d.full_name);
  const sector = SECTOR_LABELS[d.sector];
  const circle = formatLayer(d.proximity_layer);
  let s = `${d.full_name} serves as ${d.title}${d.organization ? ` at ${d.organization}` : ''}, operating within the ${sector.toLowerCase()} sphere and sitting in your ${circle.toLowerCase()} circle of influence.`;
  if (snap) {
    s += ` With an intelligence score of ${formatSIS(snap.sis_score)}, ${name} is profiled as a ${QUADRANT_LABELS[snap.quadrant].toLowerCase()}: ${QUADRANT_WHY[snap.quadrant].toLowerCase()}`;
    const ranked = [...CLIENT_COMPONENTS]
      .filter(c => !c.invert)
      .map(c => ({ c, v: (snap[c.key as keyof typeof snap] as number) }))
      .sort((a, b) => b.v - a.v);
    if (ranked.length) {
      s += ` Their strongest lever is ${ranked[0].c.label.toLowerCase()} (${tierLabel(ranked[0].v).toLowerCase()}), while ${ranked[ranked.length - 1].c.label.toLowerCase()} is the area with the most room to develop.`;
    }
  }
  return s;
}

function StakeholderDossier({
  detail, engagements, curated, onSelect, onRequest,
}: {
  detail: StakeholderWithScore;
  engagements: EngagementRecord[];
  curated: StakeholderWithScore[];
  onSelect: (id: string) => void;
  onRequest: (s: StakeholderWithScore) => void;
}) {
  const snap = detail.latestSnapshot;
  const qc = snap ? QUADRANT_COLORS[snap.quadrant] : null;

  const radarData = snap ? [
    { component: 'Influence', value: snap.influence_score },
    { component: 'Relationship', value: snap.relationship_score },
    { component: 'Risk Adj.', value: snap.risk_adjusted },
    { component: 'Sentiment', value: snap.sentiment_score },
    { component: 'Alignment', value: snap.alignment_score },
    { component: 'Impact', value: snap.impact_score },
  ] : [];

  const engs = [...engagements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const outcomes = {
    positive: engs.filter(e => e.outcome === 'positive').length,
    neutral: engs.filter(e => e.outcome === 'neutral').length,
    negative: engs.filter(e => e.outcome === 'negative').length,
  };

  return (
    <div className="p-5 pb-8">
      {/* Identity */}
      <div className="flex items-start gap-3.5">
        <Portrait name={detail.full_name} gender={detail.gender} portraitUrl={detail.portrait_url} size={64} />
        <div className="min-w-0">
          <div className="text-heading-md" style={{ color: 'var(--text-primary)' }}>{detail.full_name}</div>
          <div className="text-body-sm" style={{ color: 'var(--text-muted)' }}>{detail.title}</div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.625rem', fontWeight: 600 }}>{SECTOR_LABELS[detail.sector]}</span>
            <span className="px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.625rem', fontWeight: 600 }}>
              <Layers size={10} /> {formatLayer(detail.proximity_layer)} circle
            </span>
          </div>
        </div>
      </div>

      {/* Profile narrative */}
      <div className="rounded-xl p-4 mt-4" style={{ background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Compass size={13} style={{ color: 'var(--brand-primary)' }} />
          <span className="text-label" style={{ fontSize: '0.5625rem' }}>Profile</span>
        </div>
        <p className="text-body-sm" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.55 }}>{buildNarrative(detail)}</p>
      </div>

      {/* Key facts */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <DrawerMeta icon={<Building2 size={14} />} label="Organization" value={detail.organization || '—'} />
        <DrawerMeta icon={<Target size={14} />} label="Sector / Industry" value={SECTOR_LABELS[detail.sector]} />
        {snap && <DrawerMeta icon={<Gauge size={14} />} label="Power axis" value={formatAxis(snap.power_axis)} />}
        {snap && <DrawerMeta icon={<TrendingUp size={14} />} label="Convertibility" value={formatAxis(snap.convertibility_axis)} />}
      </div>

      {/* Position / score */}
      {snap && qc && (
        <div className="rounded-xl p-4 mt-4" style={{ background: `linear-gradient(135deg, ${qc.bg}, var(--bg-secondary))`, border: `1px solid ${qc.text}22` }}>
          <div className="flex items-center justify-between">
            <span className="text-label">Intelligence score</span>
            <span className="font-display" style={{ fontSize: '1.875rem', color: 'var(--text-primary)' }}>{formatSIS(snap.sis_score)}</span>
          </div>
          <div className="mt-1">
            <span className="px-2 py-0.5 rounded" style={{ background: qc.bg, color: qc.text, fontSize: '0.6875rem', fontWeight: 700 }}>
              {QUADRANT_LABELS[snap.quadrant]}
            </span>
          </div>
          <p className="text-body-sm mt-2.5" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.5 }}>{QUADRANT_WHY[snap.quadrant]}</p>
        </div>
      )}

      {/* Influence profile: radar + interpreted bars */}
      {snap && (
        <div className="rounded-xl p-4 mt-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Activity size={13} style={{ color: 'var(--brand-primary)' }} />
            <span className="text-label" style={{ fontSize: '0.5625rem' }}>Influence profile</span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="var(--border-default)" />
              <PolarAngleAxis dataKey="component" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke={qc?.dot ?? 'var(--brand-primary)'} fill={qc?.dot ?? 'var(--brand-primary)'} fillOpacity={0.18} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="space-y-2.5 mt-1">
            {CLIENT_COMPONENTS.map(c => {
              const v = snap[c.key as keyof typeof snap] as number;
              const pct = (v / 5) * 100;
              const good = c.invert ? 5 - v : v;
              const barColor = good >= 3.5 ? 'var(--status-success)' : good >= 2.5 ? 'var(--status-warning)' : 'var(--status-danger)';
              return (
                <div key={c.key}>
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm" style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 600 }}>{c.label}</span>
                    <span className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{tierLabel(v)} · {v}/5</span>
                  </div>
                  <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                  <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.625rem', lineHeight: 1.4 }}>{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Engagement momentum */}
      <div className="rounded-xl p-4 mt-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Handshake size={13} style={{ color: 'var(--brand-primary)' }} />
          <span className="text-label" style={{ fontSize: '0.5625rem' }}>Engagement momentum</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--bg-secondary)' }}>
            <div className="font-display" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{engs.length}</div>
            <div className="text-label" style={{ fontSize: '0.5rem' }}>Touchpoints</div>
          </div>
          <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--bg-secondary)' }}>
            <div className="font-display" style={{ fontSize: '1.25rem', color: 'var(--quadrant-ally-text)' }}>{outcomes.positive}</div>
            <div className="text-label" style={{ fontSize: '0.5rem' }}>Positive</div>
          </div>
          <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-body-sm" style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: 4 }}>
              {engs[0] ? formatRelativeDate(engs[0].date) : '—'}
            </div>
            <div className="text-label" style={{ fontSize: '0.5rem' }}>Last contact</div>
          </div>
        </div>
        {engs.length === 0 ? (
          <p className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>No engagements logged yet. Request one below and the team will open the relationship.</p>
        ) : (
          <div className="space-y-1.5">
            {engs.slice(0, 4).map(e => {
              const os = OUTCOME_STYLE[e.outcome];
              return (
                <div key={e.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2" style={{ background: 'var(--bg-secondary)' }}>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--brand-primary-rgb),0.1)', color: 'var(--brand-primary)' }}>{ENG_ICON[e.engagement_type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-body-sm capitalize" style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 600 }}>{e.engagement_type.replace(/_/g, ' ')}</div>
                    <div className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.625rem' }}>{formatDate(e.date)}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded shrink-0" style={{ background: os.bg, color: os.text, fontSize: '0.5625rem', fontWeight: 700 }}>{os.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Network */}
      <div className="rounded-xl p-3 mt-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-1.5 mb-1 px-1">
          <Share2 size={13} style={{ color: 'var(--brand-primary)' }} />
          <span className="text-label" style={{ fontSize: '0.5625rem' }}>Their network</span>
        </div>
        <EgoNetwork focalId={detail.id} all={curated} onSelect={onSelect} height={360} showLegend nodeScale={1.35} fontScale={1.7} />
      </div>

      <button onClick={() => onRequest(detail)} className="w-full flex items-center justify-center gap-2 rounded-lg btn-press mt-5" style={{ padding: '12px 16px', background: 'var(--gradient-brand)', color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>
        <Send size={15} /> Request an engagement <ArrowRight size={15} />
      </button>
    </div>
  );
}

const REQUEST_TYPE_LABELS: Record<ClientRequest['request_type'], string> = {
  introduction: 'Introduction', meeting: 'Meeting', briefing: 'Briefing',
};
const REQUEST_STATUS_LABELS: Record<ClientRequest['status'], { label: string; bg: string; text: string }> = {
  requested: { label: 'Requested', bg: 'rgba(217,119,6,0.12)', text: '#B45309' },
  in_progress: { label: 'In progress', bg: 'rgba(37,99,235,0.1)', text: '#2563EB' },
  scheduled: { label: 'Scheduled', bg: 'var(--quadrant-ally-bg)', text: 'var(--quadrant-ally-text)' },
  declined: { label: 'Declined', bg: 'rgba(100,116,139,0.12)', text: '#475569' },
};

// Engagements tab: explains what the client can do and tracks their requests.
function ClientEngage({
  client, curated, campaignId, onRequest,
}: {
  client: { id: string }; curated: StakeholderWithScore[]; campaignId: string;
  onRequest: (s: StakeholderWithScore) => void;
}) {
  const clientRequests = useAppStore(s => s.clientRequests);
  const myRequests = clientRequests.filter(r => r.client_id === client.id && r.campaign_id === campaignId);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
        <h2 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>What you can request</h2>
        <p className="text-body-sm mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
          Your Momentum engagement team manages all direct outreach. From here you can ask for an introduction, a meeting, or a tailored briefing — the team coordinates and updates the status.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: <Handshake size={16} />, title: 'Request an introduction', body: 'We broker a warm introduction to a stakeholder on your behalf.' },
            { icon: <CalendarPlus size={16} />, title: 'Request a meeting', body: 'Propose a meeting; we coordinate scheduling and prep.' },
            { icon: <MessageSquare size={16} />, title: 'Request a briefing', body: 'Get a tailored intelligence briefing on a stakeholder or theme.' },
          ].map(c => (
            <div key={c.title} className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: 'rgba(var(--brand-primary-rgb),0.12)', color: 'var(--brand-primary)' }}>{c.icon}</div>
              <div className="text-heading-sm" style={{ color: 'var(--text-primary)', fontSize: '0.8125rem' }}>{c.title}</div>
              <div className="text-body-sm mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{c.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick request per stakeholder */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
        <h2 className="text-heading-md mb-3" style={{ color: 'var(--text-primary)' }}>Request engagement with a stakeholder</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {curated.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
              <Portrait name={s.full_name} gender={s.gender} portraitUrl={s.portrait_url} size={34} />
              <div className="flex-1 min-w-0">
                <div className="text-body-sm truncate" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.full_name}</div>
                <div className="text-body-sm truncate" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{s.organization}</div>
              </div>
              <button onClick={() => onRequest(s)} className="flex items-center gap-1 rounded-lg btn-press shrink-0" style={{ padding: '6px 11px', background: 'rgba(var(--brand-primary-rgb),0.1)', color: 'var(--brand-primary)', fontSize: '0.6875rem', fontWeight: 600 }}>
                <Send size={12} /> Request
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* My requests */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
        <h2 className="text-heading-md mb-3" style={{ color: 'var(--text-primary)' }}>Your requests ({myRequests.length})</h2>
        {myRequests.length === 0 ? (
          <div className="py-8 text-center text-body-sm" style={{ color: 'var(--text-muted)' }}>No requests yet. Use the buttons above to ask the team for an introduction, meeting or briefing.</div>
        ) : (
          <div className="space-y-2">
            {myRequests.map(r => {
              const st = curated.find(s => s.id === r.stakeholder_id);
              const ss = REQUEST_STATUS_LABELS[r.status];
              return (
                <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--brand-primary-rgb),0.12)', color: 'var(--brand-primary)' }}><Handshake size={15} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-body-sm" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{REQUEST_TYPE_LABELS[r.request_type]} · {st?.full_name ?? 'Stakeholder'}</span>
                      <span className="px-2 py-0.5 rounded" style={{ background: ss.bg, color: ss.text, fontSize: '0.5625rem', fontWeight: 700 }}>{ss.label}</span>
                    </div>
                    {r.note && <div className="text-body-sm mt-0.5" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{r.note}</div>}
                    <div className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                      Raised {formatRelativeDate(r.created_at)}{r.preferred_date ? ` · preferred ${formatDate(r.preferred_date)}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ClientRequestModal({
  stakeholder, clientId, campaignId, onClose,
}: {
  stakeholder: StakeholderWithScore; clientId: string; campaignId: string; onClose: () => void;
}) {
  const addClientRequest = useAppStore(s => s.addClientRequest);
  const addToast = useAppStore(s => s.addToast);
  const [type, setType] = useState<ClientRequest['request_type']>('introduction');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');

  const submit = () => {
    addClientRequest({
      id: seqId('req'), client_id: clientId, stakeholder_id: stakeholder.id, campaign_id: campaignId,
      request_type: type, note: note.trim(), preferred_date: date || null, status: 'requested',
      created_at: new Date().toISOString().slice(0, 10),
    });
    addToast(`${REQUEST_TYPE_LABELS[type]} requested for ${stakeholder.full_name}`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 modal-backdrop" style={{ background: 'rgba(15,30,41,0.5)' }} onClick={onClose} />
      <div className="modal-content relative w-full rounded-2xl overflow-hidden" style={{ maxWidth: 460, background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-xl)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <Portrait name={stakeholder.full_name} gender={stakeholder.gender} portraitUrl={stakeholder.portrait_url} size={36} />
            <div>
              <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>Request engagement</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{stakeholder.full_name} · {stakeholder.organization}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>What would you like?</label>
            <div className="flex gap-2">
              {(['introduction', 'meeting', 'briefing'] as ClientRequest['request_type'][]).map(t => (
                <button key={t} onClick={() => setType(t)} className="flex-1 px-3 py-2 rounded-lg transition-all" style={{ background: type === t ? 'var(--gradient-brand)' : 'var(--bg-inset)', color: type === t ? 'white' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {REQUEST_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Notes for the team</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Share context — what you hope to achieve, any timing constraints…" className="msit-input" style={{ resize: 'none' }} />
          </div>
          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Preferred date (optional)</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="msit-input" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} className="rounded-lg" style={{ padding: '9px 16px', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}>Cancel</button>
          <button onClick={submit} className="flex items-center gap-1.5 rounded-lg btn-press" style={{ padding: '9px 18px', background: 'var(--gradient-brand)', color: 'white', fontSize: '0.8125rem', fontWeight: 600 }}>
            <CheckCircle2 size={15} /> Send request
          </button>
        </div>
      </div>
    </div>
  );
}

// A lightweight client-facing assistant. Answers from the curated set only.
interface ClientMsg { id: string; role: 'user' | 'assistant'; content: string; refs?: string[] }

function ClientChat({
  curated, campaignName, onSelect, onRequest,
}: {
  curated: StakeholderWithScore[]; campaignName: string;
  onSelect: (id: string) => void; onRequest: (s: StakeholderWithScore) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ClientMsg[]>([{
    id: 'w', role: 'assistant',
    content: `Hi! I'm your Momentum assistant for "${campaignName}". I can summarise your ${curated.length} curated stakeholders, suggest who to prioritise, or help you request an engagement. What would you like?`,
  }]);
  const [input, setInput] = useState('');

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const allies = curated.filter(s => s.latestSnapshot?.quadrant === 'strategic_ally');
  const champions = curated.filter(s => s.latestSnapshot?.quadrant === 'hidden_champion');
  const gaps = curated.filter(s => s.latestSnapshot?.quadrant === 'power_gap');
  const top = [...curated].filter(s => s.latestSnapshot).sort((a, b) => (b.latestSnapshot!.sis_score) - (a.latestSnapshot!.sis_score));

  const answer = (q: string): ClientMsg => {
    const t = q.toLowerCase();
    if (t.includes('priorit') || t.includes('who') || t.includes('focus') || t.includes('start')) {
      const picks = top.slice(0, 3);
      return { id: seqId('a'), role: 'assistant', content: picks.length ? `I'd start with your highest-priority contacts: ${picks.map(s => s.full_name).join(', ')}. They combine the most influence and openness in this focal point. Tap a name to view their profile.` : 'No scored stakeholders here yet.', refs: picks.map(s => s.id) };
    }
    if (t.includes('all') && t.includes('ally') || t.includes(' allies') || t.includes('champion')) {
      return { id: seqId('a'), role: 'assistant', content: `You have ${allies.length} strategic allies and ${champions.length} hidden champions in this focal point. Allies are committed and influential; champions are supportive voices worth amplifying.`, refs: [...allies, ...champions].slice(0, 4).map(s => s.id) };
    }
    if (t.includes('gap') || t.includes('convert')) {
      return { id: seqId('a'), role: 'assistant', content: `There ${gaps.length === 1 ? 'is' : 'are'} ${gaps.length} power gap${gaps.length === 1 ? '' : 's'} — influential people not yet on side. These are your highest-leverage conversion targets; ask us for an introduction when you're ready.`, refs: gaps.slice(0, 3).map(s => s.id) };
    }
    if (t.includes('request') || t.includes('intro') || t.includes('meet') || t.includes('engage')) {
      return { id: seqId('a'), role: 'assistant', content: `Of course — I can raise a request with the engagement team. Open the Engagements tab, or tap a stakeholder below to request an introduction, meeting or briefing.`, refs: top.slice(0, 3).map(s => s.id) };
    }
    if (t.includes('score') || t.includes('sis')) {
      const avg = top.length ? top.reduce((a, s) => a + (s.latestSnapshot!.sis_score), 0) / top.length : 0;
      return { id: seqId('a'), role: 'assistant', content: `The average intelligence score across your curated stakeholders is ${formatSIS(avg)}. Higher scores mean greater influence and alignment with your goals.` };
    }
    return { id: seqId('a'), role: 'assistant', content: `Here's a quick read of this focal point: ${curated.length} stakeholders shared, ${allies.length} allies, ${champions.length} champions, ${gaps.length} power gaps. Ask me who to prioritise, about allies or power gaps, or to help request an engagement.`, refs: top.slice(0, 3).map(s => s.id) };
  };

  const send = (text: string) => {
    const trimmed = text.trim().slice(0, 400);
    if (!trimmed) return;
    const userMsg: ClientMsg = { id: seqId('u'), role: 'user', content: trimmed };
    const reply = answer(trimmed);
    setMessages(m => [...m, userMsg, reply]);
    setInput('');
  };

  const prompts = ['Who should I prioritise?', 'Show my power gaps', 'Help me request a meeting'];

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)', height: '70vh' }}>
      <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: 'var(--gradient-brand-hero)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-brand)' }}><Sparkles size={18} style={{ color: 'white' }} /></div>
        <div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '0.875rem' }}>Momentum Assistant</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.6875rem' }}>Answers from your curated portfolio</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%]">
              <div className="rounded-2xl px-3.5 py-2.5" style={{ background: m.role === 'user' ? 'var(--gradient-brand)' : 'var(--bg-secondary)', color: m.role === 'user' ? 'white' : 'var(--text-primary)', fontSize: '0.8125rem', lineHeight: 1.5, border: m.role === 'user' ? 'none' : '1px solid var(--border-subtle)' }}>
                {m.content}
              </div>
              {m.refs && m.refs.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {m.refs.map(id => {
                    const s = curated.find(x => x.id === id);
                    if (!s) return null;
                    return (
                      <div key={id} className="flex items-center gap-2 rounded-lg px-2.5 py-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                        <Portrait name={s.full_name} gender={s.gender} portraitUrl={s.portrait_url} size={26} />
                        <button onClick={() => onSelect(s.id)} className="flex-1 min-w-0 text-left">
                          <div className="text-body-sm truncate" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.75rem' }}>{s.full_name}</div>
                          <div className="text-body-sm truncate" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{s.organization}</div>
                        </button>
                        <button onClick={() => onRequest(s)} className="rounded-md shrink-0" style={{ padding: '4px 9px', background: 'rgba(var(--brand-primary-rgb),0.1)', color: 'var(--brand-primary)', fontSize: '0.625rem', fontWeight: 700 }}>Request</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {prompts.map(p => (
              <button key={p} onClick={() => send(p)} className="px-2.5 py-1.5 rounded-full" style={{ background: 'rgba(var(--brand-primary-rgb),0.06)', border: '1px solid rgba(var(--brand-primary-rgb),0.18)', color: 'var(--brand-primary-dark)', fontSize: '0.6875rem', fontWeight: 500 }}>{p}</button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-3" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your stakeholders…" maxLength={400} className="flex-1 bg-transparent outline-none text-body-sm" style={{ color: 'var(--text-primary)', fontSize: '0.8125rem' }} />
          <button type="submit" disabled={!input.trim()} className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: input.trim() ? 'var(--gradient-brand)' : 'var(--bg-inset)', color: input.trim() ? 'white' : 'var(--text-muted)' }}>
            <Send size={13} />
          </button>
        </div>
      </form>
    </div>
  );
}
