import { format, subDays, subMonths } from 'date-fns';
import type {
  Country, Objective, Stakeholder, StakeholderObjective, ScoreSnapshot,
  ComponentScore, EvidenceRecord, EngagementRecord, EngagementPlan,
  WatchlistSignal, User, ScoringWeights, Confidence, Sector, Component
} from './types';
import { calculateFullScore } from './scoring-engine';

// ============================================================
// Reference date: April 15 2026
// ============================================================
const NOW = new Date('2026-04-15');
const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

// ============================================================
// Countries
// ============================================================
export const countries: Country[] = [
  { id: 'c-001', code: 'KEN', name: 'Kenya', region: 'East Africa', is_active: true },
];

// ============================================================
// Objectives
// ============================================================
export const objectives: Objective[] = [
  {
    id: 'o-001', country_id: 'c-001',
    name: 'Renewable Energy Amendment Bill 2026',
    description: 'Comprehensive legislation to accelerate Kenya\'s transition to 100% renewable energy by 2030',
    policy_domain: 'Energy & Climate', target_date: '2026-06-30', status: 'active',
  },
];

// ============================================================
// Users
// ============================================================
export const users: User[] = [
  { id: 'u-001', email: 'sarah.wanjiku@momentum.africa', display_name: 'Sarah Wanjiku', role: 'analyst', country_access: ['c-001'], is_active: true },
  { id: 'u-002', email: 'james.ochieng@momentum.africa', display_name: 'James Ochieng', role: 'country_lead', country_access: ['c-001'], is_active: true },
  { id: 'u-003', email: 'amara.diallo@momentum.africa', display_name: 'Amara Diallo', role: 'approver', country_access: ['c-001'], is_active: true },
  { id: 'u-004', email: 'peter.maina@momentum.africa', display_name: 'Peter Maina', role: 'viewer', country_access: ['c-001'], is_active: true },
  { id: 'u-005', email: 'admin@momentum.africa', display_name: 'System Admin', role: 'admin', country_access: ['c-001'], is_active: true },
];

// ============================================================
// Scoring Weights
// ============================================================
export const scoringWeights: ScoringWeights = {
  id: 'sw-001', version: 1,
  influence_weight: 0.30, relationship_weight: 0.20, risk_weight: 0.15,
  sentiment_weight: 0.15, alignment_weight: 0.10, impact_weight: 0.10,
  power_threshold: 4.0, convertibility_threshold: 4.0,
  missing_data_rule: 'rescale', is_current: true,
};

// ============================================================
// Stakeholder raw definitions
// ============================================================
interface StakeholderDef {
  id: string; name: string; title: string; org: string; sector: Sector;
  layer: 1|2|3; sensitive: boolean;
  I: number; R: number; K: number; S: number; A: number; M: number;
}

const stakeholderDefs: StakeholderDef[] = [
  // ---- STRATEGIC ALLIES (12) ----
  { id:'s-001', name:'Dr. Sarah Wanjiku', title:'Principal Secretary, Energy', org:'Ministry of Energy', sector:'civil_service', layer:1, sensitive:false, I:5,R:4,K:1,S:5,A:5,M:4 },
  { id:'s-002', name:'Grace Akinyi', title:'Director, Climate Policy', org:'Ministry of Environment', sector:'civil_service', layer:2, sensitive:false, I:4,R:5,K:2,S:5,A:4,M:4 },
  { id:'s-003', name:'Hon. Fatuma Hassan', title:'Chair, Energy Committee', org:'National Assembly', sector:'politics', layer:1, sensitive:false, I:5,R:4,K:2,S:4,A:5,M:5 },
  { id:'s-004', name:'Michael Odhiambo', title:'CEO', org:'Kenya Renewable Energy Assoc.', sector:'business', layer:2, sensitive:false, I:4,R:5,K:1,S:5,A:5,M:4 },
  { id:'s-005', name:'Dr. Amina Abdullahi', title:'Commissioner', org:'Energy & Petroleum Regulatory Auth.', sector:'civil_service', layer:1, sensitive:false, I:5,R:4,K:1,S:4,A:4,M:5 },
  { id:'s-006', name:'Joseph Kipchoge', title:'Senior Editor, Energy Desk', org:'The Standard', sector:'media', layer:2, sensitive:false, I:4,R:4,K:2,S:5,A:4,M:4 },
  { id:'s-007', name:'Dr. Rebecca Muthoni', title:'Program Director', org:'UNDP Kenya', sector:'international', layer:2, sensitive:false, I:4,R:5,K:1,S:5,A:5,M:4 },
  { id:'s-008', name:'Prof. David Ngugi', title:'Dean, Engineering', org:'University of Nairobi', sector:'academia', layer:3, sensitive:false, I:4,R:4,K:1,S:5,A:5,M:4 },
  { id:'s-009', name:'Catherine Wambua', title:'Executive Director', org:'Kenya Climate Innovation Centre', sector:'civil_society', layer:2, sensitive:false, I:4,R:5,K:1,S:5,A:5,M:4 },
  { id:'s-010', name:'Hon. Samuel Mwaniki', title:'Vice Chair, Environment Committee', org:'National Assembly', sector:'politics', layer:2, sensitive:false, I:4,R:4,K:2,S:4,A:5,M:4 },
  { id:'s-011', name:'Anne Njeri', title:'Director, Green Energy', org:'KenGen', sector:'business', layer:2, sensitive:false, I:4,R:4,K:1,S:5,A:5,M:4 },
  { id:'s-012', name:'Hassan Ali', title:'Country Director', org:'GIZ Kenya', sector:'international', layer:2, sensitive:false, I:4,R:4,K:1,S:4,A:5,M:4 },

  // ---- POWER GAPS (15) ----
  { id:'s-013', name:'Hon. James Mwangi Kamau', title:'Deputy Speaker', org:'National Assembly', sector:'politics', layer:1, sensitive:true, I:5,R:3,K:3,S:3,A:2,M:5 },
  { id:'s-014', name:'Hon. Richard Koech', title:'Majority Whip', org:'National Assembly', sector:'politics', layer:1, sensitive:true, I:5,R:3,K:3,S:3,A:2,M:5 },
  { id:'s-015', name:'Gen. Peter Mburu (Rtd)', title:'CEO', org:'Kenya Pipeline', sector:'business', layer:2, sensitive:true, I:4,R:2,K:5,S:2,A:1,M:4 },
  { id:'s-016', name:'Stephen Letoo', title:'CEO', org:'Kenya Petroleum Refineries', sector:'business', layer:2, sensitive:true, I:4,R:1,K:5,S:2,A:1,M:4 },
  { id:'s-017', name:'Hon. Moses Kuria', title:'MP, Gatundu South', org:'National Assembly', sector:'politics', layer:2, sensitive:false, I:4,R:2,K:4,S:3,A:2,M:4 },
  { id:'s-018', name:'Dr. Wilson Songa', title:'Commissioner General', org:'KRA', sector:'civil_service', layer:1, sensitive:true, I:5,R:2,K:3,S:3,A:2,M:5 },
  { id:'s-019', name:'Jacob Kaimenyi', title:'CEO', org:'National Oil Corporation', sector:'business', layer:2, sensitive:true, I:4,R:2,K:5,S:2,A:1,M:4 },
  { id:'s-020', name:'Hon. George Muchiri', title:'Chair, Finance Committee', org:'National Assembly', sector:'politics', layer:1, sensitive:true, I:5,R:3,K:3,S:3,A:2,M:5 },
  { id:'s-021', name:'Paul Wekesa', title:'MD', org:'Total Energies Kenya', sector:'business', layer:2, sensitive:false, I:4,R:2,K:4,S:2,A:2,M:4 },
  { id:'s-022', name:'Mary Waceera', title:'County Commissioner', org:'Nairobi County', sector:'civil_service', layer:2, sensitive:false, I:4,R:3,K:3,S:3,A:2,M:4 },
  { id:'s-023', name:'Anthony Mwaura', title:'Director', org:'KEBS', sector:'civil_service', layer:3, sensitive:false, I:4,R:2,K:3,S:3,A:2,M:4 },
  { id:'s-024', name:'Victoria Kimani', title:'CEO', org:'ICDC', sector:'business', layer:2, sensitive:false, I:4,R:2,K:3,S:3,A:3,M:4 },
  { id:'s-025', name:'Hon. Patrick Makau', title:'Senate Majority Whip', org:'Senate', sector:'politics', layer:1, sensitive:true, I:5,R:3,K:3,S:3,A:2,M:4 },
  { id:'s-026', name:'Prof. James Ogola', title:'Chair', org:'National Environment Management Authority', sector:'civil_service', layer:2, sensitive:false, I:4,R:2,K:3,S:3,A:3,M:4 },
  { id:'s-027', name:'Elizabeth Maina', title:'Head of Energy Practice', org:'PwC East Africa', sector:'business', layer:3, sensitive:false, I:4,R:2,K:2,S:3,A:3,M:4 },

  // ---- HIDDEN CHAMPIONS (8) ----
  { id:'s-028', name:'Peter Kariuki', title:'CEO', org:'Kenya Power', sector:'business', layer:2, sensitive:false, I:3,R:4,K:2,S:4,A:4,M:3 },
  { id:'s-029', name:'Mary Njoroge', title:'MP, Nairobi County', org:'National Assembly', sector:'politics', layer:2, sensitive:false, I:3,R:5,K:2,S:5,A:4,M:3 },
  { id:'s-030', name:'Charles Ongwae', title:'Director, Energy Planning', org:'Ministry of Energy', sector:'civil_service', layer:3, sensitive:false, I:3,R:4,K:1,S:4,A:5,M:3 },
  { id:'s-031', name:'Elizabeth Omondi', title:'Legal Counsel', org:'Energy Tribunal', sector:'judiciary', layer:3, sensitive:false, I:3,R:4,K:2,S:4,A:5,M:2 },
  { id:'s-032', name:'James Nyakundi', title:'Program Manager', org:'World Bank Kenya', sector:'international', layer:3, sensitive:false, I:3,R:5,K:1,S:5,A:5,M:3 },
  { id:'s-033', name:'Agnes Chebet', title:'Journalist', org:'Citizen TV', sector:'media', layer:3, sensitive:false, I:3,R:4,K:2,S:5,A:4,M:2 },
  { id:'s-034', name:'Kenneth Muturi', title:'Coordinator', org:'Youth Climate Action', sector:'civil_society', layer:3, sensitive:false, I:2,R:5,K:1,S:5,A:5,M:2 },
  { id:'s-035', name:'Rachel Atieno', title:'Energy Economist', org:'Kenya Institute for Public Policy Research', sector:'academia', layer:3, sensitive:false, I:3,R:4,K:1,S:5,A:5,M:3 },

  // ---- MONITOR / EXIT (12) ----
  { id:'s-036', name:'Thomas Kiprotich', title:'Junior Officer', org:'Ministry of Energy', sector:'civil_service', layer:3, sensitive:false, I:2,R:2,K:3,S:3,A:2,M:2 },
  { id:'s-037', name:'Jane Achieng', title:'Reporter', org:'Daily Nation', sector:'media', layer:3, sensitive:false, I:2,R:2,K:4,S:2,A:2,M:2 },
  { id:'s-038', name:'Samuel Otieno', title:'Backbencher MP', org:'National Assembly', sector:'politics', layer:3, sensitive:false, I:2,R:1,K:4,S:2,A:2,M:2 },
  { id:'s-039', name:'Daniel Mwanzia', title:'Small Business Owner', org:'SME Federation', sector:'business', layer:3, sensitive:false, I:1,R:2,K:3,S:3,A:2,M:1 },
  { id:'s-040', name:'Esther Kamau', title:'Junior Researcher', org:'Kenya Power', sector:'business', layer:3, sensitive:false, I:2,R:3,K:3,S:3,A:3,M:2 },
  { id:'s-041', name:'Philip Ochieng', title:'Community Organizer', org:'Nairobi Residents Association', sector:'civil_society', layer:3, sensitive:false, I:2,R:2,K:3,S:2,A:3,M:1 },
  { id:'s-042', name:'Margaret Wanjiku', title:'Retired Diplomat', org:'Independent', sector:'politics', layer:3, sensitive:false, I:3,R:2,K:2,S:3,A:3,M:2 },
  { id:'s-043', name:'George Oloo', title:'Reporter', org:'KTN', sector:'media', layer:3, sensitive:false, I:2,R:1,K:4,S:2,A:2,M:2 },
  { id:'s-044', name:'Francis Njuguna', title:'District Officer', org:'Kiambu County', sector:'civil_service', layer:3, sensitive:false, I:2,R:2,K:3,S:3,A:2,M:2 },
  { id:'s-045', name:'Susan Cherop', title:'NGO Coordinator', org:'Water & Sanitation Network', sector:'civil_society', layer:3, sensitive:false, I:2,R:3,K:3,S:3,A:3,M:2 },
  { id:'s-046', name:'Robert Kiptoo', title:'Lecturer', org:'Kenyatta University', sector:'academia', layer:3, sensitive:false, I:2,R:2,K:2,S:3,A:3,M:2 },
  { id:'s-047', name:'Mercy Wangui', title:'Administrative Officer', org:'EPRA', sector:'civil_service', layer:3, sensitive:false, I:2,R:2,K:3,S:3,A:2,M:2 },
];

// ============================================================
// Build stakeholder objects
// ============================================================
export const stakeholders: Stakeholder[] = stakeholderDefs.map((d, i) => ({
  id: d.id,
  country_id: 'c-001',
  full_name: d.name,
  title: d.title,
  organization: d.org,
  sector: d.sector,
  proximity_layer: d.layer,
  sensitivity_flag: d.sensitive,
  status: 'active' as const,
  created_at: fmt(subDays(NOW, 180 - i * 3)),
}));

// ============================================================
// Stakeholder-Objective links
// ============================================================
export const stakeholderObjectives: StakeholderObjective[] = stakeholderDefs.map((d, i) => {
  const result = calculateFullScore({ influence: d.I, relationship: d.R, risk: d.K, sentiment: d.S, alignment: d.A, impact: d.M });
  let position: StakeholderObjective['position'] = 'neutral';
  if (result.quadrant === 'strategic_ally') position = 'champion';
  else if (result.quadrant === 'hidden_champion') position = 'supporter';
  else if (result.quadrant === 'power_gap') position = d.S >= 3 ? 'neutral' : 'opponent';
  else position = 'unknown';
  return {
    id: `so-${String(i+1).padStart(3,'0')}`,
    stakeholder_id: d.id,
    objective_id: 'o-001',
    relevance_score: Math.min(5, Math.max(1, Math.round((d.I + d.M) / 2))),
    position,
  };
});

// ============================================================
// Score Snapshots (with historical versions for 15 stakeholders)
// ============================================================
function buildSnapshot(
  id: string, sid: string, version: number,
  I: number, R: number, K: number, S: number, A: number, M: number,
  scoredAt: Date, status: 'draft'|'submitted'|'approved' = 'approved',
  scoredBy: string = 'u-001', approvedBy: string|null = 'u-003'
): ScoreSnapshot {
  const result = calculateFullScore({ influence:I, relationship:R, risk:K, sentiment:S, alignment:A, impact:M });
  return {
    id, stakeholder_id: sid, objective_id: 'o-001', version,
    influence_score: I, relationship_score: R, risk_score: K,
    sentiment_score: S, alignment_score: A, impact_score: M,
    risk_adjusted: result.risk_adjusted,
    sis_score: result.sis_score,
    power_axis: result.power_axis,
    convertibility_axis: result.convertibility_axis,
    quadrant: result.quadrant,
    overall_confidence: 'B',
    workflow_status: status, scored_by: scoredBy,
    approved_by: status === 'approved' ? approvedBy : null,
    scored_at: fmt(scoredAt),
    approved_at: status === 'approved' ? fmt(subDays(scoredAt, -2)) : null,
  };
}

const snapshotsArr: ScoreSnapshot[] = [];
let snapIdx = 1;

// Current (latest) snapshots for ALL stakeholders
stakeholderDefs.forEach((d) => {
  const snap = buildSnapshot(
    `snap-${String(snapIdx++).padStart(4,'0')}`, d.id, 1,
    d.I, d.R, d.K, d.S, d.A, d.M,
    subMonths(NOW, 1)
  );
  // Set specific confidence per quadrant type
  if (d.id === 's-001' || d.id === 's-003' || d.id === 's-005') snap.overall_confidence = 'A';
  if (d.id === 's-036' || d.id === 's-043') snap.overall_confidence = 'C';
  snapshotsArr.push(snap);
});

// Historical snapshots for 15 key stakeholders (showing evolution)
// s-001 Dr Sarah Wanjiku: was slightly lower, improved
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-001',0, 4,3,2,4,4,3, subMonths(NOW,6)));
// s-003 Hon Fatuma Hassan: was lower relationship
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-003',0, 5,2,3,3,4,4, subMonths(NOW,5)));
// s-004 Michael Odhiambo: was in hidden champion, moved to strategic ally
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-004',0, 3,4,1,5,4,3, subMonths(NOW,5)));
// s-007 Dr Rebecca Muthoni
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-007',0, 3,4,2,4,4,3, subMonths(NOW,4)));
// s-009 Catherine Wambua
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-009',0, 3,4,2,4,4,3, subMonths(NOW,4)));
// s-013 Hon James Mwangi Kamau: was in monitor, moved to power gap
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-013',0, 3,2,4,2,2,3, subMonths(NOW,6)));
// s-015 Gen Peter Mburu
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-015',0, 4,1,5,1,1,3, subMonths(NOW,5)));
// s-018 Dr Wilson Songa
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-018',0, 4,1,4,2,2,4, subMonths(NOW,4)));
// s-020 Hon George Muchiri
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-020',0, 4,2,4,2,1,4, subMonths(NOW,5)));
// s-025 Hon Patrick Makau
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-025',0, 4,2,4,2,1,3, subMonths(NOW,4)));
// s-028 Peter Kariuki
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-028',0, 2,3,3,3,3,2, subMonths(NOW,5)));
// s-029 Mary Njoroge: was monitor, improved to hidden champion
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-029',0, 2,3,3,3,3,2, subMonths(NOW,6)));
// s-032 James Nyakundi
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-032',0, 2,4,2,4,4,2, subMonths(NOW,4)));
// s-035 Rachel Atieno
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-035',0, 2,3,2,4,4,2, subMonths(NOW,3)));
// s-042 Margaret Wanjiku
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-042',0, 3,3,2,3,4,2, subMonths(NOW,4)));

// Add intermediate versions for s-004 and s-029 (quadrant changers)
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-004',0, 3,5,1,5,5,3, subMonths(NOW,3), 'approved','u-001','u-002'));
snapshotsArr.push(buildSnapshot(`snap-${String(snapIdx++).padStart(4,'0')}`,'s-029',0, 3,4,2,4,3,3, subMonths(NOW,3), 'approved','u-001','u-002'));

export const scoreSnapshots: ScoreSnapshot[] = snapshotsArr;

// Helper to get latest snapshot for a stakeholder
export function getLatestSnapshot(stakeholderId: string): ScoreSnapshot | null {
  const stakeholderSnaps = snapshotsArr
    .filter(s => s.stakeholder_id === stakeholderId)
    .sort((a, b) => new Date(b.scored_at).getTime() - new Date(a.scored_at).getTime());
  return stakeholderSnaps[0] ?? null;
}

// ============================================================
// Component Scores linked to snapshots
// ============================================================
const components: Component[] = ['influence','relationship','risk','sentiment','alignment','impact'];
export const componentScores: ComponentScore[] = snapshotsArr.flatMap(snap => {
  const scores: Record<Component, number> = {
    influence: snap.influence_score, relationship: snap.relationship_score,
    risk: snap.risk_score, sentiment: snap.sentiment_score,
    alignment: snap.alignment_score, impact: snap.impact_score,
  };
  const rationales: Record<Component, string> = {
    influence: 'Based on formal authority, positional power in the legislative/executive process, and observed ability to mobilize support.',
    relationship: 'Assessed from frequency and quality of direct engagements, existing rapport, and mutual trust indicators.',
    risk: 'Evaluated considering potential for opposition, public unpredictability, and history of blocking similar initiatives.',
    sentiment: 'Inferred from recent public statements, private meeting tone, and media positioning on the energy transition.',
    alignment: 'Determined by overlap between stakeholder\'s stated priorities and the bill\'s core provisions.',
    impact: 'Estimated potential contribution magnitude if fully engaged, including vote influence, funding, or public legitimacy.',
  };
  return components.map((comp, ci) => ({
    id: `cs-${snap.id}-${ci}`,
    snapshot_id: snap.id,
    component: comp,
    score: scores[comp],
    rationale: rationales[comp],
    confidence: snap.overall_confidence as Confidence,
  }));
});

// ============================================================
// Evidence Records (~200)
// ============================================================
const evidenceTypes: EvidenceRecord['evidence_type'][] = ['meeting_notes','media_report','social_media','official_document','third_party_intel','direct_observation'];
const evidenceTitles: string[] = [
  'Energy Committee briefing notes','Policy position paper analysis','Media coverage review','Social media sentiment scan',
  'Third-party intelligence report','Direct meeting observation notes','Official government gazette entry','Press conference transcript',
  'Legislative voting record analysis','Industry association position statement','Donor country strategy alignment review','Civil society coalition statement',
  'Academic policy brief','Internal strategy memorandum','Public hearing testimony record','Bilateral meeting debrief',
  'Regulatory filing analysis','Corporate sustainability report review','Trade association lobbying disclosure','International framework alignment assessment',
];

export const evidenceRecords: EvidenceRecord[] = [];
let evIdx = 1;

stakeholderDefs.forEach((d, si) => {
  // Strategic allies and power gaps get more evidence
  const count = si < 12 ? 6 : si < 27 ? 5 : si < 35 ? 3 : 2;
  for (let j = 0; j < count; j++) {
    evidenceRecords.push({
      id: `ev-${String(evIdx++).padStart(4,'0')}`,
      snapshot_id: snapshotsArr.find(s => s.stakeholder_id === d.id)?.id ?? '',
      stakeholder_id: d.id,
      component: components[j % 6],
      evidence_type: evidenceTypes[(si + j) % evidenceTypes.length],
      title: evidenceTitles[(si * 3 + j) % evidenceTitles.length],
      description: `Detailed analysis of ${d.name}'s position regarding the Renewable Energy Amendment Bill. This evidence was gathered through ${evidenceTypes[(si + j) % evidenceTypes.length].replace(/_/g,' ')} and directly informs the ${components[j % 6]} scoring for this stakeholder.`,
      source_url: null,
      sensitivity: si < 5 ? 'restricted' : si < 20 ? 'internal' : 'public',
      confidence_contribution: si < 15 ? 'A' : si < 30 ? 'B' : 'C',
      recorded_by: si % 2 === 0 ? 'u-001' : 'u-002',
      recorded_at: fmt(subDays(NOW, 30 + j * 10 + si)),
    });
  }
});

// ============================================================
// Engagement Records (51)
// ============================================================
const engagementTypes: EngagementRecord['engagement_type'][] = ['meeting','phone_call','email','event','social','third_party_intro','formal_submission'];
const engagementDescriptions = [
  'Policy briefing on Bill provisions and implementation timeline',
  'Follow-up discussion on regulatory alignment concerns',
  'Technical presentation on renewable energy targets and cost projections',
  'Stakeholder alignment meeting on committee strategy',
  'Introductory meeting facilitated through mutual contact',
  'Formal submission of policy brief and supporting documentation',
  'Multi-stakeholder roundtable on energy transition financing',
  'One-on-one consultation on political feasibility assessment',
  'Joint press briefing on climate action commitments',
  'Working group session on amendment drafting',
  'Donor coordination meeting on energy sector funding',
  'Civil society consultation on community impact assessment',
  'Private dinner discussion on legislative calendar',
  'Technical working group on grid modernization standards',
  'Parliamentary committee hearing testimony',
];

export const engagementRecords: EngagementRecord[] = [];
let engIdx = 1;

// Generate engagements — more for strategic allies and power gaps
stakeholderDefs.slice(0, 35).forEach((d, si) => {
  const count = si < 12 ? 2 : si < 27 ? 1 : 1;
  for (let j = 0; j < count; j++) {
    const daysAgo = 5 + si * 3 + j * 15;
    engagementRecords.push({
      id: `eng-${String(engIdx++).padStart(3,'0')}`,
      stakeholder_id: d.id,
      objective_id: 'o-001',
      engagement_type: engagementTypes[(si + j) % engagementTypes.length],
      date: fmt(subDays(NOW, daysAgo)),
      description: engagementDescriptions[(si * 2 + j) % engagementDescriptions.length],
      outcome: si < 12 ? 'positive' : si < 20 ? (j === 0 ? 'neutral' : 'positive') : (si < 30 ? 'neutral' : 'negative'),
      follow_up_required: si < 20,
      follow_up_date: si < 20 ? fmt(subDays(NOW, daysAgo - 14)) : null,
      logged_by: si % 2 === 0 ? 'u-001' : 'u-002',
    });
  }
});

// Add a few extra to reach 51
for (let j = 0; j < 5; j++) {
  const si = j * 3;
  engagementRecords.push({
    id: `eng-${String(engIdx++).padStart(3,'0')}`,
    stakeholder_id: stakeholderDefs[si].id,
    objective_id: 'o-001',
    engagement_type: 'phone_call',
    date: fmt(subDays(NOW, 2 + j * 7)),
    description: 'Quick check-in call to maintain engagement momentum and gather latest intelligence.',
    outcome: 'positive',
    follow_up_required: true,
    follow_up_date: fmt(subDays(NOW, -7)),
    logged_by: 'u-001',
  });
}

// ============================================================
// Engagement Plans (47 — one per stakeholder)
// ============================================================
const approaches: Record<string, string> = {
  strategic_ally: 'Deepen relationship, deploy as champion, protect from opposition targeting',
  power_gap: 'Convert through intermediaries, address concerns, build trust incrementally',
  hidden_champion: 'Amplify influence, leverage for access to decision-makers, formalize support',
  monitor_exit: 'Minimal investment, periodic monitoring, reallocate resources to higher-priority targets',
};

const plans30: Record<string, string> = {
  strategic_ally: 'Schedule bilateral meeting to align on committee strategy; share updated policy brief; confirm public endorsement timeline',
  power_gap: 'Identify mutual contacts for warm introduction; prepare tailored briefing addressing their specific concerns; request courtesy meeting',
  hidden_champion: 'Facilitate introduction to senior government officials; co-author op-ed; invite to policy roundtable',
  monitor_exit: 'Send periodic email updates; monitor public statements; no active outreach planned',
};

const plans60: Record<string, string> = {
  strategic_ally: 'Co-host stakeholder workshop; prepare joint media strategy; brief on committee vote timeline',
  power_gap: 'Second engagement meeting focused on addressing objections; provide cost-benefit analysis; explore areas of potential alignment',
  hidden_champion: 'Secure speaking slot at Energy Forum; submit joint policy recommendation; coordinate media engagement',
  monitor_exit: 'Review classification; assess any change in influence or position; prepare for potential re-engagement if status changes',
};

const plans90: Record<string, string> = {
  strategic_ally: 'Full deployment as public champion; coordinate testimony preparation; align on post-vote implementation strategy',
  power_gap: 'Assess conversion progress; escalate to country lead if stalled; consider alternative engagement channels',
  hidden_champion: 'Evaluate influence growth; consider reclassification if power indicators increase; formalize advisory role',
  monitor_exit: 'Final 90-day review; recommend archival or status change; document lessons learned',
};

export const engagementPlans: EngagementPlan[] = stakeholderDefs.map((d, i) => {
  const result = calculateFullScore({ influence:d.I, relationship:d.R, risk:d.K, sentiment:d.S, alignment:d.A, impact:d.M });
  const q = result.quadrant;
  return {
    id: `plan-${String(i+1).padStart(3,'0')}`,
    stakeholder_id: d.id,
    objective_id: 'o-001',
    current_quadrant: q,
    target_quadrant: q === 'power_gap' ? 'strategic_ally' : q === 'hidden_champion' ? 'strategic_ally' : q === 'monitor_exit' ? 'hidden_champion' : null,
    approach: approaches[q],
    plan_30_day: plans30[q],
    plan_60_day: plans60[q],
    plan_90_day: plans90[q],
    assigned_to: i % 2 === 0 ? 'u-001' : 'u-002',
    status: i < 35 ? 'active' : 'paused',
  };
});

// ============================================================
// Watchlist Signals (10: 6 active, 4 resolved)
// ============================================================
export const watchlistSignals: WatchlistSignal[] = [
  { id:'ws-001', stakeholder_id:'s-016', signal_type:'red_flag_triggered', severity:'critical', description:'Stephen Letoo (Kenya Petroleum Refineries) — High influence with no relationship access and zero engagements logged. Immediate outreach required.', is_resolved:false, triggered_at:fmt(subDays(NOW,3)), resolved_at:null },
  { id:'ws-002', stakeholder_id:'s-015', signal_type:'sis_drop', severity:'critical', description:'Gen. Peter Mburu — SIS dropped from 46 to 34 following hostile media statements against renewable energy subsidies.', is_resolved:false, triggered_at:fmt(subDays(NOW,7)), resolved_at:null },
  { id:'ws-003', stakeholder_id:'s-013', signal_type:'quadrant_change', severity:'critical', description:'Hon. James Mwangi Kamau migrated from Monitor/Exit to Power Gap — influence increasing, conversion urgency is high.', is_resolved:false, triggered_at:fmt(subDays(NOW,14)), resolved_at:null },
  { id:'ws-004', stakeholder_id:'s-038', signal_type:'stale_assessment', severity:'high', description:'Samuel Otieno assessment is 120 days old. Recommend immediate re-scoring or status review.', is_resolved:false, triggered_at:fmt(subDays(NOW,5)), resolved_at:null },
  { id:'ws-005', stakeholder_id:'s-021', signal_type:'engagement_overdue', severity:'high', description:'Paul Wekesa (Total Energies) — no engagement in 45 days despite being a Power Gap priority target.', is_resolved:false, triggered_at:fmt(subDays(NOW,2)), resolved_at:null },
  { id:'ws-006', stakeholder_id:'s-029', signal_type:'quadrant_change', severity:'high', description:'Mary Njoroge migrated from Monitor/Exit to Hidden Champion — relationship and sentiment improved significantly.', is_resolved:false, triggered_at:fmt(subDays(NOW,21)), resolved_at:null },
  { id:'ws-007', stakeholder_id:'s-004', signal_type:'sis_rise', severity:'medium', description:'Michael Odhiambo SIS increased by 18 points following successful engagement campaign. Now classified as Strategic Ally.', is_resolved:true, triggered_at:fmt(subDays(NOW,45)), resolved_at:fmt(subDays(NOW,30)) },
  { id:'ws-008', stakeholder_id:'s-018', signal_type:'confidence_downgrade', severity:'medium', description:'Dr. Wilson Songa overall confidence downgraded from B to C — additional evidence collection recommended.', is_resolved:true, triggered_at:fmt(subDays(NOW,60)), resolved_at:fmt(subDays(NOW,35)) },
  { id:'ws-009', stakeholder_id:'s-037', signal_type:'engagement_overdue', severity:'low', description:'Jane Achieng — no engagement in 90 days, but classified Monitor/Exit so low priority.', is_resolved:true, triggered_at:fmt(subDays(NOW,30)), resolved_at:fmt(subDays(NOW,15)) },
  { id:'ws-010', stakeholder_id:'s-008', signal_type:'stale_assessment', severity:'low', description:'Prof. David Ngugi assessment approaching 90-day threshold. Schedule routine update.', is_resolved:true, triggered_at:fmt(subDays(NOW,20)), resolved_at:fmt(subDays(NOW,10)) },
];

// ============================================================
// Audit / Activity Feed
// ============================================================
export interface ActivityItem {
  id: string;
  type: 'score_update' | 'engagement_logged' | 'approval' | 'watchlist_alert' | 'plan_created' | 'evidence_added';
  description: string;
  stakeholder_id: string | null;
  user_id: string;
  timestamp: string;
}

export const activityFeed: ActivityItem[] = [
  { id:'act-001', type:'score_update', description:'Updated scores for Dr. Sarah Wanjiku — SIS 90.00', stakeholder_id:'s-001', user_id:'u-001', timestamp: fmt(subDays(NOW,1)) },
  { id:'act-002', type:'engagement_logged', description:'Meeting logged with Hon. Fatuma Hassan regarding committee strategy', stakeholder_id:'s-003', user_id:'u-001', timestamp: fmt(subDays(NOW,1)) },
  { id:'act-003', type:'approval', description:'Score snapshot v1 approved for Michael Odhiambo', stakeholder_id:'s-004', user_id:'u-003', timestamp: fmt(subDays(NOW,2)) },
  { id:'act-004', type:'watchlist_alert', description:'Critical alert: Stephen Letoo flagged for influence-access gap', stakeholder_id:'s-016', user_id:'u-001', timestamp: fmt(subDays(NOW,3)) },
  { id:'act-005', type:'engagement_logged', description:'Phone call with Gen. Peter Mburu — negative outcome, escalated', stakeholder_id:'s-015', user_id:'u-002', timestamp: fmt(subDays(NOW,4)) },
  { id:'act-006', type:'evidence_added', description:'Media report added: "Energy Bill Faces Opposition" — linked to 3 stakeholders', stakeholder_id:null, user_id:'u-001', timestamp: fmt(subDays(NOW,5)) },
  { id:'act-007', type:'plan_created', description:'30/60/90 engagement plan created for Hon. James Mwangi Kamau', stakeholder_id:'s-013', user_id:'u-002', timestamp: fmt(subDays(NOW,6)) },
  { id:'act-008', type:'score_update', description:'Updated scores for Dr. Amina Abdullahi — SIS 88.00 (Strategic Ally)', stakeholder_id:'s-005', user_id:'u-001', timestamp: fmt(subDays(NOW,7)) },
  { id:'act-009', type:'watchlist_alert', description:'High alert: Mary Njoroge migrated to Hidden Champion quadrant', stakeholder_id:'s-029', user_id:'u-001', timestamp: fmt(subDays(NOW,8)) },
  { id:'act-010', type:'engagement_logged', description:'Formal submission delivered to Dr. Wilson Songa at KRA', stakeholder_id:'s-018', user_id:'u-001', timestamp: fmt(subDays(NOW,10)) },
  { id:'act-011', type:'approval', description:'Score snapshot v1 approved for Hon. Richard Koech', stakeholder_id:'s-014', user_id:'u-003', timestamp: fmt(subDays(NOW,12)) },
  { id:'act-012', type:'evidence_added', description:'Official document: EPRA regulatory framework draft added', stakeholder_id:'s-005', user_id:'u-001', timestamp: fmt(subDays(NOW,14)) },
];
