import { useState } from 'react';
import { useAppStore, scoringWeights } from '../lib/store';
import { Card } from '../components/ui/Badges';
import { COMPONENT_LABELS, COMPONENT_DESCRIPTIONS } from '../lib/types';
import type { Component } from '../lib/types';

export default function ScoringConfig() {
  const addToast = useAppStore(s => s.addToast);

  const [weights, setWeights] = useState({
    influence: scoringWeights.influence_weight,
    relationship: scoringWeights.relationship_weight,
    risk: scoringWeights.risk_weight,
    sentiment: scoringWeights.sentiment_weight,
    alignment: scoringWeights.alignment_weight,
    impact: scoringWeights.impact_weight,
  });

  const [powerThreshold, setPowerThreshold] = useState(scoringWeights.power_threshold);
  const [convertibilityThreshold, setConvertibilityThreshold] = useState(scoringWeights.convertibility_threshold);
  const [missingRule, setMissingRule] = useState(scoringWeights.missing_data_rule);

  const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);
  const isValid = Math.abs(totalWeight - 1.0) < 0.01;

  const components: Component[] = ['influence', 'relationship', 'risk', 'sentiment', 'alignment', 'impact'];

  const colorForWeight = (w: number) => {
    if (w >= 0.25) return 'var(--accent-primary)';
    if (w >= 0.15) return 'var(--quadrant-ally)';
    return 'var(--quadrant-hidden)';
  };

  return (
    <div className="page-enter space-y-5">
      <div>
        <h1 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Scoring Configuration</h1>
        <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Manage scoring weights, thresholds, and calculation rules
        </p>
      </div>

      {/* Weight Visualization */}
      <Card>
        <h2 className="text-heading-md mb-4" style={{ color: 'var(--text-primary)' }}>Component Weights</h2>

        {/* Stacked bar visualization */}
        <div className="flex h-8 rounded-lg overflow-hidden mb-6" style={{ background: 'var(--bg-inset)' }}>
          {components.map((c) => (
            <div
              key={c}
              className="flex items-center justify-center text-xs font-medium transition-all"
              style={{
                width: `${weights[c] * 100}%`,
                background: colorForWeight(weights[c]),
                color: 'white',
                minWidth: weights[c] > 0.08 ? 40 : 0,
              }}
            >
              {weights[c] >= 0.1 ? `${(weights[c] * 100).toFixed(0)}%` : ''}
            </div>
          ))}
        </div>

        {/* Weight inputs */}
        <div className="space-y-4">
          {components.map((c) => (
            <div key={c} className="flex items-center gap-4">
              <div className="w-40">
                <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{COMPONENT_LABELS[c]}</div>
                <div className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{COMPONENT_DESCRIPTIONS[c].slice(0, 50)}...</div>
              </div>
              <div className="flex-1">
                <input
                  type="range"
                  min={0} max={0.5} step={0.05}
                  value={weights[c]}
                  onChange={(e) => setWeights(prev => ({ ...prev, [c]: parseFloat(e.target.value) }))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div className="w-16 font-mono text-sm text-right" style={{ color: 'var(--text-primary)' }}>
                {(weights[c] * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <span className="text-body-sm" style={{ color: isValid ? 'var(--status-success)' : 'var(--status-danger)' }}>
              Total: {(totalWeight * 100).toFixed(0)}%
            </span>
            {!isValid && (
              <span className="text-body-sm" style={{ color: 'var(--status-danger)' }}>
                (must equal 100%)
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setWeights({
                influence: 0.30, relationship: 0.20, risk: 0.15,
                sentiment: 0.15, alignment: 0.10, impact: 0.10,
              });
            }}
            className="text-body-sm"
            style={{ color: 'var(--accent-primary)' }}
          >
            Reset to defaults
          </button>
        </div>
      </Card>

      {/* Thresholds */}
      <Card>
        <h2 className="text-heading-md mb-4" style={{ color: 'var(--text-primary)' }}>Quadrant Thresholds</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-label mb-2 block">Power Threshold</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={2} max={5} step={0.1}
                value={powerThreshold}
                onChange={(e) => setPowerThreshold(parseFloat(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <span className="font-mono text-sm w-10" style={{ color: 'var(--text-primary)' }}>{powerThreshold.toFixed(1)}</span>
            </div>
            <p className="text-body-sm mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
              Stakeholders with Power &ge; {powerThreshold.toFixed(1)} are classified as High Power
            </p>
          </div>
          <div>
            <label className="text-label mb-2 block">Convertibility Threshold</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={2} max={5} step={0.1}
                value={convertibilityThreshold}
                onChange={(e) => setConvertibilityThreshold(parseFloat(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <span className="font-mono text-sm w-10" style={{ color: 'var(--text-primary)' }}>{convertibilityThreshold.toFixed(1)}</span>
            </div>
            <p className="text-body-sm mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
              Stakeholders with Convertibility &ge; {convertibilityThreshold.toFixed(1)} are classified as High Convertibility
            </p>
          </div>
        </div>
      </Card>

      {/* Missing Data Rule */}
      <Card>
        <h2 className="text-heading-md mb-4" style={{ color: 'var(--text-primary)' }}>Missing Data Handling</h2>
        <div className="flex gap-3">
          {(['rescale', 'midpoint'] as const).map(rule => (
            <button
              key={rule}
              onClick={() => setMissingRule(rule)}
              className="flex-1 p-4 rounded-lg text-left transition-all"
              style={{
                background: missingRule === rule ? 'var(--bg-secondary)' : 'transparent',
                border: missingRule === rule ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
              }}
            >
              <div className="text-heading-sm capitalize mb-1" style={{ color: 'var(--text-primary)' }}>{rule}</div>
              <div className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {rule === 'rescale'
                  ? 'Rescale available weights to sum to 1.0 when components are missing'
                  : 'Substitute midpoint value (3) for missing components'
                }
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={() => addToast('Configuration saved successfully', 'success')}
          disabled={!isValid}
          className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          style={{ background: 'var(--text-primary)', color: 'white' }}
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
