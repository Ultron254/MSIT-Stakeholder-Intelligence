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
  const [rejecting, setRejecting] = useState<ScoreSnapshot | null>(null);
  const [reason, setReason] = useState('');
  const [rejectEvidence, setRejectEvidence] = useState('');

  // Only surface snapshots for stakeholders the current user is allowed to see.
  // Partner-restricted VIP contacts must never appear to a non-owner.
  const visibleStakeholderIds = useMemo(() => {
    const ids = new Set<string>();
    storeStakeholders.forEach(s => {
      if (!s.vip_owner_id || s.vip_owner_id === me?.id || me?.role === 'admin') ids.add(s.id);
    });
    return ids;
  }, [storeStakeholders, me?.id, me?.role]);

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

  const approve = (snap: ScoreSnapshot) => {
    const st = stakeholderName(snap.stakeholder_id);
    approveSnapshot(snap.id, me?.id ?? 'u-002');
    addActivity({
      id: `act-${Date.now()}`, type: 'approval',
      description: `Approved ${st?.full_name ?? 'a'} score snapshot (SIS ${snap.sis_score.toFixed(0)})`,
      stakeholder_id: snap.stakeholder_id, user_id: me?.id ?? 'u-002',
      timestamp: new Date().toISOString().slice(0, 10),
    });
    addToast(`Approved ${st?.full_name ?? 'snapshot'}`, 'success');
  };

  const openReject = (snap: ScoreSnapshot) => { setRejecting(snap); setReason(''); setRejectEvidence(''); };

  const confirmReject = () => {
    if (!rejecting || !reason.trim() || !rejectEvidence.trim()) return;
    const st = stakeholderName(rejecting.stakeholder_id);
    rejectSnapshot(rejecting.id, reason.trim(), rejectEvidence.trim());
    addActivity({
      id: `act-${Date.now()}`, type: 'approval',
      description: `Returned ${st?.full_name ?? 'a'} score snapshot for revision: ${reason.trim().slice(0, 80)}`,
      stakeholder_id: rejecting.stakeholder_id, user_id: me?.id ?? 'u-002',
      timestamp: new Date().toISOString().slice(0, 10),
    });
    addToast(`Returned ${st?.full_name ?? 'snapshot'} for revision`, 'info');
    setRejecting(null);
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
            const snapEvidence = evidence.filter(e => e.snapshot_id === snap.id);
            const evCount = snapEvidence.length;
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

                    {/* Attached evidence — visible to the approver so the
                        decision is grounded in what the analyst submitted. */}
                    <div className="mb-3">
                      <div className="text-label mb-2" style={{ fontSize: '0.5625rem' }}>Submitted evidence ({snapEvidence.length})</div>
                      {snapEvidence.length === 0 ? (
                        <div className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No evidence was attached to this submission.</div>
                      ) : (
                        <div className="space-y-2">
                          {snapEvidence.map(ev => (
                            <div key={ev.id} className="rounded-lg p-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-heading-sm" style={{ color: 'var(--text-primary)', fontSize: '0.8125rem' }}>{ev.title}</span>
                                <span className="px-1.5 py-0.5 rounded shrink-0" style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', fontSize: '0.5625rem', fontWeight: 600, textTransform: 'capitalize' }}>{ev.evidence_type.replace(/_/g, ' ')}</span>
                              </div>
                              <p className="text-body-sm mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{ev.description}</p>
                              <div className="flex items-center gap-2 mt-1.5" style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                                <span className="capitalize">{ev.sensitivity}</span>
                                {ev.source_url && <><span>·</span><a href={ev.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>Source</a></>}
                                <span>·</span><span>Confidence {ev.confidence_contribution}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>Overall confidence</span>
                      <ConfidenceBadge confidence={snap.overall_confidence} />
                      <span>·</span>
                      <span>Scored {formatDate(snap.scored_at)}</span>
                    </div>
                  </div>
                )}

                {snap.workflow_status === 'rejected' && snap.rejection_reason && (
                  <div className="mt-3 rounded-lg p-3" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)' }}>
                    <div className="text-label" style={{ fontSize: '0.5625rem', color: '#B91C1C' }}>Reason returned</div>
                    <p className="text-body-sm mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{snap.rejection_reason}</p>
                    {snap.rejection_evidence && (
                      <p className="text-body-sm mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}><span style={{ fontWeight: 600 }}>Evidence cited:</span> {snap.rejection_evidence}</p>
                    )}
                  </div>
                )}

                {snap.workflow_status === 'submitted' && (
                  <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => approve(snap)}
                      className="flex items-center gap-1.5 rounded-lg btn-press"
                      style={{ padding: '7px 14px', background: 'var(--gradient-brand)', color: 'white', fontSize: '0.8125rem', fontWeight: 600 }}
                    >
                      <Check size={15} /> Approve
                    </button>
                    <button
                      onClick={() => openReject(snap)}
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

      {/* Return-for-revision modal: capture a reason (required) + evidence */}
      {rejecting && (() => {
        const st = stakeholderName(rejecting.stakeholder_id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 modal-backdrop" style={{ background: 'rgba(15,30,41,0.45)' }} onClick={() => setRejecting(null)} />
            <div className="modal-content relative w-full rounded-2xl overflow-hidden" style={{ maxWidth: 520, background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-xl)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.1)', color: '#B91C1C' }}><X size={16} /></div>
                  <div>
                    <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>Return for revision</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{st?.full_name} · {st?.organization}</div>
                  </div>
                </div>
                <button onClick={() => setRejecting(null)} aria-label="Close"><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Reason for returning <span style={{ color: 'var(--status-danger)' }}>*</span></label>
                  <textarea
                    value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                    placeholder="Explain what needs to change before this can be approved…"
                    className="msit-input" style={{ resize: 'none' }}
                  />
                </div>
                <div>
                  <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Submit evidence <span style={{ color: 'var(--status-danger)' }}>*</span></label>
                  <textarea
                    value={rejectEvidence} onChange={(e) => setRejectEvidence(e.target.value)} rows={2}
                    placeholder="Cite contradicting evidence, a source, or a meeting note the analyst should review."
                    className="msit-input"
                    style={{ resize: 'none', border: `1px solid ${rejectEvidence.trim() ? 'var(--border-default)' : 'var(--status-danger)'}` }}
                  />
                </div>
                <div className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  The analyst will see this reason and evidence against the returned submission so they can revise and resubmit.
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button onClick={() => setRejecting(null)} className="rounded-lg" style={{ padding: '9px 16px', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}>Cancel</button>
                {(() => {
                  const ready = reason.trim() && rejectEvidence.trim();
                  return (
                    <button
                      disabled={!ready} onClick={confirmReject}
                      className="rounded-lg btn-press"
                      style={{ padding: '9px 18px', background: ready ? '#DC2626' : 'var(--bg-inset)', color: ready ? 'white' : 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}
                    >
                      Return for revision
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
