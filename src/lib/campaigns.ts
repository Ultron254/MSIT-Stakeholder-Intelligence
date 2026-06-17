import { format, subDays, subMonths } from 'date-fns';
import type {
  Campaign, Stakeholder, ScoreSnapshot, ComponentScore, EngagementPlan,
  EngagementRecord, EvidenceRecord, WatchlistSignal, Component, Confidence,
} from './types';
import type { ActivityItem } from './data';
import { calculateFullScore } from './scoring-engine';
import { NOW } from './constants';

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

// All campaigns the organization is running. The first entry mirrors the
// original Renewable Energy portfolio (its stakeholders live in data.ts);
// the rest get their own generated portfolios below.
export const campaigns: Campaign[] = [
  {
    id: 'o-001', country_id: 'c-001', name: 'Renewable Energy Amendment Bill 2026', short_name: 'Renewable Energy',
    description: 'Comprehensive legislation to accelerate Kenya\'s transition to 100% renewable energy by 2030.',
    policy_domain: 'Energy & Climate', region: 'Kenya', target_date: '2026-06-30', status: 'active',
    created_at: fmt(subDays(NOW, 210)), accent: '#2DA67E', lead_user_id: 'u-002',
  },
  {
    id: 'o-002', country_id: 'c-001', name: 'Digital Health Data Protection Act 2026', short_name: 'Digital Health',
    description: 'Framework governing patient data, telemedicine and health-tech interoperability across the public and private health sector.',
    policy_domain: 'Health & Technology', region: 'Kenya', target_date: '2026-09-15', status: 'active',
    created_at: fmt(subDays(NOW, 150)), accent: '#7C3AED', lead_user_id: 'u-002',
  },
  {
    id: 'o-003', country_id: 'c-001', name: 'Affordable Housing Finance Bill 2026', short_name: 'Housing Finance',
    description: 'Reform of mortgage finance, the housing levy and developer incentives to deliver one million affordable homes.',
    policy_domain: 'Housing & Finance', region: 'Kenya', target_date: '2026-08-01', status: 'active',
    created_at: fmt(subDays(NOW, 120)), accent: '#D97706', lead_user_id: 'u-002',
  },
  {
    id: 'o-004', country_id: 'c-001', name: 'Universal Education Funding Framework 2026', short_name: 'Education Funding',
    description: 'Capitation reform and a sustainable financing model for free primary and secondary education.',
    policy_domain: 'Education', region: 'Kenya', target_date: '2026-11-30', status: 'active',
    created_at: fmt(subDays(NOW, 95)), accent: '#2563EB', lead_user_id: 'u-002',
  },
  {
    id: 'o-005', country_id: 'c-001', name: 'Water Resource Management Bill 2026', short_name: 'Water Resources',
    description: 'Catchment protection, water allocation rights and county-level utility governance reform.',
    policy_domain: 'Environment & Water', region: 'Kenya', target_date: '2026-10-15', status: 'active',
    created_at: fmt(subDays(NOW, 70)), accent: '#0D9488', lead_user_id: 'u-002',
  },
  {
    id: 'o-006', country_id: 'c-001', name: 'Agricultural Subsidy Reform 2025', short_name: 'Agri Subsidy Reform',
    description: 'Restructuring of fertiliser subsidies and the e-voucher programme. Enacted in late 2025; retained for historical analysis.',
    policy_domain: 'Agriculture', region: 'Kenya', target_date: '2025-12-15', status: 'completed',
    created_at: fmt(subDays(NOW, 400)), accent: '#15803D', lead_user_id: 'u-002',
  },
];

interface CDef {
  id: string; name: string; title: string; org: string;
  sector: Stakeholder['sector']; layer: 1 | 2 | 3; sensitive: boolean;
  gender: 'female' | 'male';
  I: number; R: number; K: number; S: number; A: number; M: number;
  vip?: string;
}

// --- Digital Health (o-002) ---
const healthDefs: CDef[] = [
  { id:'h-001', name:'Dr. Mercy Wambui', title:'Principal Secretary, Health', org:'Ministry of Health', sector:'civil_service', layer:1, sensitive:false, gender:'female', I:5,R:4,K:1,S:5,A:5,M:4 },
  { id:'h-002', name:'Hon. Daniel Maina', title:'Chair, Health Committee', org:'National Assembly', sector:'politics', layer:1, sensitive:true, gender:'male', I:5,R:3,K:2,S:4,A:4,M:5 },
  { id:'h-003', name:'Sarah Lagat', title:'CEO', org:'Kenya Health Tech Association', sector:'business', layer:2, sensitive:false, gender:'female', I:4,R:5,K:1,S:5,A:5,M:4 },
  { id:'h-004', name:'Dr. Felix Otieno', title:'Data Protection Commissioner', org:'Office of the Data Commissioner', sector:'civil_service', layer:1, sensitive:false, gender:'male', I:5,R:4,K:2,S:4,A:4,M:4 },
  { id:'h-005', name:'James Kariithi', title:'Chief Executive', org:'Telco Networks Kenya', sector:'business', layer:2, sensitive:true, gender:'male', I:5,R:2,K:3,S:3,A:2,M:5 },
  { id:'h-006', name:'Grace Njeri', title:'Executive Director', org:'Digital Rights Kenya', sector:'civil_society', layer:2, sensitive:false, gender:'female', I:3,R:5,K:1,S:5,A:5,M:3 },
  { id:'h-007', name:'Dr. Paul Mutua', title:'President', org:'Kenya Hospital Association', sector:'business', layer:2, sensitive:false, gender:'male', I:4,R:4,K:2,S:4,A:4,M:4 },
  { id:'h-008', name:'Mary Akinyi', title:'Health Editor', org:'Nation Media', sector:'media', layer:3, sensitive:false, gender:'female', I:3,R:5,K:2,S:5,A:5,M:2 },
  { id:'h-009', name:'John Kamande', title:'Managing Director', org:'AfyaSure Insurance', sector:'business', layer:3, sensitive:false, gender:'male', I:3,R:2,K:3,S:3,A:2,M:3 },
  { id:'h-010', name:'Dr. Aisha Hassan', title:'Country Representative', org:'WHO Kenya', sector:'international', layer:2, sensitive:false, gender:'female', I:4,R:5,K:1,S:5,A:5,M:4 },
  { id:'h-011', name:'Peter Njoroge', title:'County Health Director', org:'Mombasa County', sector:'civil_service', layer:3, sensitive:false, gender:'male', I:2,R:3,K:3,S:3,A:3,M:2 },
  { id:'h-012', name:'Hon. Lucy Wambui', title:'MP, Backbench', org:'National Assembly', sector:'politics', layer:3, sensitive:false, gender:'female', I:2,R:2,K:4,S:2,A:2,M:2 },
  { id:'h-013', name:'Tom Oloo', title:'Founder', org:'MediLink Startup', sector:'business', layer:3, sensitive:false, gender:'male', I:2,R:5,K:1,S:5,A:5,M:2 },
  { id:'h-014', name:'Dr. Susan Karanja', title:'Professor of Bioethics', org:'University of Nairobi', sector:'academia', layer:3, sensitive:false, gender:'female', I:3,R:4,K:1,S:5,A:5,M:3 },
];

// --- Housing Finance (o-003) ---
const housingDefs: CDef[] = [
  { id:'a-001', name:'Hon. Beatrice Kones', title:'Cabinet Secretary, Housing', org:'Ministry of Lands & Housing', sector:'politics', layer:1, sensitive:false, gender:'female', I:5,R:4,K:2,S:5,A:5,M:5 },
  { id:'a-002', name:'David Mwangi', title:'CEO', org:'Kenya Mortgage Refinance Co.', sector:'business', layer:2, sensitive:false, gender:'male', I:4,R:5,K:1,S:5,A:5,M:4 },
  { id:'a-003', name:'Hon. Samson Cherargei', title:'Chair, Finance Committee', org:'Senate', sector:'politics', layer:1, sensitive:true, gender:'male', I:5,R:2,K:4,S:2,A:2,M:5 },
  { id:'a-004', name:'Jane Wairimu', title:'Director General', org:'Capital Markets Authority', sector:'civil_service', layer:2, sensitive:false, gender:'female', I:4,R:3,K:2,S:4,A:4,M:4 },
  { id:'a-005', name:'Robert Kibet', title:'Chairman', org:'Kenya Property Developers Assoc.', sector:'business', layer:2, sensitive:false, gender:'male', I:4,R:4,K:2,S:4,A:3,M:4 },
  { id:'a-006', name:'Faith Mumo', title:'CEO', org:'Affordable Homes SACCO', sector:'business', layer:3, sensitive:false, gender:'female', I:3,R:5,K:1,S:5,A:5,M:3 },
  { id:'a-007', name:'Hon. Timothy Wanyonyi', title:'MP, Housing Caucus', org:'National Assembly', sector:'politics', layer:2, sensitive:false, gender:'male', I:4,R:2,K:3,S:3,A:2,M:4 },
  { id:'a-008', name:'Lydia Achieng', title:'Banking Sector Analyst', org:'Equity Group', sector:'business', layer:3, sensitive:false, gender:'female', I:3,R:4,K:2,S:4,A:4,M:3 },
  { id:'a-009', name:'Brian Omondi', title:'Chair', org:'Landlords Federation', sector:'business', layer:3, sensitive:false, gender:'male', I:3,R:2,K:4,S:2,A:2,M:3 },
  { id:'a-010', name:'Dr. Nancy Gitau', title:'Housing Economist', org:'KIPPRA', sector:'academia', layer:3, sensitive:false, gender:'female', I:3,R:4,K:1,S:5,A:5,M:3 },
  { id:'a-011', name:'Stephen Macharia', title:'County Executive, Housing', org:'Nairobi County', sector:'civil_service', layer:2, sensitive:false, gender:'male', I:3,R:3,K:3,S:3,A:3,M:3 },
  { id:'a-012', name:'Mercy Wangari', title:'Coordinator', org:'Slum Dwellers Network', sector:'civil_society', layer:3, sensitive:false, gender:'female', I:2,R:5,K:1,S:5,A:5,M:2 },
  { id:'a-013', name:'Hon. Joseph Lekuton', title:'MP, Opposition Bench', org:'National Assembly', sector:'politics', layer:3, sensitive:false, gender:'male', I:2,R:1,K:5,S:1,A:1,M:2 },
  { id:'a-014', name:'Grace Mutiso', title:'Reporter', org:'Business Daily', sector:'media', layer:3, sensitive:false, gender:'female', I:2,R:3,K:3,S:3,A:3,M:2 },
];

// --- Education Funding (o-004) ---
const educationDefs: CDef[] = [
  { id:'e-001', name:'Prof. Julius Bitok', title:'Principal Secretary, Education', org:'Ministry of Education', sector:'civil_service', layer:1, sensitive:false, gender:'male', I:5,R:4,K:1,S:5,A:5,M:5 },
  { id:'e-002', name:'Hon. Janet Wanyama', title:'Chair, Education Committee', org:'National Assembly', sector:'politics', layer:1, sensitive:false, gender:'female', I:5,R:4,K:2,S:4,A:5,M:5 },
  { id:'e-003', name:'Akello Onyango', title:'Secretary General', org:'Kenya National Union of Teachers', sector:'civil_society', layer:2, sensitive:true, gender:'male', I:5,R:3,K:3,S:3,A:3,M:4 },
  { id:'e-004', name:'Dr. Esther Muoria', title:'CEO', org:'Kenya Institute of Curriculum Dev.', sector:'civil_service', layer:2, sensitive:false, gender:'female', I:4,R:5,K:1,S:5,A:5,M:4 },
  { id:'e-005', name:'Hon. Kimani Ichungwah', title:'Chair, Budget Committee', org:'National Assembly', sector:'politics', layer:1, sensitive:true, gender:'male', I:5,R:2,K:4,S:2,A:2,M:5 },
  { id:'e-006', name:'Faith Kipchumba', title:'Director', org:'Elimu Yetu Coalition', sector:'civil_society', layer:2, sensitive:false, gender:'female', I:3,R:5,K:1,S:5,A:5,M:3 },
  { id:'e-007', name:'James Wahome', title:'Chair', org:'Private Schools Association', sector:'business', layer:3, sensitive:false, gender:'male', I:3,R:3,K:3,S:3,A:3,M:3 },
  { id:'e-008', name:'Dr. Linda Achieng', title:'Education Economist', org:'World Bank', sector:'international', layer:2, sensitive:false, gender:'female', I:4,R:5,K:1,S:5,A:5,M:4 },
  { id:'e-009', name:'Peter Gachagua', title:'County Director of Education', org:'Kiambu County', sector:'civil_service', layer:3, sensitive:false, gender:'male', I:2,R:3,K:3,S:3,A:3,M:2 },
  { id:'e-010', name:'Mary Wairimu', title:'Education Reporter', org:'The Standard', sector:'media', layer:3, sensitive:false, gender:'female', I:3,R:4,K:2,S:5,A:4,M:2 },
  { id:'e-011', name:'Samuel Korir', title:'Chair', org:'Parents Association', sector:'civil_society', layer:3, sensitive:false, gender:'male', I:2,R:4,K:2,S:4,A:4,M:2 },
  { id:'e-012', name:'Hon. Beatrice Elachi', title:'MP, Education Caucus', org:'National Assembly', sector:'politics', layer:2, sensitive:false, gender:'female', I:4,R:3,K:2,S:4,A:4,M:4 },
  { id:'e-013', name:'Tom Mboya Jr.', title:'Founder', org:'EduTech Africa', sector:'business', layer:3, sensitive:false, gender:'male', I:2,R:5,K:1,S:5,A:5,M:2 },
];

// --- Water Resources (o-005) ---
const waterDefs: CDef[] = [
  { id:'w-001', name:'Eng. Daniel Kiptoo', title:'Principal Secretary, Water', org:'Ministry of Water', sector:'civil_service', layer:1, sensitive:false, gender:'male', I:5,R:4,K:1,S:5,A:5,M:4 },
  { id:'w-002', name:'Hon. Naomi Shaban', title:'Chair, Environment Committee', org:'National Assembly', sector:'politics', layer:1, sensitive:false, gender:'female', I:5,R:4,K:2,S:4,A:5,M:5 },
  { id:'w-003', name:'Dr. Mohammed Noor', title:'CEO', org:'Water Resources Authority', sector:'civil_service', layer:1, sensitive:false, gender:'male', I:4,R:4,K:2,S:4,A:4,M:4 },
  { id:'w-004', name:'Catherine Mumbi', title:'Director', org:'Nature Kenya', sector:'civil_society', layer:2, sensitive:false, gender:'female', I:3,R:5,K:1,S:5,A:5,M:3 },
  { id:'w-005', name:'Hon. Ali Roba', title:'Governor', org:'Mandera County', sector:'politics', layer:2, sensitive:true, gender:'male', I:5,R:2,K:3,S:3,A:2,M:5 },
  { id:'w-006', name:'James Mwvaro', title:'MD', org:'Bulk Water Suppliers Ltd', sector:'business', layer:2, sensitive:false, gender:'male', I:4,R:2,K:4,S:2,A:2,M:4 },
  { id:'w-007', name:'Dr. Wangari Maina', title:'Hydrologist', org:'University of Nairobi', sector:'academia', layer:3, sensitive:false, gender:'female', I:3,R:4,K:1,S:5,A:5,M:3 },
  { id:'w-008', name:'Joseph Lesayon', title:'Chair', org:'Pastoralist Water Users Assoc.', sector:'civil_society', layer:3, sensitive:false, gender:'male', I:2,R:4,K:2,S:4,A:4,M:2 },
  { id:'w-009', name:'Esther Nyambura', title:'Country Lead', org:'WaterAid Kenya', sector:'international', layer:2, sensitive:false, gender:'female', I:4,R:5,K:1,S:5,A:5,M:4 },
  { id:'w-010', name:'Patrick Otieno', title:'County Water Executive', org:'Kisumu County', sector:'civil_service', layer:3, sensitive:false, gender:'male', I:2,R:3,K:3,S:3,A:3,M:2 },
  { id:'w-011', name:'Hon. Didmus Barasa', title:'MP, Opposition', org:'National Assembly', sector:'politics', layer:3, sensitive:false, gender:'male', I:3,R:1,K:5,S:1,A:1,M:3 },
  { id:'w-012', name:'Lucy Wanjiru', title:'Environment Reporter', org:'Citizen TV', sector:'media', layer:3, sensitive:false, gender:'female', I:3,R:4,K:2,S:5,A:4,M:2 },
];

// --- Agricultural Subsidy Reform (o-006, completed) ---
const agriDefs: CDef[] = [
  { id:'g-001', name:'Hon. Mithika Linturi', title:'Cabinet Secretary, Agriculture', org:'Ministry of Agriculture', sector:'politics', layer:1, sensitive:false, gender:'male', I:5,R:4,K:2,S:5,A:5,M:5 },
  { id:'g-002', name:'Dr. Bruno Linyiru', title:'Director General', org:'Agriculture & Food Authority', sector:'civil_service', layer:1, sensitive:false, gender:'male', I:4,R:5,K:1,S:5,A:5,M:4 },
  { id:'g-003', name:'Daniel Magondu', title:'Chair', org:'Cereal Growers Association', sector:'business', layer:2, sensitive:false, gender:'male', I:4,R:4,K:2,S:4,A:4,M:4 },
  { id:'g-004', name:'Agnes Cheruiyot', title:'CEO', org:'Kenya Farmers SACCO Union', sector:'business', layer:2, sensitive:false, gender:'female', I:4,R:5,K:1,S:5,A:5,M:4 },
  { id:'g-005', name:'Hon. Oscar Sudi', title:'MP, Rift Caucus', org:'National Assembly', sector:'politics', layer:2, sensitive:true, gender:'male', I:4,R:2,K:4,S:2,A:2,M:4 },
  { id:'g-006', name:'Mary Kamau', title:'Director', org:'Smallholder Farmers Forum', sector:'civil_society', layer:3, sensitive:false, gender:'female', I:2,R:5,K:1,S:5,A:5,M:2 },
  { id:'g-007', name:'John Mutunga', title:'Agricultural Economist', org:'Tegemeo Institute', sector:'academia', layer:3, sensitive:false, gender:'male', I:3,R:4,K:1,S:5,A:5,M:3 },
  { id:'g-008', name:'Faith Wairimu', title:'MD', org:'Fertiliser Importers Ltd', sector:'business', layer:2, sensitive:false, gender:'female', I:4,R:2,K:4,S:2,A:2,M:4 },
  { id:'g-009', name:'Peter Kiprono', title:'County Executive, Agriculture', org:'Uasin Gishu County', sector:'civil_service', layer:3, sensitive:false, gender:'male', I:3,R:3,K:3,S:3,A:3,M:3 },
  { id:'g-010', name:'Dr. Lucy Muchiri', title:'Country Director', org:'FAO Kenya', sector:'international', layer:2, sensitive:false, gender:'female', I:4,R:5,K:1,S:5,A:5,M:4 },
  { id:'g-011', name:'Samuel Tanui', title:'Chair', org:'Maize Millers Association', sector:'business', layer:3, sensitive:false, gender:'male', I:3,R:3,K:3,S:3,A:3,M:3 },
  { id:'g-012', name:'Grace Atieno', title:'Agriculture Reporter', org:'KBC', sector:'media', layer:3, sensitive:false, gender:'female', I:2,R:3,K:3,S:3,A:3,M:2 },
];

// Partner-restricted VIP contacts. Only Ronny (u-003) sees these. They show
// how a partner keeps sensitive backchannel relationships off the shared board.
const vipDefs: Array<CDef & { campaign: string }> = [
  { campaign:'o-001', id:'vip-001', name:'Amb. (Rtd) Francis Kibet', title:'Special Envoy (Backchannel)', org:'Confidential', sector:'politics', layer:1, sensitive:true, gender:'male', I:5,R:5,K:2,S:4,A:4,M:5, vip:'u-003' },
  { campaign:'o-002', id:'vip-002', name:'Hon. (Dr.) Anne Wafula', title:'Senior Cabinet Advisor', org:'Confidential', sector:'politics', layer:1, sensitive:true, gender:'female', I:5,R:4,K:2,S:5,A:5,M:5, vip:'u-003' },
];

const RATIONALES: Record<Component, string> = {
  influence: 'Based on formal authority and observed ability to mobilize support within the policy process.',
  relationship: 'Assessed from frequency and quality of direct engagements and existing rapport.',
  risk: 'Evaluated considering potential for opposition and history with similar initiatives.',
  sentiment: 'Inferred from recent public statements and private meeting tone.',
  alignment: 'Determined by overlap between stated priorities and the focal point objectives.',
  impact: 'Estimated contribution magnitude if fully engaged.',
};
const COMPONENTS: Component[] = ['influence','relationship','risk','sentiment','alignment','impact'];

const APPROACHES: Record<string, string> = {
  strategic_ally: 'Deepen relationship, deploy as champion, protect from opposition targeting',
  power_gap: 'Convert through intermediaries, address concerns, build trust incrementally',
  hidden_champion: 'Amplify influence, leverage for access to decision-makers, formalize support',
  monitor_exit: 'Minimal investment, periodic monitoring, reallocate resources to higher-priority targets',
};

interface CampaignData {
  stakeholders: Stakeholder[];
  snapshots: ScoreSnapshot[];
  componentScores: ComponentScore[];
  plans: EngagementPlan[];
  engagements: EngagementRecord[];
  evidence: EvidenceRecord[];
  watchlist: WatchlistSignal[];
  activity: ActivityItem[];
}

function genCampaign(campaignId: string, defs: CDef[], completed: boolean, idPrefix: string = campaignId): CampaignData {
  const stakeholders: Stakeholder[] = [];
  const snapshots: ScoreSnapshot[] = [];
  const componentScores: ComponentScore[] = [];
  const plans: EngagementPlan[] = [];
  const engagements: EngagementRecord[] = [];
  const evidence: EvidenceRecord[] = [];
  const watchlist: WatchlistSignal[] = [];
  const activity: ActivityItem[] = [];

  const scoredAt = completed ? subMonths(NOW, 5) : subMonths(NOW, 1);

  defs.forEach((d, i) => {
    const result = calculateFullScore({ influence: d.I, relationship: d.R, risk: d.K, sentiment: d.S, alignment: d.A, impact: d.M });
    stakeholders.push({
      id: d.id, country_id: 'c-001', campaign_id: campaignId,
      full_name: d.name, title: d.title, organization: d.org, sector: d.sector,
      proximity_layer: d.layer, sensitivity_flag: d.sensitive,
      status: completed ? 'archived' : 'active', gender: d.gender,
      portrait_url: null, created_at: fmt(subDays(scoredAt, 60 - i)),
      vip_owner_id: d.vip ?? null, created_by: 'u-001',
    });

    const snapId = `snap-${idPrefix}-${String(i + 1).padStart(3, '0')}`;
    const conf: Confidence = i % 5 === 0 ? 'A' : i % 7 === 0 ? 'C' : 'B';
    snapshots.push({
      id: snapId, stakeholder_id: d.id, objective_id: campaignId, version: 1,
      influence_score: d.I, relationship_score: d.R, risk_score: d.K,
      sentiment_score: d.S, alignment_score: d.A, impact_score: d.M,
      risk_adjusted: result.risk_adjusted, sis_score: result.sis_score,
      power_axis: result.power_axis, convertibility_axis: result.convertibility_axis,
      quadrant: result.quadrant, overall_confidence: conf,
      workflow_status: 'approved', scored_by: 'u-001', approved_by: 'u-002',
      scored_at: fmt(scoredAt), approved_at: fmt(subDays(scoredAt, -2)),
    });

    COMPONENTS.forEach((comp, ci) => {
      const scoreMap: Record<Component, number> = {
        influence: d.I, relationship: d.R, risk: d.K, sentiment: d.S, alignment: d.A, impact: d.M,
      };
      componentScores.push({
        id: `cs-${snapId}-${ci}`, snapshot_id: snapId, component: comp,
        score: scoreMap[comp], rationale: RATIONALES[comp], confidence: conf,
      });
    });

    plans.push({
      id: `plan-${idPrefix}-${String(i + 1).padStart(3, '0')}`,
      stakeholder_id: d.id, objective_id: campaignId,
      current_quadrant: result.quadrant,
      target_quadrant: result.quadrant === 'power_gap' ? 'strategic_ally'
        : result.quadrant === 'hidden_champion' ? 'strategic_ally'
        : result.quadrant === 'monitor_exit' ? 'hidden_champion' : null,
      approach: APPROACHES[result.quadrant],
      plan_30_day: 'Schedule introductory engagement and share the focal point brief tailored to their priorities.',
      plan_60_day: 'Second engagement to address objections and explore areas of alignment.',
      plan_90_day: 'Assess progress and escalate to the engagement lead if conversion stalls.',
      assigned_to: i % 2 === 0 ? 'u-001' : 'u-002',
      status: completed ? 'completed' : 'active',
    });

    // Engagements for roughly 55% of the portfolio so the gap view has signal.
    if (i % 9 !== 0 && i % 5 !== 0) {
      engagements.push({
        id: `eng-${idPrefix}-${String(i + 1).padStart(3, '0')}`,
        stakeholder_id: d.id, objective_id: campaignId,
        engagement_type: (['meeting','phone_call','email','event'] as const)[i % 4],
        date: fmt(subDays(scoredAt, 10 + i * 2)),
        description: 'Engagement on the focal point provisions and the stakeholder\'s position.',
        outcome: result.quadrant === 'strategic_ally' ? 'positive' : result.quadrant === 'monitor_exit' ? 'neutral' : 'neutral',
        follow_up_required: result.quadrant === 'power_gap',
        follow_up_date: result.quadrant === 'power_gap' ? fmt(subDays(scoredAt, -10)) : null,
        logged_by: i % 2 === 0 ? 'u-001' : 'u-002',
      });
    }

    // Two evidence records per scored stakeholder.
    for (let j = 0; j < 2; j++) {
      evidence.push({
        id: `ev-${idPrefix}-${String(i + 1).padStart(3, '0')}-${j}`,
        snapshot_id: snapId, stakeholder_id: d.id, component: COMPONENTS[(i + j) % 6],
        evidence_type: (['meeting_notes','media_report','official_document','third_party_intel'] as const)[(i + j) % 4],
        title: 'Position assessment and supporting analysis',
        description: `Evidence informing the ${COMPONENTS[(i + j) % 6]} score for ${d.name}.`,
        source_url: null, sensitivity: d.sensitive ? 'restricted' : i < 5 ? 'internal' : 'public',
        confidence_contribution: conf, recorded_by: i % 2 === 0 ? 'u-001' : 'u-002',
        recorded_at: fmt(subDays(scoredAt, 5 + j * 8)),
      });
    }
  });

  // Watchlist signals for live campaigns: flag the first power gaps / unengaged.
  if (!completed) {
    const powerGaps = stakeholders.filter((s) => {
      const snap = snapshots.find(sn => sn.stakeholder_id === s.id);
      return snap && snap.quadrant === 'power_gap';
    }).slice(0, 2);
    powerGaps.forEach((s, k) => {
      watchlist.push({
        id: `ws-${idPrefix}-${k + 1}`, stakeholder_id: s.id,
        signal_type: k === 0 ? 'engagement_overdue' : 'sis_drop',
        severity: k === 0 ? 'high' : 'medium',
        description: `${s.full_name} (${s.organization}) -- ${k === 0 ? 'priority Power Gap with no recent engagement' : 'sentiment trending negative, monitor closely'}.`,
        is_resolved: false, triggered_at: fmt(subDays(NOW, 4 + k * 3)), resolved_at: null,
      });
    });
    const ally = stakeholders.find((s) => {
      const snap = snapshots.find(sn => sn.stakeholder_id === s.id);
      return snap && snap.quadrant === 'strategic_ally';
    });
    if (ally) {
      activity.push({
        id: `act-${idPrefix}-1`, type: 'score_update',
        description: `Scored ${ally.full_name} for the ${campaignId} portfolio`,
        stakeholder_id: ally.id, user_id: 'u-001', timestamp: fmt(subDays(NOW, 2)),
      });
    }
  }

  return { stakeholders, snapshots, componentScores, plans, engagements, evidence, watchlist, activity };
}

const generated: CampaignData[] = [
  genCampaign('o-002', healthDefs, false),
  genCampaign('o-003', housingDefs, false),
  genCampaign('o-004', educationDefs, false),
  genCampaign('o-005', waterDefs, false),
  genCampaign('o-006', agriDefs, true),
];

// VIP records (assigned to their campaigns, restricted to the partner).
const vipData: CampaignData = (() => {
  const acc: CampaignData = { stakeholders: [], snapshots: [], componentScores: [], plans: [], engagements: [], evidence: [], watchlist: [], activity: [] };
  vipDefs.forEach((d, i) => {
    const single = genCampaign(d.campaign, [d], false, `${d.campaign}-vip${i}`);
    acc.stakeholders.push(...single.stakeholders);
    acc.snapshots.push(...single.snapshots);
    acc.componentScores.push(...single.componentScores);
    acc.plans.push(...single.plans);
    acc.engagements.push(...single.engagements);
    acc.evidence.push(...single.evidence);
    void i;
  });
  return acc;
})();

const allData: CampaignData[] = [...generated, vipData];

export const extraStakeholders: Stakeholder[] = allData.flatMap(g => g.stakeholders);
export const extraSnapshots: ScoreSnapshot[] = allData.flatMap(g => g.snapshots);
export const extraComponentScores: ComponentScore[] = allData.flatMap(g => g.componentScores);
export const extraPlans: EngagementPlan[] = allData.flatMap(g => g.plans);
export const extraEngagements: EngagementRecord[] = allData.flatMap(g => g.engagements);
export const extraEvidence: EvidenceRecord[] = allData.flatMap(g => g.evidence);
export const extraWatchlist: WatchlistSignal[] = allData.flatMap(g => g.watchlist);
export const extraActivity: ActivityItem[] = allData.flatMap(g => g.activity);
