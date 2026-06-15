import { useMemo, useState } from 'react';
import {
  Plus, X, Megaphone, MapPin, Calendar, Users as UsersIcon, ArrowRight,
  CheckCircle2, Circle, Sparkles,
} from 'lucide-react';
import { useAppStore, useCurrentRole } from '../lib/store';
import { Card } from '../components/ui/Badges';
import { CAMPAIGN_STATUS_LABELS } from '../lib/types';
import type { Campaign } from '../lib/types';
import { formatDate, daysUntil } from '../lib/formatters';

const ACCENTS = ['#2DA67E', '#2563EB', '#C4956A', '#7C3AED', '#0EA5E9', '#D97706', '#DB2777'];
const POLICY_DOMAINS = ['Energy & Climate', 'Health & Technology', 'Housing & Finance', 'Education', 'Environment & Water', 'Agriculture', 'Trade & Industry', 'Governance & Justice'];

function statusColor(status: Campaign['status']): { bg: string; text: string } {
  switch (status) {
    case 'active': return { bg: 'rgba(45,166,126,0.12)', text: '#1F7A5C' };
    case 'completed': return { bg: 'rgba(100,116,139,0.14)', text: '#475569' };
    case 'archived': return { bg: 'rgba(100,116,139,0.1)', text: '#64748B' };
    case 'draft': return { bg: 'rgba(217,119,6,0.12)', text: '#B45309' };
  }
}

export default function Campaigns() {
  const campaigns = useAppStore(s => s.campaigns);
  const storeStakeholders = useAppStore(s => s.storeStakeholders);
  const currentUserId = useAppStore(s => s.currentUserId);
  const setCampaign = useAppStore(s => s.setCampaign);
  const setPage = useAppStore(s => s.setPage);
  const role = useCurrentRole();
  const [creating, setCreating] = useState(false);

  const canCreate = role === 'lead' || role === 'partner' || role === 'admin';

  // Per-campaign stakeholder counts, excluding partner-restricted VIPs the
  // current user does not own.
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of storeStakeholders) {
      if (s.vip_owner_id && s.vip_owner_id !== currentUserId) continue;
      map[s.campaign_id] = (map[s.campaign_id] ?? 0) + 1;
    }
    return map;
  }, [storeStakeholders, currentUserId]);

  const active = campaigns.filter(c => c.status === 'active' || c.status === 'draft');
  const past = campaigns.filter(c => c.status === 'completed' || c.status === 'archived');

  const open = (c: Campaign) => { setCampaign(c.id); setPage('dashboard'); };

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md" style={{ color: 'var(--text-primary)' }}>Campaigns</h1>
          <p className="text-body-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Every policy initiative the team is advocating for. Switch a campaign to load its stakeholder portfolio.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 rounded-lg btn-press"
            style={{ padding: '9px 16px', background: 'var(--gradient-brand)', color: 'white', fontWeight: 600, fontSize: '0.875rem', boxShadow: 'var(--shadow-brand)' }}
          >
            <Plus size={16} /> New Campaign
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Campaigns" value={campaigns.length} />
        <StatCard label="Active" value={campaigns.filter(c => c.status === 'active').length} color="var(--brand-primary)" />
        <StatCard label="Completed" value={campaigns.filter(c => c.status === 'completed').length} color="#475569" />
        <StatCard label="Stakeholders Tracked" value={Object.values(counts).reduce((a, b) => a + b, 0)} />
      </div>

      <div>
        <h2 className="text-heading-md mb-3" style={{ color: 'var(--text-primary)' }}>Active & Upcoming</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {active.map(c => <CampaignCard key={c.id} c={c} count={counts[c.id] ?? 0} onOpen={() => open(c)} />)}
        </div>
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="text-heading-md mb-3" style={{ color: 'var(--text-primary)' }}>Past Campaigns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {past.map(c => <CampaignCard key={c.id} c={c} count={counts[c.id] ?? 0} onOpen={() => open(c)} />)}
          </div>
        </div>
      )}

      {creating && <CreateCampaignModal onClose={() => setCreating(false)} />}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Card>
      <div className="text-label mb-2">{label}</div>
      <div className="text-metric-sm" style={{ color: color ?? 'var(--text-primary)' }}>{value}</div>
    </Card>
  );
}

function CampaignCard({ c, count, onOpen }: { c: Campaign; count: number; onOpen: () => void }) {
  const sc = statusColor(c.status);
  const days = daysUntil(c.target_date);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      className="rounded-xl overflow-hidden cursor-pointer transition-all duration-150 hover:-translate-y-0.5 card-hover"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div style={{ height: 4, background: c.accent }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${c.accent}1A`, color: c.accent }}>
            <Megaphone size={18} />
          </div>
          <span className="px-2 py-0.5 rounded-md" style={{ background: sc.bg, color: sc.text, fontSize: '0.6875rem', fontWeight: 600 }}>
            {CAMPAIGN_STATUS_LABELS[c.status]}
          </span>
        </div>
        <h3 className="text-heading-md mt-3" style={{ color: 'var(--text-primary)', lineHeight: 1.25 }}>{c.name}</h3>
        <p className="text-body-sm mt-1.5" style={{ color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {c.description}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1.5"><MapPin size={13} style={{ color: 'var(--text-muted)' }} /> {c.region}</span>
          <span className="flex items-center gap-1.5"><UsersIcon size={13} style={{ color: 'var(--text-muted)' }} /> {count} stakeholders</span>
          <span className="flex items-center gap-1.5"><Calendar size={13} style={{ color: 'var(--text-muted)' }} /> {formatDate(c.target_date)}</span>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.75rem', color: c.status === 'completed' ? 'var(--text-muted)' : days < 90 ? 'var(--status-warning)' : 'var(--text-muted)' }}>
            {c.status === 'completed' ? 'Concluded' : days > 0 ? `${days} days remaining` : 'Past target date'}
          </span>
          <span className="flex items-center gap-1" style={{ color: 'var(--accent-primary)', fontSize: '0.8125rem', fontWeight: 600 }}>
            Open <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}

function CreateCampaignModal({ onClose }: { onClose: () => void }) {
  const addCampaign = useAppStore(s => s.addCampaign);
  const setCampaign = useAppStore(s => s.setCampaign);
  const setPage = useAppStore(s => s.setPage);
  const addToast = useAppStore(s => s.addToast);
  const campaigns = useAppStore(s => s.campaigns);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState(POLICY_DOMAINS[0]);
  const [region, setRegion] = useState('Kenya');
  const [targetDate, setTargetDate] = useState('');
  const [accent, setAccent] = useState(ACCENTS[1]);
  const [status, setStatus] = useState<Campaign['status']>('active');
  const [created, setCreated] = useState<string | null>(null);

  const canNext1 = name.trim() && shortName.trim();
  const canSubmit = canNext1 && targetDate;

  const submit = () => {
    const id = `o-${String(campaigns.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
    const campaign: Campaign = {
      id, country_id: 'c-001', name: name.trim(), short_name: shortName.trim(),
      description: description.trim() || 'No description provided yet.',
      policy_domain: domain, region, target_date: targetDate, status,
      created_at: new Date().toISOString().slice(0, 10), accent, lead_user_id: 'u-002',
    };
    addCampaign(campaign);
    setCreated(id);
    addToast('Campaign created', 'success');
  };

  const goAddStakeholders = () => {
    if (created) setCampaign(created);
    onClose();
    setPage('add-stakeholder');
  };
  const goDashboard = () => {
    if (created) setCampaign(created);
    onClose();
    setPage('dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 modal-backdrop" style={{ background: 'rgba(15,30,41,0.45)' }} onClick={onClose} />
      <div className="modal-content relative w-full rounded-2xl overflow-hidden" style={{ maxWidth: 560, background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-xl)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(45,166,126,0.12)', color: 'var(--brand-primary)' }}>
              <Megaphone size={16} />
            </div>
            <div>
              <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{created ? 'Campaign created' : 'New Campaign'}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{created ? 'Set up complete' : `Step ${step} of 2`}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>

        <div className="p-6">
          {created ? (
            <div className="text-center py-4">
              <div className="success-pop w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ background: 'rgba(45,166,126,0.12)', color: 'var(--brand-primary)' }}>
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-heading-md mt-3" style={{ color: 'var(--text-primary)' }}>{name}</h3>
              <p className="text-body-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                The campaign is live. Add stakeholders now or jump to its dashboard.
              </p>
              <div className="flex items-center justify-center gap-3 mt-5">
                <button onClick={goAddStakeholders} className="flex items-center gap-2 rounded-lg btn-press" style={{ padding: '9px 16px', background: 'var(--gradient-brand)', color: 'white', fontWeight: 600, fontSize: '0.8125rem' }}>
                  <Plus size={15} /> Add stakeholders
                </button>
                <button onClick={goDashboard} className="rounded-lg" style={{ padding: '9px 16px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  Go to dashboard
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            <div className="space-y-4">
              <Field label="Campaign name">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Digital Identity Reform Bill 2026" className="msit-input" />
              </Field>
              <Field label="Short name (shown in switcher)">
                <input value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="e.g. Digital Identity" className="msit-input" />
              </Field>
              <Field label="Description">
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What is this campaign advocating for?" className="msit-input" style={{ resize: 'none' }} />
              </Field>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={onClose} className="rounded-lg" style={{ padding: '9px 16px', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}>Cancel</button>
                <button disabled={!canNext1} onClick={() => setStep(2)} className="rounded-lg btn-press" style={{ padding: '9px 18px', background: canNext1 ? 'var(--gradient-brand)' : 'var(--bg-inset)', color: canNext1 ? 'white' : 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>Continue</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Policy domain">
                  <select value={domain} onChange={(e) => setDomain(e.target.value)} className="msit-input">
                    {POLICY_DOMAINS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Region">
                  <input value={region} onChange={(e) => setRegion(e.target.value)} className="msit-input" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Target date">
                  <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="msit-input" />
                </Field>
                <Field label="Status">
                  <select value={status} onChange={(e) => setStatus(e.target.value as Campaign['status'])} className="msit-input">
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </Field>
              </div>
              <Field label="Accent colour">
                <div className="flex items-center gap-2">
                  {ACCENTS.map(a => (
                    <button key={a} onClick={() => setAccent(a)} aria-label={a} className="w-7 h-7 rounded-full flex items-center justify-center transition-transform" style={{ background: a, transform: accent === a ? 'scale(1.15)' : 'scale(1)', boxShadow: accent === a ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${a}` : 'none' }}>
                      {accent === a && <Circle size={8} style={{ fill: 'white', color: 'white' }} />}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="rounded-lg p-3 flex items-start gap-2" style={{ background: 'rgba(45,166,126,0.06)', border: '1px solid rgba(45,166,126,0.18)' }}>
                <Sparkles size={15} style={{ color: 'var(--brand-primary)', marginTop: 1 }} />
                <p className="text-body-sm" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  After creating, you can add stakeholders, score them, and the quadrant map populates automatically for this campaign.
                </p>
              </div>
              <div className="flex justify-between gap-3 pt-2">
                <button onClick={() => setStep(1)} className="rounded-lg" style={{ padding: '9px 16px', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}>Back</button>
                <button disabled={!canSubmit} onClick={submit} className="rounded-lg btn-press" style={{ padding: '9px 18px', background: canSubmit ? 'var(--gradient-brand)' : 'var(--bg-inset)', color: canSubmit ? 'white' : 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>Create campaign</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
