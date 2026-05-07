import { X, Calendar, MessageSquare, Clock, ExternalLink } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { OutcomeBadge, EngagementTypeBadge } from './ui/Badges';
import { formatDate } from '../lib/formatters';
import Portrait from './ui/Portrait';

export default function EngagementDetailModal() {
  const engagementDetailId = useAppStore(s => s.engagementDetailId);
  const closeEngagementDetail = useAppStore(s => s.closeEngagementDetail);
  const engagements = useAppStore(s => s.engagements);
  const storeStakeholders = useAppStore(s => s.storeStakeholders);
  const setSelectedStakeholder = useAppStore(s => s.setSelectedStakeholder);
  const openLogEngagement = useAppStore(s => s.openLogEngagement);

  if (!engagementDetailId) return null;

  const engagement = engagements.find(e => e.id === engagementDetailId);
  if (!engagement) return null;

  const stakeholder = storeStakeholders.find(s => s.id === engagement.stakeholder_id);

  return (
    <>
      <div
        className="fixed inset-0 z-40 modal-backdrop"
        style={{ background: 'rgba(0,0,0,0.3)' }}
        onClick={closeEngagementDetail}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeEngagementDetail}>
        <div
          className="modal-content w-full max-w-lg rounded-2xl overflow-hidden"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-xl)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <h2 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Engagement Details</h2>
            <button
              onClick={closeEngagementDetail}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-5">
            {/* Stakeholder */}
            {stakeholder && (
              <div className="flex items-center gap-3">
                <Portrait name={stakeholder.full_name} gender={stakeholder.gender} portraitUrl={stakeholder.portrait_url} size={40} />
                <div>
                  <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{stakeholder.full_name}</div>
                  <div className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{stakeholder.organization}</div>
                </div>
              </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                <Calendar size={14} />
                {formatDate(engagement.date)}
              </div>
              <EngagementTypeBadge type={engagement.engagement_type} />
              <OutcomeBadge outcome={engagement.outcome} />
            </div>

            {/* Description */}
            <div>
              <div className="text-label mb-1">Description</div>
              <div className="text-body" style={{ color: 'var(--text-secondary)' }}>{engagement.description}</div>
            </div>

            {/* Follow-up */}
            {engagement.follow_up_required && (
              <div className="rounded-lg p-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--status-warning)' }}>
                  <Clock size={14} />
                  <span className="text-heading-sm">Follow-up Required</span>
                </div>
                <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                  {engagement.follow_up_date ? `Due: ${formatDate(engagement.follow_up_date)}` : 'No date set'}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-secondary)' }}>
            {stakeholder && (
              <button
                onClick={() => { closeEngagementDetail(); setSelectedStakeholder(stakeholder.id); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <ExternalLink size={14} /> View Profile
              </button>
            )}
            <button
              onClick={() => {
                closeEngagementDetail();
                openLogEngagement(engagement.stakeholder_id);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--text-primary)', color: 'white' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--text-primary)'; }}
            >
              <MessageSquare size={14} /> Log Follow-up
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
