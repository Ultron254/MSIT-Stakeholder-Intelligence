import { useMemo, useState } from 'react';
import {
  Check, X, FileText, ChevronDown, ChevronUp, Clock, ShieldCheck,
} from 'lucide-react';
import { useAppStore, useCurrentUser } from '../lib/store';
import { Card, SISBadge, QuadrantBadge, ConfidenceBadge, EmptyState } from '../components/ui/Badges';
import { COMPONENT_LABELS } from '../lib/types';
import type { Component, ScoreSnapshot } from '../lib/types';
import { formatRelativeDate, formatDate } from '../lib/formatters';
import Portrait from '../components/ui/Portrait';

const COMPONENTS: Component[] = ['influence', 'relationship', 'risk', 'sentiment', 'alignment', 'impact'];

export default function Approvals() {
  const snapshots = useAppStore(s => s.snapshots);
  const storeStakeholders = useAppStore(s => s.storeStakeholders);
  const storeUsers = useAppStore(s => s.storeUsers);
  const evidence = useAppStore(s => s.evidence);
  const campaigns = useAppStore(s => s.campaigns);
  const approveSnapshot = useAppStore(s => s.approveSnapshot);
  const rejectSnapshot = useAppStore(s => s.rejectSnapshot);
  const addActivity = useAppStore(s => s.addActivity);
  const addToast = useAppStore(s => s.addToast);
  const setSelectedStakeholder = useAppStore(s => s.setSelectedStakeholder);
  const me = useCurrentUser();

  const [tab, setTab] = useState<'pending' | 'decided'>('pending');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Only surface snapshots for stakeholders the current user is allowed to see.
  // Partner-restricted VIP contacts must never appear to a non-owner.
  const visibleStakeholderIds = useMemo(() => {
    const ids = new Set<string>();
    storeStakeholders.forEach(s => {
      if (!s.vip_owner_id || s.vip_owner_id === me?.id) ids.add(s.id);
    });
    return ids;
  }, [storeStakeholders, me?.id]);

  const pending = useMemo(
    () => snapshots.filter(s => s.workflow_status === 'submitted' && visibleStakeholderIds.has(s.stakeholder_id)),
    [snapshots, visibleStakeholderIds]
  );
  const decided = useMemo(
    () => snapshots
      .filter(s => visibleStakeholderIds.has(s.stakeholder_id) && (s.workflow_status === 'rejected' || (s.workflow_status === 'approved' && s.approved_at && s.version >= 1)))
      .slice(-20).reverse(),
    [snapshots, visibleStakeholderIds]
  );

  const stakeholderName = (id: string) => storeStakeholders.find(s => s.id === id);
  const userName = (id: string) => storeUsers.find(u => u.id === id)?.display_name ?? id;
  const campaignName = (id: string) => campaigns.find(c => c.id === id)?.short_name ?? id;

  const decide = (snap: ScoreSnapshot, approve: boolean) => {
    const st = stakeholderName(snap.stakeholder_id);
    if (approve) {
      approveSnapshot(snap.id, me?.id ?? 'u-002');
      addActivity({
        id: `act-${Date.now()}`, type: 'approval',
        description: `Approved ${st?.full_name ?? 'a'} score snapshot (SIS ${snap.sis_score.toFixed(0)})`,
        stakeholder_id: snap.stakeholder_id, user_id: me?.id ?? 'u-002',
        timestamp: new Date().toISOString().slice(0, 10),
      });
      addToast(`Approved ${st?.full_name ?? 'snapshot'}`, 'success');
    } else {
      rejectSnapshot(snap.id);
      addToast(`Returned ${st?.full_name ?? 'snapshot'} for revision`, 'info');
    }
  };

  const list = tab === 'pending' ? pending : decided;

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md" style={{ color: 'var(--text-primary)' }}>Approvals</h1>
          <p className="text-body-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Review and sign off on assessments submitted by the analysis team. Approving locks the score into the portfolio.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(37,99,235,0.08)', color: '#2563EB' }}>
          <ShieldCheck size={16} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{pending.length} awaiting your sign-off</span>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--bg-inset)' }}>
        {(['pending', 'decided'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-md transition-all"
            style={{ background: tab === t ? 'var(--bg-elevated)' : 'transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, boxShadow: tab === t ? 'var(--shadow-sm)' : 'none' }}
          >
            {t === 'pending' ? `Pending (${pending.length})` : 'Recently Decided'}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card><EmptyState title="Nothing here" description={tab === 'pending' ? 'No assessments are awaiting approval. The team is all caught up.' : 'No decisions recorded yet this session.'} /></Card>
      ) : (
        <div className="space-y-3">
          {list.map(snap => {
            const st = stakeholderName(snap.stakeholder_id);
            if (!st) return null;
            const evCount = evidence.filter(e => e.snapshot_id === snap.id).length;
            const isOpen = expanded === snap.id;
            return (
              <Card key={snap.id} className="overflow-hidden">
                <div className="flex items-start gap-4">
                  <Portrait name={st.full_name} gender={st.gender} portraitUrl={st.portrait_url} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => setSelectedStakeholder(st.id)} className="text-heading-sm hover:underline" style={{ color: 'var(--text-primary)' }}>
                        {st.full_name}
                      </button>
                      {snap.workflow_status === 'submitted' && <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(217,119,6,0.12)', color: '#B45309', fontSize: '0.625rem', fontWeight: 700 }}>SUBMITTED</span>}
                      {snap.workflow_status === 'approved' && <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(45,166,126,0.12)', color: '#1F7A5C', fontSize: '0.625rem', fontWeight: 700 }}>APPROVED</span>}
                      {snap.workflow_status === 'rejected' && <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(220,38,38,0.1)', color: '#B91C1C', fontSize: '0.625rem', fontWeight: 700 }}>RETURNED</span>}
                    </div>
                    <div className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{st.title} · {st.organization}</div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1"><Clock size={12} /> Submitted by {userName(snap.scored_by)} · {formatRelativeDate(snap.scored_at)}</span>
                      <span>·</span>
                      <span>{campaignName(snap.objective_id)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><FileText size={12} /> {evCount} evidence item{evCount === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <SISBadge score={snap.sis_score} size="md" />
                      <div className="mt-1"><QuadrantBadge quadrant={snap.quadrant} size="sm" /></div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setExpanded(isOpen ? null : snap.id)}
                  className="flex items-center gap-1.5 mt-3 text-body-sm"
                  style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.75rem' }}
                >
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {isOpen ? 'Hide' : 'Review'} component scores & evidence
                </button>

                {isOpen && (
                  <div className="accordion-expand mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      {COMPONENTS.map(c => {
                        const val = (snap[`${c}_score` as keyof ScoreSnapshot] as number) ?? 0;
                        return (
                          <div key={c} className="rounded-lg p-2.5" style={{ background: 'var(--bg-secondary)' }}>
                            <div className="text-label" style={{ fontSize: '0.5625rem' }}>{COMPONENT_LABELS[c]}</div>
                            <div className="flex items-end gap-1 mt-1">
                              <span className="font-display" style={{ fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: 1 }}>{val}</span>
                              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: 2 }}>/ 5</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>Overall confidence</span>
                      <ConfidenceBadge confidence={snap.overall_confidence} />
                      <span>·</span>
                      <span>Scored {formatDate(snap.scored_at)}</span>
                    </div>
                  </div>
                )}

                {snap.workflow_status === 'submitted' && (
                  <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => decide(snap, true)}
                      className="flex items-center gap-1.5 rounded-lg btn-press"
                      style={{ padding: '7px 14px', background: 'var(--gradient-brand)', color: 'white', fontSize: '0.8125rem', fontWeight: 600 }}
                    >
                      <Check size={15} /> Approve
                    </button>
                    <button
                      onClick={() => decide(snap, false)}
                      className="flex items-center gap-1.5 rounded-lg btn-press"
                      style={{ padding: '7px 14px', border: '1px solid var(--border-default)', color: 'var(--status-danger)', fontSize: '0.8125rem', fontWeight: 600 }}
                    >
                      <X size={15} /> Return for revision
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
