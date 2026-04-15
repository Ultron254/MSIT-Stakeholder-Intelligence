import { useState, useMemo, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { NOW } from '../lib/constants';
import { calculateFullScore, getSISColor } from '../lib/scoring-engine';
import { QuadrantBadge } from './ui/Badges';
import { COMPONENT_LABELS, COMPONENT_DESCRIPTIONS } from '../lib/types';
import type { Component, Confidence, ScoringInput } from '../lib/types';
import { formatSIS, formatAxis } from '../lib/formatters';

const components: Component[] = ['influence', 'relationship', 'risk', 'sentiment', 'alignment', 'impact'];

const scoreMeanings: Record<Component, string[]> = {
  influence: ['Negligible', 'Low', 'Moderate', 'High', 'Dominant'],
  relationship: ['None', 'Minimal', 'Developing', 'Strong', 'Deep Access'],
  risk: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
  sentiment: ['Very Negative', 'Negative', 'Neutral', 'Positive', 'Very Positive'],
  alignment: ['Strongly Opposed', 'Opposed', 'Neutral', 'Aligned', 'Strongly Aligned'],
  impact: ['Marginal', 'Limited', 'Moderate', 'Significant', 'Transformative'],
};

export default function ScoreUpdatePanel() {
  const { scoreUpdateOpen, scoreUpdateStakeholderId, closeScoreUpdate, addToast, addSnapshot } = useAppStore();
  const all = useAppStore(s => s.getStakeholdersWithScores());
  const snapshots = useAppStore(s => s.snapshots);

  const stakeholder = useMemo(
    () => all.find(s => s.id === scoreUpdateStakeholderId),
    [all, scoreUpdateStakeholderId]
  );

  const currentSnap = stakeholder?.latestSnapshot;

  const [scores, setScores] = useState<Record<Component, number>>({
    influence: 3, relationship: 3, risk: 3, sentiment: 3, alignment: 3, impact: 3,
  });
  const [confidences, setConfidences] = useState<Record<Component, Confidence>>({
    influence: 'B', relationship: 'B', risk: 'B', sentiment: 'B', alignment: 'B', impact: 'B',
  });
  const [rationales, setRationales] = useState<Record<Component, string>>({
    influence: '', relationship: '', risk: '', sentiment: '', alignment: '', impact: '',
  });

  // Initialize from current scores
  useEffect(() => {
    if (currentSnap) {
      setScores({
        influence: currentSnap.influence_score,
        relationship: currentSnap.relationship_score,
        risk: currentSnap.risk_score,
        sentiment: currentSnap.sentiment_score,
        alignment: currentSnap.alignment_score,
        impact: currentSnap.impact_score,
      });
    }
  }, [currentSnap]);

  // Live calculation
  const result = useMemo(() => {
    const input: ScoringInput = {
      influence: scores.influence,
      relationship: scores.relationship,
      risk: scores.risk,
      sentiment: scores.sentiment,
      alignment: scores.alignment,
      impact: scores.impact,
    };
    return calculateFullScore(input);
  }, [scores]);

  const previousSIS = currentSnap?.sis_score ?? 0;
  const sisDelta = result.sis_score - previousSIS;
  const quadrantChanged = currentSnap ? result.quadrant !== currentSnap.quadrant : false;

  const handleSave = (status: 'draft' | 'submitted') => {
    if (!stakeholder) return;
    const existingSnapCount = snapshots.filter(s => s.stakeholder_id === stakeholder.id).length;
    const newSnapshot = {
      id: `snap-new-${Date.now()}`,
      stakeholder_id: stakeholder.id,
      objective_id: 'o-001',
      version: existingSnapCount + 1,
      influence_score: scores.influence,
      relationship_score: scores.relationship,
      risk_score: scores.risk,
      sentiment_score: scores.sentiment,
      alignment_score: scores.alignment,
      impact_score: scores.impact,
      risk_adjusted: result.risk_adjusted,
      sis_score: result.sis_score,
      power_axis: result.power_axis,
      convertibility_axis: result.convertibility_axis,
      quadrant: result.quadrant,
      overall_confidence: (Object.values(confidences).sort()[0] ?? 'B') as Confidence,
      workflow_status: status,
      scored_by: 'u-001',
      approved_by: null,
      scored_at: NOW.toISOString().split('T')[0],
      approved_at: null,
    };
    addSnapshot(newSnapshot);
    addToast(status === 'draft' ? 'Score saved as draft' : 'Score submitted for review', 'success');
    closeScoreUpdate();
  };

  if (!scoreUpdateOpen || !stakeholder) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity"
        style={{ background: 'rgba(0,0,0,0.3)' }}
        onClick={closeScoreUpdate}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-screen z-50 overflow-y-auto"
        style={{
          width: 480,
          maxWidth: '100vw',
          background: 'var(--bg-elevated)',
          borderLeft: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-xl)',
          animation: 'slideInFromRight 0.25s ease-out',
        }}
      >
        <style>{`
          @keyframes slideInFromRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
        >
          <div>
            <h2 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Update Scores</h2>
            <p className="text-body-sm" style={{ color: 'var(--text-muted)' }}>{stakeholder.full_name}</p>
          </div>
          <button onClick={closeScoreUpdate} className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Preview */}
        <div className="px-6 py-4 border-b" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-label mb-1">SIS Score</div>
              <div className="text-metric" style={{ color: getSISColor(result.sis_score), fontSize: '2rem' }}>
                {formatSIS(result.sis_score)}
              </div>
              {sisDelta !== 0 && (
                <span className="text-body-sm font-mono" style={{
                  color: sisDelta > 0 ? 'var(--status-success)' : 'var(--status-danger)',
                  fontSize: '0.75rem',
                }}>
                  {sisDelta > 0 ? '+' : ''}{sisDelta.toFixed(1)}
                </span>
              )}
            </div>
            <div>
              <div className="text-label mb-1">Quadrant</div>
              <QuadrantBadge quadrant={result.quadrant} />
              {quadrantChanged && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle size={12} style={{ color: 'var(--status-warning)' }} />
                  <span className="text-body-sm" style={{ color: 'var(--status-warning)', fontSize: '0.6875rem' }}>Changed!</span>
                </div>
              )}
            </div>
            <div>
              <div className="text-label mb-1">Power</div>
              <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{formatAxis(result.power_axis)}</div>
            </div>
            <div>
              <div className="text-label mb-1">Conv.</div>
              <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{formatAxis(result.convertibility_axis)}</div>
            </div>
          </div>
        </div>

        {/* Score Inputs */}
        <div className="px-6 py-4 space-y-6">
          {components.map(comp => (
            <div key={comp}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{COMPONENT_LABELS[comp]}</span>
                  <div className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                    {COMPONENT_DESCRIPTIONS[comp]}
                  </div>
                </div>
              </div>

              {/* Score circles */}
              <div className="flex gap-2 my-2">
                {[1, 2, 3, 4, 5].map(val => (
                  <button
                    key={val}
                    onClick={() => setScores(prev => ({ ...prev, [comp]: val }))}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all"
                    style={{
                      background: scores[comp] === val ? 'var(--accent-primary)' : 'transparent',
                      color: scores[comp] === val ? 'white' : 'var(--text-secondary)',
                      border: scores[comp] === val ? '2px solid var(--accent-primary)' : '2px solid var(--border-default)',
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Score meaning */}
              <div className="text-body-sm mb-2" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                {scoreMeanings[comp][scores[comp] - 1]}
              </div>

              {/* Confidence */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-label" style={{ fontSize: '0.5625rem' }}>Confidence:</span>
                {(['A', 'B', 'C'] as Confidence[]).map(c => (
                  <button
                    key={c}
                    onClick={() => setConfidences(prev => ({ ...prev, [comp]: c }))}
                    className="px-2 py-0.5 rounded text-xs font-medium transition-all"
                    style={{
                      background: confidences[comp] === c ? 'var(--accent-primary)' : 'var(--bg-inset)',
                      color: confidences[comp] === c ? 'white' : 'var(--text-secondary)',
                      border: confidences[comp] === c ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Rationale */}
              <textarea
                value={rationales[comp]}
                onChange={(e) => setRationales(prev => ({ ...prev, [comp]: e.target.value }))}
                placeholder="Evidence supporting this score..."
                rows={2}
                className="w-full rounded-lg px-3 py-2 text-body-sm outline-none resize-none"
                style={{
                  background: 'var(--bg-inset)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                }}
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 flex gap-3 px-6 py-4 border-t"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
        >
          <button
            onClick={() => handleSave('draft')}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave('submitted')}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'var(--text-primary)', color: 'white' }}
          >
            Submit for Review
          </button>
        </div>
      </div>
    </>
  );
}
