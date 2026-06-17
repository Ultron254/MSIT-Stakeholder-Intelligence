import { useEffect, useState } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { useAppStore, useActingRole } from '../lib/store';
import Portrait from './ui/Portrait';
import { NOW } from '../lib/constants';
import { format } from 'date-fns';
import type { EngagementRecord } from '../lib/types';

const ENGAGEMENT_TYPES: EngagementRecord['engagement_type'][] = [
  'meeting', 'phone_call', 'email', 'event', 'social', 'third_party_intro', 'formal_submission'
];

const OUTCOMES: EngagementRecord['outcome'][] = ['positive', 'neutral', 'negative', 'pending'];

export default function LogEngagementModal() {
  const logEngagementOpen = useAppStore(s => s.logEngagementOpen);
  const logEngagementStakeholderId = useAppStore(s => s.logEngagementStakeholderId);
  const closeLogEngagement = useAppStore(s => s.closeLogEngagement);
  const addEngagement = useAppStore(s => s.addEngagement);
  const addToast = useAppStore(s => s.addToast);
  const storeStakeholders = useAppStore(s => s.storeStakeholders);
  const addActivity = useAppStore(s => s.addActivity);
  const currentUserId = useAppStore(s => s.currentUserId);
  const currentCampaignId = useAppStore(s => s.currentCampaignId);
  const role = useActingRole();

  const [stakeholderId, setStakeholderId] = useState(logEngagementStakeholderId || '');
  const [type, setType] = useState<EngagementRecord['engagement_type']>('meeting');
  const [date, setDate] = useState(format(NOW, 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [outcome, setOutcome] = useState<EngagementRecord['outcome']>('pending');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (logEngagementOpen) {
      setStakeholderId(logEngagementStakeholderId || '');
      setType('meeting');
      setDate(format(NOW, 'yyyy-MM-dd'));
      setDescription('');
      setOutcome('pending');
      setFollowUpRequired(false);
      setFollowUpDate('');
      setSearchQuery('');
    }
  }, [logEngagementOpen, logEngagementStakeholderId]);

  if (!logEngagementOpen) return null;

  const selectable = storeStakeholders.filter(s => !s.vip_owner_id || s.vip_owner_id === currentUserId || role === 'admin');
  const filteredStakeholders = searchQuery
    ? selectable.filter(s => s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.organization.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : selectable.slice(0, 10);

  const selectedStakeholder = storeStakeholders.find(s => s.id === stakeholderId);

  const handleSubmit = () => {
    if (!stakeholderId || !description.trim()) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    const stakeholder = storeStakeholders.find(s => s.id === stakeholderId);

    const newEngagement: EngagementRecord = {
      id: `eng-new-${Date.now()}`,
      stakeholder_id: stakeholderId,
      objective_id: stakeholder?.campaign_id ?? currentCampaignId,
      engagement_type: type,
      date,
      description: description.trim(),
      outcome,
      follow_up_required: followUpRequired,
      follow_up_date: followUpRequired && followUpDate ? followUpDate : null,
      logged_by: currentUserId ?? 'u-001',
    };

    addEngagement(newEngagement);

    addActivity({
      id: `act-new-${Date.now()}`,
      type: 'engagement_logged',
      description: `${type.replace(/_/g, ' ')} logged with ${stakeholder?.full_name ?? 'Unknown'}`,
      stakeholder_id: stakeholderId,
      user_id: currentUserId ?? 'u-001',
      timestamp: format(NOW, 'yyyy-MM-dd'),
    });
    
    addToast('Engagement logged successfully', 'success');
    closeLogEngagement();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 modal-backdrop" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={closeLogEngagement} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeLogEngagement}>
        <div
          className="modal-content w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex items-center gap-2">
              <MessageSquare size={18} style={{ color: 'var(--accent-primary)' }} />
              <h2 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Log Engagement</h2>
            </div>
            <button onClick={closeLogEngagement} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Stakeholder selector */}
            <div>
              <label className="text-label mb-1.5 block">
                Stakeholder <span style={{ color: 'var(--accent-primary)' }}>*</span>
              </label>
              {selectedStakeholder ? (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
                  <Portrait name={selectedStakeholder.full_name} gender={selectedStakeholder.gender} portraitUrl={selectedStakeholder.portrait_url} size={32} />
                  <div className="flex-1">
                    <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{selectedStakeholder.full_name}</div>
                    <div className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{selectedStakeholder.organization}</div>
                  </div>
                  <button onClick={() => setStakeholderId('')} className="text-body-sm" style={{ color: 'var(--accent-primary)' }}>Change</button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="Search stakeholders..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-body-sm outline-none"
                    style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  />
                  {filteredStakeholders.length > 0 && (
                    <div className="mt-1 max-h-40 overflow-y-auto rounded-lg" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
                      {filteredStakeholders.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { setStakeholderId(s.id); setSearchQuery(''); }}
                          className="w-full flex items-center gap-2.5 text-left px-3 py-2 text-body-sm transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Portrait name={s.full_name} gender={s.gender} portraitUrl={s.portrait_url} size={24} />
                          <div>
                            <div className="text-heading-sm" style={{ fontSize: '0.8125rem' }}>{s.full_name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{s.organization}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="text-label mb-1.5 block">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as EngagementRecord['engagement_type'])}
                className="w-full rounded-lg px-3 py-2 text-body-sm outline-none"
                style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                {ENGAGEMENT_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="text-label mb-1.5 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-body-sm outline-none"
                style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-label mb-1.5 block">
                Description <span style={{ color: 'var(--accent-primary)' }}>*</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the engagement..."
                rows={3}
                className="w-full rounded-lg px-3 py-2 text-body-sm outline-none resize-none"
                style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Outcome */}
            <div>
              <label className="text-label mb-1.5 block">Outcome</label>
              <div className="flex gap-2">
                {OUTCOMES.map(o => (
                  <button
                    key={o}
                    onClick={() => setOutcome(o)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                    style={{
                      background: outcome === o
                        ? o === 'positive' ? 'var(--quadrant-ally-bg)' : o === 'negative' ? 'var(--quadrant-power-gap-bg)' : o === 'pending' ? '#FDF6E3' : 'var(--bg-secondary)'
                        : 'var(--bg-inset)',
                      color: outcome === o
                        ? o === 'positive' ? 'var(--quadrant-ally-text)' : o === 'negative' ? 'var(--quadrant-power-gap-text)' : o === 'pending' ? '#9A7611' : 'var(--text-secondary)'
                        : 'var(--text-secondary)',
                      border: outcome === o ? '1px solid transparent' : '1px solid var(--border-default)',
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* Follow-up */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={followUpRequired}
                  onChange={e => setFollowUpRequired(e.target.checked)}
                  className="rounded"
                />
                <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Follow-up required</span>
              </label>
            </div>
            {followUpRequired && (
              <div>
                <label className="text-label mb-1.5 block">Follow-up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-body-sm outline-none"
                  style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: 'var(--border-default)' }}>
            <button
              onClick={closeLogEngagement}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--text-primary)', color: 'white' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--text-primary)'; }}
            >
              Log Engagement
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
