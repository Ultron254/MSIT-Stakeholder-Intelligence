import { useMemo, useState } from 'react';
import {
  Handshake, Mail, EyeOff, Send, ShieldCheck, X, Crown, Globe, Lock,
} from 'lucide-react';
import { useAppStore, useCurrentUser } from '../lib/store';
import { Card, EmptyState } from '../components/ui/Badges';
import type { PartnerInvite } from '../lib/types';
import { formatDate } from '../lib/formatters';
import Portrait from '../components/ui/Portrait';

export default function Partners() {
  const partnerInvites = useAppStore(s => s.partnerInvites);
  const addPartnerInvite = useAppStore(s => s.addPartnerInvite);
  const revokePartnerInvite = useAppStore(s => s.revokePartnerInvite);
  const storeStakeholders = useAppStore(s => s.storeStakeholders);
  const toggleVipSensitive = useAppStore(s => s.toggleVipSensitive);
  const campaigns = useAppStore(s => s.campaigns);
  const addToast = useAppStore(s => s.addToast);
  const me = useCurrentUser();

  const [email, setEmail] = useState('');
  const [pname, setPname] = useState('');

  const myVips = useMemo(
    () => storeStakeholders.filter(s => s.vip_owner_id === me?.id),
    [storeStakeholders, me]
  );
  const campaignName = (id: string) => campaigns.find(c => c.id === id)?.short_name ?? id;

  const invite = () => {
    if (!email.trim() || !pname.trim()) return;
    const inv: PartnerInvite = {
      id: `pi-${Date.now().toString().slice(-6)}`, email: email.trim(), display_name: pname.trim(),
      invited_by: me?.id ?? 'u-003', status: 'sent', sent_at: new Date().toISOString().slice(0, 10),
    };
    addPartnerInvite(inv);
    addToast(`Invitation sent to ${email.trim()}`, 'success');
    setEmail(''); setPname('');
  };

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-display-md" style={{ color: 'var(--text-primary)' }}>Partner Controls</h1>
        <p className="text-body-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Partner-only administration: invite fellow partners and manage sensitive VIP relationships that stay private to you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ControlCard icon={<Globe size={18} />} title="Full visibility" desc="See every stakeholder, engagement and focal point across the organization." />
        <ControlCard icon={<Crown size={18} />} title="Highest authority" desc="Approve clients, sign off scores and override engagement plans." />
        <ControlCard icon={<Lock size={18} />} title="Private VIP layer" desc="Tag sensitive contacts only you can see — invisible to all other accounts." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invite partners */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.12)', color: '#7C3AED' }}><Handshake size={16} /></div>
            <h2 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>Invite a Partner</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Full name</label>
              <input value={pname} onChange={(e) => setPname(e.target.value)} placeholder="Partner name" className="msit-input" />
            </div>
            <div>
              <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="partner@momentum.africa" className="msit-input" style={{ paddingLeft: 36 }} />
              </div>
            </div>
            <button onClick={invite} disabled={!email.trim() || !pname.trim()} className="flex items-center gap-2 rounded-lg btn-press" style={{ padding: '9px 16px', background: email.trim() && pname.trim() ? 'var(--gradient-brand)' : 'var(--bg-inset)', color: email.trim() && pname.trim() ? 'white' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.8125rem' }}>
              <Send size={15} /> Send invitation
            </button>
          </div>

          <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="text-label mb-2">Invitations</div>
            {partnerInvites.length === 0 ? (
              <div className="text-body-sm" style={{ color: 'var(--text-muted)' }}>No invitations sent.</div>
            ) : (
              <div className="space-y-2">
                {partnerInvites.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="min-w-0">
                      <div className="text-body-sm" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{inv.display_name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{inv.email} · {formatDate(inv.sent_at)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded" style={{ fontSize: '0.625rem', fontWeight: 700, background: inv.status === 'accepted' ? 'rgba(45,166,126,0.12)' : inv.status === 'revoked' ? 'rgba(100,116,139,0.12)' : 'rgba(217,119,6,0.12)', color: inv.status === 'accepted' ? '#1F7A5C' : inv.status === 'revoked' ? '#64748B' : '#B45309' }}>
                        {inv.status === 'sent' ? 'PENDING' : inv.status.toUpperCase()}
                      </span>
                      {inv.status === 'sent' && (
                        <button onClick={() => { revokePartnerInvite(inv.id); addToast('Invitation revoked', 'info'); }} aria-label="Revoke"><X size={14} style={{ color: 'var(--text-muted)' }} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* VIP sensitive list */}
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.12)', color: '#7C3AED' }}><EyeOff size={16} /></div>
            <h2 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>Private VIP Contacts</h2>
          </div>
          <p className="text-body-sm mb-4" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            These sensitive stakeholders are visible only in your account. Tag any stakeholder as VIP from their profile.
          </p>
          {myVips.length === 0 ? (
            <EmptyState title="No VIP contacts" description="Open a stakeholder profile and use “Tag as private VIP” to add one here." />
          ) : (
            <div className="space-y-2">
              {myVips.map(s => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.18)' }}>
                  <Portrait name={s.full_name} gender={s.gender} portraitUrl={s.portrait_url} size={34} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-body-sm truncate" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.full_name}</span>
                      <Lock size={11} style={{ color: '#7C3AED' }} />
                    </div>
                    <div className="truncate" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{s.title} · {campaignName(s.campaign_id)}</div>
                  </div>
                  <button onClick={() => { toggleVipSensitive(s.id, me?.id ?? 'u-003'); addToast(`${s.full_name} is no longer private`, 'info'); }} className="rounded-lg" style={{ padding: '5px 10px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '0.6875rem', fontWeight: 600 }}>
                    Untag
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ControlCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}>{icon}</div>
        <ShieldCheck size={14} style={{ color: 'var(--brand-primary)', marginLeft: 'auto' }} />
      </div>
      <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{title}</div>
      <div className="text-body-sm mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{desc}</div>
    </Card>
  );
}
