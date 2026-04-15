// ============================================================
// MSIT Core Type Definitions
// ============================================================

export interface Country {
  id: string;
  code: string;
  name: string;
  region: string;
  is_active: boolean;
}

export interface Objective {
  id: string;
  country_id: string;
  name: string;
  description: string;
  policy_domain: string;
  target_date: string;
  status: 'active' | 'completed' | 'archived';
}

export type Sector = 'politics' | 'civil_service' | 'business' | 'media' | 'civil_society' | 'international' | 'judiciary' | 'academia';
export type ProximityLayer = 1 | 2 | 3;
export type Quadrant = 'strategic_ally' | 'power_gap' | 'hidden_champion' | 'monitor_exit';
export type Confidence = 'A' | 'B' | 'C';
export type WorkflowStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type Component = 'influence' | 'relationship' | 'risk' | 'sentiment' | 'alignment' | 'impact';

export interface Stakeholder {
  id: string;
  country_id: string;
  full_name: string;
  title: string;
  organization: string;
  sector: Sector;
  proximity_layer: ProximityLayer;
  sensitivity_flag: boolean;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
}

export interface StakeholderObjective {
  id: string;
  stakeholder_id: string;
  objective_id: string;
  relevance_score: number;
  position: 'champion' | 'supporter' | 'neutral' | 'opponent' | 'unknown';
}

export interface ComponentScore {
  id: string;
  snapshot_id: string;
  component: Component;
  score: number;
  rationale: string;
  confidence: Confidence;
}

export interface ScoreSnapshot {
  id: string;
  stakeholder_id: string;
  objective_id: string;
  version: number;
  influence_score: number;
  relationship_score: number;
  risk_score: number;
  sentiment_score: number;
  alignment_score: number;
  impact_score: number;
  risk_adjusted: number;
  sis_score: number;
  power_axis: number;
  convertibility_axis: number;
  quadrant: Quadrant;
  overall_confidence: Confidence;
  workflow_status: WorkflowStatus;
  scored_by: string;
  approved_by: string | null;
  scored_at: string;
  approved_at: string | null;
}

export interface EvidenceRecord {
  id: string;
  snapshot_id: string;
  stakeholder_id: string;
  component: string;
  evidence_type: 'meeting_notes' | 'media_report' | 'social_media' | 'official_document' | 'third_party_intel' | 'direct_observation';
  title: string;
  description: string;
  source_url: string | null;
  sensitivity: 'public' | 'internal' | 'restricted';
  confidence_contribution: Confidence;
  recorded_by: string;
  recorded_at: string;
}

export interface EngagementRecord {
  id: string;
  stakeholder_id: string;
  objective_id: string;
  engagement_type: 'meeting' | 'phone_call' | 'email' | 'event' | 'social' | 'third_party_intro' | 'formal_submission';
  date: string;
  description: string;
  outcome: 'positive' | 'neutral' | 'negative' | 'pending';
  follow_up_required: boolean;
  follow_up_date: string | null;
  logged_by: string;
}

export interface EngagementPlan {
  id: string;
  stakeholder_id: string;
  objective_id: string;
  current_quadrant: Quadrant;
  target_quadrant: Quadrant | null;
  approach: string;
  plan_30_day: string;
  plan_60_day: string;
  plan_90_day: string;
  assigned_to: string;
  status: 'active' | 'completed' | 'paused';
}

export interface WatchlistSignal {
  id: string;
  stakeholder_id: string;
  signal_type: 'quadrant_change' | 'sis_drop' | 'sis_rise' | 'stale_assessment' | 'confidence_downgrade' | 'engagement_overdue' | 'red_flag_triggered';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  is_resolved: boolean;
  triggered_at: string;
  resolved_at: string | null;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: 'analyst' | 'country_lead' | 'approver' | 'viewer' | 'admin';
  country_access: string[];
  is_active: boolean;
}

export interface ScoringWeights {
  id: string;
  version: number;
  influence_weight: number;
  relationship_weight: number;
  risk_weight: number;
  sentiment_weight: number;
  alignment_weight: number;
  impact_weight: number;
  power_threshold: number;
  convertibility_threshold: number;
  missing_data_rule: 'rescale' | 'midpoint';
  is_current: boolean;
}

// Derived / computed types
export interface StakeholderWithScore extends Stakeholder {
  latestSnapshot: ScoreSnapshot | null;
  engagementCount: number;
  lastEngagementDate: string | null;
  redFlags: RedFlag[];
}

export interface RedFlag {
  type: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
}

export interface ScoringInput {
  influence: number;
  relationship: number;
  risk: number;
  sentiment: number;
  alignment: number;
  impact: number;
}

export interface ScoringResult {
  risk_adjusted: number;
  sis_score: number;
  power_axis: number;
  convertibility_axis: number;
  quadrant: Quadrant;
}

export const QUADRANT_LABELS: Record<Quadrant, string> = {
  strategic_ally: 'Strategic Ally',
  power_gap: 'Power Gap',
  hidden_champion: 'Hidden Champion',
  monitor_exit: 'Monitor / Exit',
};

export const QUADRANT_COLORS: Record<Quadrant, { bg: string; text: string; border: string; dot: string }> = {
  strategic_ally: { bg: '#EBF5EE', text: '#1B5E30', border: '#2D7D46', dot: '#2D7D46' },
  power_gap: { bg: '#FBEAEA', text: '#922B21', border: '#C0392B', dot: '#C0392B' },
  hidden_champion: { bg: '#FDF6E3', text: '#9A7611', border: '#D4A017', dot: '#D4A017' },
  monitor_exit: { bg: '#F2F3F3', text: '#5D6868', border: '#7F8C8D', dot: '#7F8C8D' },
};

export const SECTOR_LABELS: Record<Sector, string> = {
  politics: 'Politics',
  civil_service: 'Civil Service',
  business: 'Business',
  media: 'Media',
  civil_society: 'Civil Society',
  international: 'International',
  judiciary: 'Judiciary',
  academia: 'Academia',
};

export const COMPONENT_LABELS: Record<Component, string> = {
  influence: 'Influence',
  relationship: 'Relationship',
  risk: 'Risk',
  sentiment: 'Sentiment',
  alignment: 'Alignment',
  impact: 'Impact',
};

export const COMPONENT_DESCRIPTIONS: Record<Component, string> = {
  influence: 'Ability to shape policy outcomes through formal or informal channels',
  relationship: 'Quality and depth of existing relationship with the advocacy team',
  risk: 'Potential to negatively impact objectives (higher = riskier)',
  sentiment: 'Current disposition towards the policy objective',
  alignment: 'Strategic interest alignment with campaign goals',
  impact: 'Potential magnitude of contribution to desired outcome',
};
