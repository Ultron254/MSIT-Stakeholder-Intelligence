import { useState, useMemo } from 'react';
import {
  UserPlus, FileText, Plus, Trash2,
  Shield, CheckCircle, Camera,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../lib/store';
import { calculateFullScore, getSISColor } from '../lib/scoring-engine';
import { Card, QuadrantBadge } from '../components/ui/Badges';
import {
  SECTOR_LABELS, COMPONENT_LABELS, COMPONENT_DESCRIPTIONS,
  QUADRANT_COLORS,
} from '../lib/types';
import type {
  Sector, ProximityLayer, Component, Confidence, ScoringInput,
  Stakeholder, ScoreSnapshot, EvidenceRecord,
} from '../lib/types';
import { formatSIS, formatAxis } from '../lib/formatters';
import { NOW } from '../lib/constants';
import { format } from 'date-fns';
import { getInitials } from '../lib/avatar';
const components: Component[] = ['influence', 'relationship', 'risk', 'sentiment', 'alignment', 'impact'];
const sectors: Sector[] = ['politics', 'civil_service', 'business', 'media', 'civil_society', 'international', 'judiciary', 'academia'];

const scoreMeanings: Record<Component, string[]> = {
  influence: ['Negligible', 'Low', 'Moderate', 'High', 'Dominant'],
  relationship: ['None', 'Minimal', 'Developing', 'Strong', 'Deep Access'],
  risk: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
  sentiment: ['Very Negative', 'Negative', 'Neutral', 'Positive', 'Very Positive'],
  alignment: ['Strongly Opposed', 'Opposed', 'Neutral', 'Aligned', 'Strongly Aligned'],
  impact: ['Marginal', 'Limited', 'Moderate', 'Significant', 'Transformative'],
};

interface EvidenceEntry {
  evidence_type: EvidenceRecord['evidence_type'];
  title: string;
  description: string;
  source_url: string;
  sensitivity: 'public' | 'internal' | 'restricted';
}

export default function AddStakeholder() {
  const { addToast, setPage, setSelectedStakeholder } = useAppStore();
  const addStakeholderFn = useAppStore(s => s.addStakeholder);
  const addSnapshot = useAppStore(s => s.addSnapshot);
  const addEvidence = useAppStore(s => s.addEvidence);
  const addActivity = useAppStore(s => s.addActivity);

  // Section 1: Identity
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [sector, setSector] = useState<Sector>('politics');
  const [layer, setLayer] = useState<ProximityLayer>(2);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [sensitive, setSensitive] = useState(false);
  const [, setPortraitFile] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);

  // Section 2: Scoring
  const [scores, setScores] = useState<Record<Component, number>>({
    influence: 3, relationship: 3, risk: 3, sentiment: 3, alignment: 3, impact: 3,
  });
  const [confidences, setConfidences] = useState<Record<Component, Confidence>>({
    influence: 'B', relationship: 'B', risk: 'B', sentiment: 'B', alignment: 'B', impact: 'B',
  });
  const [rationales, setRationales] = useState<Record<Component, string>>({
    influence: '', relationship: '', risk: '', sentiment: '', alignment: '', impact: '',
  });

  // Section 3: Evidence
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>([]);

  // Section 4: Engagement Plan
  const [approach, setApproach] = useState('');
  const [plan30, setPlan30] = useState('');
  const [plan60, setPlan60] = useState('');
  const [plan90, setPlan90] = useState('');

  // Success state
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState('');

  // Live calculation
  const result = useMemo(() => {
    const input: ScoringInput = { ...scores };
    return calculateFullScore(input);
  }, [scores]);

  const radarData = components.map(c => ({
    component: COMPONENT_LABELS[c],
    value: scores[c],
    fullMark: 5,
  }));

  const qColor = QUADRANT_COLORS[result.quadrant];

  const addEvidenceEntry = () => {
    setEvidenceEntries(prev => [...prev, {
      evidence_type: 'meeting_notes',
      title: '',
      description: '',
      source_url: '',
      sensitivity: 'internal',
    }]);
  };

  const updateEvidence = (index: number, updates: Partial<EvidenceEntry>) => {
    setEvidenceEntries(prev => prev.map((e, i) => i === index ? { ...e, ...updates } : e));
  };

  const removeEvidence = (index: number) => {
    setEvidenceEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!fullName.trim() || !title.trim()) {
      addToast('Please fill in name and title', 'error');
      return;
    }
    if (!portraitPreview) {
      addToast('Please upload a portrait photo', 'error');
      return;
    }

    const stakeholderId = `s-new-${Date.now()}`;
    const snapshotId = `snap-new-${Date.now()}`;
    const now = format(NOW, 'yyyy-MM-dd');

    const stakeholder: Stakeholder = {
      id: stakeholderId,
      country_id: 'c-001',
      full_name: fullName.trim(),
      title: title.trim(),
      organization: organization.trim(),
      sector,
      proximity_layer: layer,
      sensitivity_flag: sensitive,
      status: 'active',
      gender,
      portrait_url: portraitPreview,
      created_at: now,
    };

    const snapshot: ScoreSnapshot = {
      id: snapshotId,
      stakeholder_id: stakeholderId,
      objective_id: 'o-001',
      version: 1,
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
      workflow_status: 'submitted',
      scored_by: 'u-001',
      approved_by: null,
      scored_at: now,
      approved_at: null,
    };

    addStakeholderFn(stakeholder);
    addSnapshot(snapshot);

    evidenceEntries.forEach((ev, i) => {
      if (ev.title.trim()) {
        addEvidence({
          id: `ev-new-${Date.now()}-${i}`,
          snapshot_id: snapshotId,
          stakeholder_id: stakeholderId,
          component: components[i % 6],
          evidence_type: ev.evidence_type,
          title: ev.title.trim(),
          description: ev.description.trim(),
          source_url: ev.source_url.trim() || null,
          sensitivity: ev.sensitivity,
          confidence_contribution: 'B',
          recorded_by: 'u-001',
          recorded_at: now,
        });
      }
    });

    addActivity({
      id: `act-new-${Date.now()}`,
      type: 'score_update',
      description: `New stakeholder registered: ${fullName.trim()} — SIS ${formatSIS(result.sis_score)}`,
      stakeholder_id: stakeholderId,
      user_id: 'u-001',
      timestamp: now,
    });

    setSubmitted(true);
    setSubmittedId(stakeholderId);
    addToast('Stakeholder registered successfully', 'success');
  };

  if (submitted) {
    return (
      <div className="page-enter flex items-center justify-center min-h-[60vh]">
        <div className="text-center success-pop">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--brand-primary-bg)' }}>
            <CheckCircle size={32} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <h2 className="text-display-md mb-2" style={{ color: 'var(--text-primary)' }}>Stakeholder Registered</h2>
          <p className="text-body mb-6" style={{ color: 'var(--text-muted)' }}>
            {fullName} has been added to the intelligence portfolio.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSelectedStakeholder(submittedId); }}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--text-primary)', color: 'white' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--text-primary)'; }}
            >
              View Profile
            </button>
            <button
              onClick={() => {
                setSubmitted(false);
                setFullName(''); setTitle(''); setOrganization('');
                setSector('politics'); setLayer(2); setSensitive(false);
                setScores({ influence: 3, relationship: 3, risk: 3, sentiment: 3, alignment: 3, impact: 3 });
                setEvidenceEntries([]);
                setPortraitFile(null);
                setPortraitPreview(null);
              }}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
            >
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6 pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-display-md" style={{ color: 'var(--text-primary)' }}>Register New Stakeholder</h1>
        <p className="text-body mt-1" style={{ color: 'var(--text-muted)' }}>
          Build the intelligence profile for a new stakeholder
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main form column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Identity */}
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent-primary)', color: 'white' }}>01</div>
              <h2 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Stakeholder Identity</h2>
            </div>
            {/* Portrait Upload */}
            <div className="flex flex-col items-center mb-6">
              <label className="cursor-pointer group" htmlFor="portrait-upload">
                <div
                  className="relative rounded-full overflow-hidden transition-all duration-200"
                  style={{
                    width: 120,
                    height: 120,
                    background: portraitPreview ? 'transparent' : 'var(--bg-inset)',
                    border: portraitPreview ? '3px solid var(--brand-primary)' : '2px dashed var(--border-strong)',
                  }}
                >
                  {portraitPreview ? (
                    <img src={portraitPreview} alt="Portrait preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 group-hover:opacity-80 transition-opacity">
                      <Camera size={28} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', fontWeight: 500 }}>Upload Photo</span>
                    </div>
                  )}
                  {portraitPreview && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={24} style={{ color: 'white' }} />
                    </div>
                  )}
                </div>
              </label>
              <input
                id="portrait-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPortraitFile(file);
                    const reader = new FileReader();
                    reader.onload = (ev) => setPortraitPreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {!portraitPreview && (
                <p style={{ color: 'var(--status-danger)', fontSize: '0.6875rem', marginTop: 6 }}>
                  * Portrait photo is required
                </p>
              )}
              {portraitPreview && (
                <button
                  onClick={() => { setPortraitFile(null); setPortraitPreview(null); }}
                  className="mt-2 text-body-sm"
                  style={{ color: 'var(--status-danger)', fontSize: '0.6875rem' }}
                >
                  Remove photo
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-label mb-1.5 block">Full Name <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Hon. John Kamau"
                  className="w-full rounded-lg px-3 py-2.5 text-body-sm outline-none"
                  style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-label mb-1.5 block">Title / Position <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chair, Finance Committee"
                  className="w-full rounded-lg px-3 py-2.5 text-body-sm outline-none"
                  style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-label mb-1.5 block">Organization</label>
                <input type="text" value={organization} onChange={e => setOrganization(e.target.value)} placeholder="e.g. National Assembly"
                  className="w-full rounded-lg px-3 py-2.5 text-body-sm outline-none"
                  style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-label mb-1.5 block">Sector</label>
                <select value={sector} onChange={e => setSector(e.target.value as Sector)}
                  className="w-full rounded-lg px-3 py-2.5 text-body-sm outline-none"
                  style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                >
                  {sectors.map(s => <option key={s} value={s}>{SECTOR_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-label mb-1.5 block">Gender</label>
                <div className="flex gap-2">
                  {(['male', 'female'] as const).map(g => (
                    <button key={g} onClick={() => setGender(g)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                      style={{
                        background: gender === g ? 'var(--accent-primary)' : 'var(--bg-inset)',
                        color: gender === g ? 'white' : 'var(--text-secondary)',
                        border: gender === g ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                      }}
                    >{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-label mb-1.5 block">Proximity Layer</label>
                <div className="flex gap-2">
                  {([1, 2, 3] as ProximityLayer[]).map(l => (
                    <button key={l} onClick={() => setLayer(l)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all text-center"
                      style={{
                        background: layer === l ? 'var(--accent-primary)' : 'var(--bg-inset)',
                        color: layer === l ? 'white' : 'var(--text-secondary)',
                        border: layer === l ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                      }}
                    >
                      {l === 1 ? 'Core' : l === 2 ? 'Inner' : 'Outer'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={sensitive} onChange={e => setSensitive(e.target.checked)} className="rounded" />
                  <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Shield size={12} className="inline mr-1" />
                    Sensitivity flag — restricts visibility
                  </span>
                </label>
              </div>
            </div>
          </Card>

          {/* Section 2: Scoring */}
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent-primary)', color: 'white' }}>02</div>
              <h2 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Initial Assessment</h2>
            </div>
            <div className="space-y-5">
              {components.map(comp => (
                <div key={comp} className="pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{COMPONENT_LABELS[comp]}</span>
                    <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{scores[comp]}/5</span>
                  </div>
                  <div className="text-body-sm mb-2" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                    {COMPONENT_DESCRIPTIONS[comp]}
                  </div>
                  <div className="flex gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button key={val} onClick={() => setScores(prev => ({ ...prev, [comp]: val }))}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all"
                        style={{
                          background: scores[comp] === val ? 'var(--accent-primary)' : 'transparent',
                          color: scores[comp] === val ? 'white' : 'var(--text-secondary)',
                          border: scores[comp] === val ? '2px solid var(--accent-primary)' : '2px solid var(--border-default)',
                        }}
                      >{val}</button>
                    ))}
                  </div>
                  <div className="text-body-sm mb-2" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                    {scoreMeanings[comp][scores[comp] - 1]}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-label" style={{ fontSize: '0.5625rem' }}>Confidence:</span>
                    {(['A', 'B', 'C'] as Confidence[]).map(c => (
                      <button key={c} onClick={() => setConfidences(prev => ({ ...prev, [comp]: c }))}
                        className="px-2 py-0.5 rounded text-xs font-medium transition-all"
                        style={{
                          background: confidences[comp] === c ? 'var(--accent-primary)' : 'var(--bg-inset)',
                          color: confidences[comp] === c ? 'white' : 'var(--text-secondary)',
                          border: confidences[comp] === c ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                        }}
                      >{c}</button>
                    ))}
                  </div>
                  <textarea value={rationales[comp]} onChange={e => setRationales(prev => ({ ...prev, [comp]: e.target.value }))}
                    placeholder="Evidence supporting this score..."
                    rows={2}
                    className="w-full rounded-lg px-3 py-2 text-body-sm outline-none resize-none"
                    style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Section 3: Evidence */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent-primary)', color: 'white' }}>03</div>
                <h2 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Initial Evidence</h2>
              </div>
              <button onClick={addEvidenceEntry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <Plus size={14} /> Add Evidence
              </button>
            </div>
            {evidenceEntries.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={32} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
                <div className="text-body-sm mt-2" style={{ color: 'var(--text-muted)' }}>No evidence entries yet</div>
                <button onClick={addEvidenceEntry}
                  className="text-body-sm mt-2 transition-colors"
                  style={{ color: 'var(--accent-primary)' }}
                >Add first entry</button>
              </div>
            ) : (
              <div className="space-y-4">
                {evidenceEntries.map((ev, i) => (
                  <div key={i} className="rounded-lg p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>Evidence #{i + 1}</span>
                      <button onClick={() => removeEvidence(i)} style={{ color: 'var(--text-muted)' }}><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select value={ev.evidence_type} onChange={e => updateEvidence(i, { evidence_type: e.target.value as EvidenceEntry['evidence_type'] })}
                        className="rounded-lg px-3 py-2 text-body-sm outline-none"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                      >
                        {['meeting_notes', 'media_report', 'social_media', 'official_document', 'third_party_intel', 'direct_observation'].map(t => (
                          <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                      <select value={ev.sensitivity} onChange={e => updateEvidence(i, { sensitivity: e.target.value as EvidenceEntry['sensitivity'] })}
                        className="rounded-lg px-3 py-2 text-body-sm outline-none"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                      >
                        <option value="public">Public</option>
                        <option value="internal">Internal</option>
                        <option value="restricted">Restricted</option>
                      </select>
                      <input type="text" placeholder="Title" value={ev.title} onChange={e => updateEvidence(i, { title: e.target.value })}
                        className="col-span-2 rounded-lg px-3 py-2 text-body-sm outline-none"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                      />
                      <textarea placeholder="Description" value={ev.description} onChange={e => updateEvidence(i, { description: e.target.value })}
                        rows={2}
                        className="col-span-2 rounded-lg px-3 py-2 text-body-sm outline-none resize-none"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                      />
                      <input type="url" placeholder="Source URL (optional)" value={ev.source_url} onChange={e => updateEvidence(i, { source_url: e.target.value })}
                        className="col-span-2 rounded-lg px-3 py-2 text-body-sm outline-none"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Section 4: Engagement Plan */}
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent-primary)', color: 'white' }}>04</div>
              <h2 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Engagement Plan</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-label mb-1.5 block">Strategic Approach</label>
                <textarea value={approach} onChange={e => setApproach(e.target.value)}
                  placeholder="Describe the engagement strategy..."
                  rows={2}
                  className="w-full rounded-lg px-3 py-2 text-body-sm outline-none resize-none"
                  style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-label mb-1.5 block">30-Day Plan</label>
                  <textarea value={plan30} onChange={e => setPlan30(e.target.value)} rows={3}
                    placeholder="First month actions..."
                    className="w-full rounded-lg px-3 py-2 text-body-sm outline-none resize-none"
                    style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-label mb-1.5 block">60-Day Plan</label>
                  <textarea value={plan60} onChange={e => setPlan60(e.target.value)} rows={3}
                    placeholder="Second month actions..."
                    className="w-full rounded-lg px-3 py-2 text-body-sm outline-none resize-none"
                    style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-label mb-1.5 block">90-Day Plan</label>
                  <textarea value={plan90} onChange={e => setPlan90(e.target.value)} rows={3}
                    placeholder="Third month actions..."
                    className="w-full rounded-lg px-3 py-2 text-body-sm outline-none resize-none"
                    style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <button onClick={() => setPage('stakeholders')}
              className="px-6 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
            >Cancel</button>
            <button onClick={handleSubmit}
              className="flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'var(--text-primary)', color: 'white', boxShadow: 'var(--shadow-md)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--text-primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <UserPlus size={16} className="inline mr-2" />
              Submit for Review
            </button>
          </div>
        </div>

        {/* Right column: Live preview */}
        <div className="xl:col-span-1">
          <div className="sticky top-20 space-y-4">
            <Card>
              <h3 className="text-heading-md mb-4" style={{ color: 'var(--text-primary)' }}>Profile Preview</h3>
              
              {/* Portrait placeholder */}
              <div className="flex items-center gap-3 mb-4">
                {portraitPreview ? (
                  <img src={portraitPreview} alt="Preview" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ background: 'var(--brand-primary-bg)', color: 'var(--brand-primary-dark)' }}
                  >
                    {fullName ? getInitials(fullName) : '?'}
                  </div>
                )}
                <div>
                  <div className="text-heading-md" style={{ color: fullName ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {fullName || 'Stakeholder Name'}
                  </div>
                  <div className="text-body-sm" style={{ color: 'var(--text-muted)' }}>
                    {title || 'Title'} · {organization || 'Organization'}
                  </div>
                </div>
              </div>

              {/* Live SIS */}
              <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--bg-secondary)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-label">SIS Score</span>
                  <span className="text-label">Quadrant</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-metric count-animate" style={{ color: getSISColor(result.sis_score), fontSize: '2rem' }}>
                    {formatSIS(result.sis_score)}
                  </span>
                  <QuadrantBadge quadrant={result.quadrant} />
                </div>
                <div className="flex gap-4 mt-2">
                  <div>
                    <span className="text-label" style={{ fontSize: '0.5625rem' }}>Power</span>
                    <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{formatAxis(result.power_axis)}</div>
                  </div>
                  <div>
                    <span className="text-label" style={{ fontSize: '0.5625rem' }}>Convertibility</span>
                    <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{formatAxis(result.convertibility_axis)}</div>
                  </div>
                </div>
              </div>

              {/* Mini radar */}
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border-default)" />
                  <PolarAngleAxis dataKey="component" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke={qColor.dot} fill={qColor.dot} fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
