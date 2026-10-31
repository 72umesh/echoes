import type { EvidenceMap } from "./evidence";
import type { Analysis, Claim } from "./schema";

function filterIds(
  ids: string[],
  evidence: EvidenceMap,
): { ids: string[]; dropped: number } {
  const kept: string[] = [];
  let dropped = 0;
  for (const id of ids) {
    if (evidence.has(id)) {
      kept.push(id);
    } else {
      dropped += 1;
    }
  }
  return { ids: kept, dropped };
}

function filterClaim(claim: Claim, evidence: EvidenceMap): { claim: Claim; dropped: number } {
  const { ids, dropped } = filterIds(claim.evidenceIds, evidence);
  return { claim: { ...claim, evidenceIds: ids }, dropped };
}

export function resolveAnalysisEvidence(
  analysis: Analysis,
  evidence: EvidenceMap,
): { analysis: Analysis; droppedEvidenceCount: number } {
  let droppedEvidenceCount = 0;

  const overviewClaims = analysis.overview.claims.map((claim) => {
    const result = filterClaim(claim, evidence);
    droppedEvidenceCount += result.dropped;
    return result.claim;
  });
  const architectureClaims = analysis.architecture.claims.map((claim) => {
    const result = filterClaim(claim, evidence);
    droppedEvidenceCount += result.dropped;
    return result.claim;
  });
  const historyClaims = analysis.history.claims.map((claim) => {
    const result = filterClaim(claim, evidence);
    droppedEvidenceCount += result.dropped;
    return result.claim;
  });
  const stateClaims = analysis.currentState.claims.map((claim) => {
    const result = filterClaim(claim, evidence);
    droppedEvidenceCount += result.dropped;
    return result.claim;
  });
  const revivalOpportunities = analysis.revivalOpportunities.map((item) => {
    const { ids, dropped } = filterIds(item.evidenceIds, evidence);
    droppedEvidenceCount += dropped;
    return { ...item, evidenceIds: ids };
  });

  return {
    droppedEvidenceCount,
    analysis: {
      ...analysis,
      overview: { ...analysis.overview, claims: overviewClaims },
      architecture: { ...analysis.architecture, claims: architectureClaims },
      history: { ...analysis.history, claims: historyClaims },
      currentState: { ...analysis.currentState, claims: stateClaims },
      revivalOpportunities,
    },
  };
}
