import { useMemo, useState } from 'react';
import {
  Plus, X, Briefcase, Building2, User as UserIcon, Check, Clock, Eye,
  CheckCircle2, ShieldAlert, Search, MapPin,
} from 'lucide-react';
import { useAppStore, useCurrentUser } from '../lib/store';
import { Card, EmptyState } from '../components/ui/Badges';
import { CLIENT_STATUS_LABELS, SECTOR_LABELS } from '../lib/types';
import type { Client } from '../lib/types';
import { COUNTRY_OPTIONS } from '../lib/locations';
import { formatDate } from '../lib/formatters';
import Portrait from '../components/ui/Portrait';

function statusStyle(status: Client['status']): { bg: string; text: string } {
  switch (status) {
    case 'approved': return { bg: 'rgba(45,166,126,0.12)', text: '#1F7A5C' };
    case 'pending_approval': return { bg: 'rgba(217,119,6,0.12)', text: '#B45309' };
    case 'rejected': return { bg: 'rgba(220,38,38,0.1)', text: '#B91C1C' };
    case 'suspended': return { bg: 'rgba(100,116,139,0.12)', text: '#475569' };
  }
}

export default function Clients() {
  const clients = useAppStore(s => s.clients);
  const campaigns = useAppStore(s => s.campaigns);
  const storeUsers = useAppStore(s => s.storeUsers);
  const approveClient = useAppStore(s => s.approveClient);
  const rejectClient = useAppStore(s => s.rejectClient);
  const addToast = useAppStore(s => s.addToast);
  const me = useCurrentUser();
  const [creating, setCreating] = useState(false);

  const isPartner = me?.role === 'partner' || me?.role === 'admin';
  const campaignName = (id: string) => campaigns.find(c => c.id === id)?.short_name ?? id;
  const userName = (id: string | null) => id ? (storeUsers.find(u => u.id === id)?.display_name ?? id) : '—';

  const approved = clients.filter(c => c.status === 'approved').length;
  const pending = clients.filter(c => c.status === 'pending_approval').length;
  const activeFocalPoints = new Set(clients.flatMap(c => c.campaign_ids)).size;

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md" style={{ color: 'var(--text-primary)' }}>Clients</h1>
          <p className="text-body-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            External end users with a curated, read-only view of a focal point. Leads create clients; a partner approves them before access goes live.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-lg btn-press"
          style={{ padding: '9px 16px', background: 'var(--gradient-brand)', color: 'white', fontWeight: 600, fontSize: '0.875rem', boxShadow: 'var(--shadow-brand)' }}
        >
          <Plus size={16} /> New Client
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><div className="text-label mb-2">Total Clients</div><div className="text-metric-sm" style={{ color: 'var(--text-primary)' }}>{clients.length}</div></Card>
        <Card><div className="text-label mb-2">Approved</div><div className="text-metric-sm" style={{ color: 'var(--brand-primary)' }}>{approved}</div></Card>
        <Card><div className="text-label mb-2">Pending Approval</div><div className="text-metric-sm" style={{ color: pending > 0 ? 'var(--status-warning)' : 'var(--text-primary)' }}>{pending}</div></Card>
        <Card><div className="text-label mb-2">Active Focal Points</div><div className="text-metric-sm" style={{ color: 'var(--text-primary)' }}>{activeFocalPoints}</div></Card>
      </div>

      {isPartner && pending > 0 && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)' }}>
          <ShieldAlert size={18} style={{ color: '#B45309', marginTop: 1 }} />
          <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>{pending}</strong> client account{pending === 1 ? '' : 's'} {pending === 1 ? 'is' : 'are'} awaiting your approval. Review and approve below to grant access.
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <Card><EmptyState title="No clients yet" description="Create a client to give an external stakeholder a curated view of a focal point." /></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {clients.map(c => {
            const ss = statusStyle(c.status);
            return (
              <Card key={c.id}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(196,149,106,0.14)', color: '#A06A3F' }}>
                    {c.client_type === 'organization' ? <Building2 size={20} /> : <UserIcon size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                      <span className="px-2 py-0.5 rounded" style={{ background: ss.bg, color: ss.text, fontSize: '0.625rem', fontWeight: 700 }}>{CLIENT_STATUS_LABELS[c.status]}</span>
                    </div>
                    <div className="text-body-sm" style={{ color: 'var(--text-muted)' }}>
                      {c.organization} · {c.email}{c.country ? <> · <MapPin size={11} className="inline -mt-0.5" /> {c.country}</> : null}
                    </div>
                  </div>
                </div>

                <p className="text-body-sm mt-3" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{c.brief}</p>

                <div className="mt-3">
                  <div className="text-label mb-1.5" style={{ fontSize: '0.5625rem' }}>Focal points ({c.campaign_ids.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.campaign_ids.map(id => (
                      <span key={id} className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(45,166,126,0.1)', color: '#1F7A5C', fontSize: '0.6875rem', fontWeight: 600 }}>{campaignName(id)}</span>
                    ))}
                  </div>
                </div>

                {c.sectors && c.sectors.length > 0 && (
                  <div className="mt-3">
                    <div className="text-label mb-1.5" style={{ fontSize: '0.5625rem' }}>Sectors of interest</div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.sectors.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)', fontSize: '0.6875rem', fontWeight: 600, border: '1px solid var(--border-subtle)' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <Meta label="Curated stakeholders" value={`${c.curated_stakeholder_ids.length}`} />
                  <Meta label="Access level" value={c.access_level === 'detailed' ? 'Detailed' : 'Overview'} />
                  <Meta label="Created" value={formatDate(c.created_at)} />
                </div>

                <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    Created by {userName(c.created_by)}{c.approved_by ? ` · Approved by ${userName(c.approved_by)}` : ''}
                  </div>
                  {c.status === 'pending_approval' && isPartner && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => { rejectClient(c.id); addToast(`Rejected ${c.name}`, 'info'); }} className="rounded-lg" style={{ padding: '6px 12px', border: '1px solid var(--border-default)', color: 'var(--status-danger)', fontSize: '0.75rem', fontWeight: 600 }}>Reject</button>
                      <button onClick={() => { approveClient(c.id, me?.id ?? 'u-003'); addToast(`Approved ${c.name}`, 'success'); }} className="flex items-center gap-1 rounded-lg btn-press" style={{ padding: '6px 12px', background: 'var(--gradient-brand)', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}><Check size={13} /> Approve</button>
                    </div>
                  )}
                  {c.status === 'pending_approval' && !isPartner && (
                    <span className="flex items-center gap-1.5" style={{ fontSize: '0.6875rem', color: '#B45309' }}><Clock size={12} /> Awaiting partner approval</span>
                  )}
                  {c.status === 'approved' && (
                    <span className="flex items-center gap-1.5" style={{ fontSize: '0.6875rem', color: '#1F7A5C' }}><Eye size={12} /> Live · client can sign in</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {creating && <CreateClientModal onClose={() => setCreating(false)} />}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-label" style={{ fontSize: '0.5625rem' }}>{label}</div>
      <div className="text-body-sm mt-0.5" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function CreateClientModal({ onClose }: { onClose: () => void }) {
  const campaigns = useAppStore(s => s.campaigns);
  const storeStakeholders = useAppStore(s => s.storeStakeholders);
  const addClient = useAppStore(s => s.addClient);
  const addToast = useAppStore(s => s.addToast);
  const me = useCurrentUser();
  const isPartner = me?.role === 'partner' || me?.role === 'admin';

  const [name, setName] = useState('');
  const [type, setType] = useState<'individual' | 'organization'>('organization');
  const [org, setOrg] = useState('');
  const [email, setEmail] = useState('');
  const defaultCampaign = campaigns.find(c => c.status === 'active')?.id ?? campaigns[0]?.id ?? 'o-001';
  const [campaignIds, setCampaignIds] = useState<string[]>([defaultCampaign]);
  const [access, setAccess] = useState<'overview' | 'detailed'>('overview');
  const [brief, setBrief] = useState('');
  const [curated, setCurated] = useState<string[]>([]);
  const [stakeholderSearch, setStakeholderSearch] = useState('');
  const [country, setCountry] = useState('Kenya');
  const [sectors, setSectors] = useState<string[]>([]);
  const [sectorOptions, setSectorOptions] = useState<string[]>(Object.values(SECTOR_LABELS));
  const [newSector, setNewSector] = useState('');

  const toggleSector = (s: string) => setSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const addNewSector = () => {
    const v = newSector.trim();
    if (!v) return;
    const existing = sectorOptions.find(o => o.toLowerCase() === v.toLowerCase());
    const label = existing ?? v;
    if (!existing) setSectorOptions(o => [...o, label]);
    setSectors(prev => prev.includes(label) ? prev : [...prev, label]);
    setNewSector('');
  };

  const selectableCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'draft');

  // Curated stakeholders are drawn from the union of all selected focal points.
  const eligibleStakeholders = useMemo(
    () => storeStakeholders
      .filter(s => campaignIds.includes(s.campaign_id) && !s.vip_owner_id)
      .sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [storeStakeholders, campaignIds]
  );
  const visibleStakeholders = useMemo(() => {
    const q = stakeholderSearch.trim().toLowerCase();
    if (!q) return eligibleStakeholders;
    return eligibleStakeholders.filter(s => s.full_name.toLowerCase().includes(q) || s.organization.toLowerCase().includes(q));
  }, [eligibleStakeholders, stakeholderSearch]);

  const campaignName = (id: string) => campaigns.find(c => c.id === id)?.short_name ?? id;
  const toggle = (id: string) => setCurated(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);
  const toggleCampaign = (id: string) => setCampaignIds(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    return next.length ? next : prev; // keep at least one
  });
  // Drop curated picks that are no longer eligible when focal points change.
  const eligibleIds = new Set(eligibleStakeholders.map(s => s.id));
  const validCurated = curated.filter(id => eligibleIds.has(id));
  const canSubmit = name.trim() && email.trim() && campaignIds.length > 0 && validCurated.length > 0;

  const submit = () => {
    const status: Client['status'] = isPartner ? 'approved' : 'pending_approval';
    const client: Client = {
      id: `cl-${Date.now().toString().slice(-6)}`,
      name: name.trim(), client_type: type, organization: org.trim() || name.trim(), email: email.trim(),
      campaign_ids: campaignIds, curated_stakeholder_ids: validCurated, brief: brief.trim() || 'No brief provided.',
      sectors, country,
      access_level: access, status, created_by: me?.id ?? 'u-002',
      approved_by: isPartner ? (me?.id ?? 'u-003') : null,
      created_at: new Date().toISOString().slice(0, 10), gender: type === 'individual' ? 'female' : 'male', portrait_url: null,
    };
    addClient(client);
    addToast(isPartner ? 'Client created and approved' : 'Client created — sent to partner for approval', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 modal-backdrop" style={{ background: 'rgba(15,30,41,0.45)' }} onClick={onClose} />
      <div className="modal-content relative w-full rounded-2xl overflow-hidden flex flex-col" style={{ maxWidth: 680, maxHeight: '92vh', background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-xl)' }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(196,149,106,0.14)', color: '#A06A3F' }}><Briefcase size={17} /></div>
            <div>
              <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>New Client</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{isPartner ? 'As a partner this goes live immediately' : 'Will require partner approval'}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>

        <div className="flex-1 min-h-0 px-6 py-5 overflow-y-auto space-y-5">
          {/* Identity */}
          <section className="space-y-4">
            <SectionLabel>Client details</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Client name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Grace Kimani / Acme Ltd" className="msit-input" /></Field>
              <Field label="Type">
                <select value={type} onChange={(e) => setType(e.target.value as 'individual' | 'organization')} className="msit-input">
                  <option value="organization">Organization</option>
                  <option value="individual">Individual</option>
                </select>
              </Field>
              <Field label="Organization"><input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Company / institution" className="msit-input" /></Field>
              <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" className="msit-input" /></Field>
              <Field label="Location / country">
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="msit-input" style={{ paddingLeft: 34 }}>
                    {COUNTRY_OPTIONS.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </Field>
            </div>
            <Field label="Access level">
              <select value={access} onChange={(e) => setAccess(e.target.value as 'overview' | 'detailed')} className="msit-input">
                <option value="overview">Overview (scores & quadrants)</option>
                <option value="detailed">Detailed (profiles, plans & network)</option>
              </select>
            </Field>
            <Field label="Client brief"><textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={2} placeholder="What is the client trying to achieve?" className="msit-input" style={{ resize: 'none' }} /></Field>
          </section>

          {/* Sectors — multi-select with inline create */}
          <section className="space-y-2">
            <SectionLabel>Sectors of interest ({sectors.length})</SectionLabel>
            <p className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Pick all that apply, or add a new sector if it isn't listed.</p>
            <div className="flex flex-wrap gap-1.5">
              {sectorOptions.map(s => {
                const on = sectors.includes(s);
                return (
                  <button key={s} type="button" onClick={() => toggleSector(s)} className="px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
                    style={{ background: on ? 'rgba(45,166,126,0.12)' : 'var(--bg-inset)', border: `1px solid ${on ? 'var(--brand-primary)' : 'var(--border-default)'}`, color: on ? '#1F7A5C' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>
                    {on && <Check size={11} />} {s}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNewSector(); } }}
                placeholder="Add a new sector…"
                className="msit-input flex-1"
              />
              <button type="button" onClick={addNewSector} disabled={!newSector.trim()} className="flex items-center gap-1 rounded-lg shrink-0 btn-press"
                style={{ padding: '8px 12px', background: newSector.trim() ? 'rgba(45,166,126,0.12)' : 'var(--bg-inset)', color: newSector.trim() ? '#1F7A5C' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--border-default)' }}>
                <Plus size={13} /> Add
              </button>
            </div>
          </section>

          {/* Focal points — multi-select */}
          <section className="space-y-2">
            <SectionLabel>Focal points ({campaignIds.length})</SectionLabel>
            <p className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>A client can be associated with multiple focal points and scroll between them in their portal.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectableCampaigns.map(c => {
                const on = campaignIds.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggleCampaign(c.id)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors"
                    style={{ background: on ? 'rgba(45,166,126,0.07)' : 'var(--bg-inset)', border: `1px solid ${on ? 'var(--brand-primary)' : 'var(--border-default)'}` }}>
                    <span className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ border: on ? 'none' : '1.5px solid var(--border-strong)', background: on ? 'var(--brand-primary)' : 'transparent' }}>
                      {on && <Check size={11} color="white" />}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.accent }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate" style={{ color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 600 }}>{c.short_name}</div>
                      <div className="truncate" style={{ color: 'var(--text-muted)', fontSize: '0.625rem' }}>{c.policy_domain}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Curated stakeholders from union of selected focal points */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <SectionLabel>Curated stakeholders ({validCurated.length} selected)</SectionLabel>
              <button onClick={() => setCurated(validCurated.length === eligibleStakeholders.length ? [] : eligibleStakeholders.map(s => s.id))} style={{ fontSize: '0.6875rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                {validCurated.length === eligibleStakeholders.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input value={stakeholderSearch} onChange={(e) => setStakeholderSearch(e.target.value)} placeholder="Search stakeholders to add…" className="msit-input" style={{ paddingLeft: 34 }} />
            </div>
            <div className="rounded-lg max-h-56 overflow-y-auto" style={{ border: '1px solid var(--border-default)' }}>
              {visibleStakeholders.length === 0 && (
                <div className="px-3 py-6 text-center text-body-sm" style={{ color: 'var(--text-muted)' }}>No stakeholders match.</div>
              )}
              {visibleStakeholders.map(s => {
                const checked = curated.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggle(s.id)} className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors" style={{ background: checked ? 'rgba(45,166,126,0.06)' : 'transparent', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ border: checked ? 'none' : '1.5px solid var(--border-strong)', background: checked ? 'var(--brand-primary)' : 'transparent' }}>
                      {checked && <Check size={11} color="white" />}
                    </span>
                    <Portrait name={s.full_name} gender={s.gender} portraitUrl={s.portrait_url} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate" style={{ color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 500 }}>{s.full_name}</div>
                      <div className="truncate" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{s.organization}</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded shrink-0" style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', fontSize: '0.5625rem', fontWeight: 600 }}>{campaignName(s.campaign_id)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-1.5" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={13} style={{ color: 'var(--brand-primary)' }} /> {isPartner ? 'Goes live on create' : 'Routed to partner for sign-off'}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-lg" style={{ padding: '9px 16px', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}>Cancel</button>
            <button disabled={!canSubmit} onClick={submit} className="rounded-lg btn-press" style={{ padding: '9px 18px', background: canSubmit ? 'var(--gradient-brand)' : 'var(--bg-inset)', color: canSubmit ? 'white' : 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>Create client</button>
          </div>
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-label" style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>{children}</div>;
}
