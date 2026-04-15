/**
 * MSIT Scoring Engine
 * Implements the Stakeholder Intelligence Score (SIS) calculation,
 * quadrant classification, axis computation, and red flag detection.
 *
 * Reference formulas:
 *   SIS = 20 * (0.30*I + 0.20*R + 0.15*RiskAdj + 0.15*S + 0.10*A + 0.10*M)
 *   RiskAdj = 6 - Risk
 *   Power = 0.75*I + 0.25*M
 *   Convertibility = 0.444*R + 0.222*A + 0.333*RiskAdj
 */

import type { Quadrant, ScoringInput, ScoringResult, ScoringWeights, RedFlag, Stakeholder, ScoreSnapshot, EngagementRecord } from './types';

const DEFAULT_WEIGHTS: Pick<ScoringWeights, 'influence_weight' | 'relationship_weight' | 'risk_weight' | 'sentiment_weight' | 'alignment_weight' | 'impact_weight' | 'power_threshold' | 'convertibility_threshold'> = {
  influence_weight: 0.30,
  relationship_weight: 0.20,
  risk_weight: 0.15,
  sentiment_weight: 0.15,
  alignment_weight: 0.10,
  impact_weight: 0.10,
  power_threshold: 4.0,
  convertibility_threshold: 4.0,
};

/**
 * Invert the risk score.
 * Higher raw risk = more dangerous, so we invert for positive contribution.
 */
export function invertRisk(risk: number): number {
  return 6 - risk;
}

/**
 * Calculate the SIS (Stakeholder Intelligence Score) on a 0-100 scale.
 *
 * @param input - The six raw component scores (each 1-5)
 * @param weights - Optional custom weights
 * @returns SIS score rounded to 2 decimal places
 */
export function calculateSIS(
  input: ScoringInput,
  weights = DEFAULT_WEIGHTS
): number {
  const riskAdj = invertRisk(input.risk);
  const weightedSum =
    weights.influence_weight * input.influence +
    weights.relationship_weight * input.relationship +
    weights.risk_weight * riskAdj +
    weights.sentiment_weight * input.sentiment +
    weights.alignment_weight * input.alignment +
    weights.impact_weight * input.impact;

  return Math.round(weightedSum * 20 * 100) / 100;
}

/**
 * Calculate the Power axis value.
 * Power = 0.75 * Influence + 0.25 * Impact
 */
export function calculatePowerAxis(influence: number, impact: number): number {
  return Math.round((0.75 * influence + 0.25 * impact) * 1000) / 1000;
}

/**
 * Calculate the Convertibility axis value.
 * Convertibility = 0.444 * Relationship + 0.222 * Alignment + 0.333 * RiskAdj
 */
export function calculateConvertibilityAxis(
  relationship: number,
  alignment: number,
  riskAdj: number
): number {
  return Math.round((0.444 * relationship + 0.222 * alignment + 0.333 * riskAdj) * 1000) / 1000;
}

/**
 * Classify into a quadrant based on power and convertibility axes.
 */
export function classifyQuadrant(
  power: number,
  convertibility: number,
  powerThreshold = 4.0,
  convertibilityThreshold = 4.0
): Quadrant {
  const highPower = power >= powerThreshold;
  const highConvertibility = convertibility >= convertibilityThreshold;

  if (highPower && highConvertibility) return 'strategic_ally';
  if (highPower && !highConvertibility) return 'power_gap';
  if (!highPower && highConvertibility) return 'hidden_champion';
  return 'monitor_exit';
}

/**
 * Full scoring calculation: takes raw inputs and returns all derived values.
 */
export function calculateFullScore(
  input: ScoringInput,
  weights = DEFAULT_WEIGHTS
): ScoringResult {
  const riskAdj = invertRisk(input.risk);
  const sis = calculateSIS(input, weights);
  const power = calculatePowerAxis(input.influence, input.impact);
  const convertibility = calculateConvertibilityAxis(input.relationship, input.alignment, riskAdj);
  const quadrant = classifyQuadrant(power, convertibility, weights.power_threshold, weights.convertibility_threshold);

  return {
    risk_adjusted: riskAdj,
    sis_score: sis,
    power_axis: power,
    convertibility_axis: convertibility,
    quadrant,
  };
}

/**
 * Detect red flags for a stakeholder based on their scores and engagement history.
 */
export function detectRedFlags(
  stakeholder: Stakeholder,
  snapshot: ScoreSnapshot | null,
  engagements: EngagementRecord[],
  now = new Date()
): RedFlag[] {
  if (!snapshot) return [];

  const flags: RedFlag[] = [];

  // Flag 1: Layer 1 stakeholder with Influence < 3
  if (stakeholder.proximity_layer === 1 && snapshot.influence_score < 3) {
    flags.push({
      type: 'layer_influence_mismatch',
      message: 'Core layer stakeholder with low influence score — review layer assignment',
      severity: 'high',
    });
  }

  // Flag 2: High influence but no relationship and no engagement logged
  if (snapshot.influence_score >= 4 && snapshot.relationship_score === 1) {
    const hasEngagement = engagements.some(e => e.stakeholder_id === stakeholder.id);
    if (!hasEngagement) {
      flags.push({
        type: 'influence_access_gap',
        message: 'High influence with no relationship access and no engagements logged',
        severity: 'critical',
      });
    }
  }

  // Flag 3: Risk >= 4 and Sentiment >= 4 simultaneously
  if (snapshot.risk_score >= 4 && snapshot.sentiment_score >= 4) {
    flags.push({
      type: 'risk_sentiment_contradiction',
      message: 'High risk contradicts positive sentiment — evidence review needed',
      severity: 'medium',
    });
  }

  // Flag 4: Stale assessment (>90 days)
  const scoredDate = new Date(snapshot.scored_at);
  const daysSinceScored = Math.floor((now.getTime() - scoredDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceScored > 90) {
    flags.push({
      type: 'stale_assessment',
      message: `Assessment is ${daysSinceScored} days old — update recommended`,
      severity: 'high',
    });
  }

  return flags;
}

/**
 * Get the SIS score tier for color coding.
 */
export function getSISTier(sis: number): 'high' | 'medium' | 'low' {
  if (sis >= 80) return 'high';
  if (sis >= 60) return 'medium';
  return 'low';
}

/**
 * Get color for a SIS score tier.
 */
export function getSISColor(sis: number): string {
  const tier = getSISTier(sis);
  switch (tier) {
    case 'high': return '#16A34A';
    case 'medium': return '#D97706';
    case 'low': return '#DC2626';
  }
}
