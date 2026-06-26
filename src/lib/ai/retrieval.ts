import {
  RetrievalEvidenceSchema,
  RetrievalPreScoreFiltersSchema,
  RetrievalRequestSchema,
  type RetrievalEvidence,
  type RetrievalPreScoreFilters,
  type RetrievalRequest,
} from "@/lib/domain";
import { suppressDuplicateEvidence } from "./deduplication";

export type RetrievalScoreFn = (
  evidence: RetrievalEvidence,
  request: RetrievalRequest,
) => number;

export type ScoredRetrievalEvidence = RetrievalEvidence & {
  score: number;
};

function intersects<T>(candidateValues: readonly T[], filterValues: readonly T[]) {
  return candidateValues.some((value) => filterValues.includes(value));
}

function passesUserAccess(
  evidence: RetrievalEvidence,
  requestingUserId: string,
): boolean {
  if (evidence.access?.deniedUserIds?.includes(requestingUserId)) {
    return false;
  }

  const allowedUserIds = evidence.access?.allowedUserIds;

  if (!allowedUserIds || allowedUserIds.length === 0) {
    return true;
  }

  return allowedUserIds.includes(requestingUserId);
}

function passesExpiry(
  evidence: RetrievalEvidence,
  filters: RetrievalPreScoreFilters,
): boolean {
  if (!evidence.expiresAt) {
    return filters.expiry.includeMissingExpiry;
  }

  return Date.parse(evidence.expiresAt) > Date.parse(filters.expiry.after);
}

export function applyRetrievalPreScoreFilters(
  evidence: readonly RetrievalEvidence[],
  filtersInput: RetrievalPreScoreFilters,
): RetrievalEvidence[] {
  const filters = RetrievalPreScoreFiltersSchema.parse(filtersInput);

  return evidence
    .map((item) => RetrievalEvidenceSchema.parse(item))
    .filter((item) => item.tenantId === filters.tenantId)
    .filter((item) => passesUserAccess(item, filters.requestingUserId))
    .filter((item) => filters.sourceStatuses.includes(item.sourceStatus))
    .filter((item) => filters.products.includes(item.product))
    .filter((item) => filters.regions.includes(item.region))
    .filter((item) => intersects(item.audiences, filters.audiences))
    .filter((item) =>
      filters.confidentialityLevels.includes(item.confidentiality),
    )
    .filter(
      (item) =>
        Date.parse(item.effectiveAt) <= Date.parse(filters.effective.atOrBefore),
    )
    .filter((item) => passesExpiry(item, filters));
}

export function prepareRetrievalCandidates(
  requestInput: RetrievalRequest,
  evidence: readonly RetrievalEvidence[],
  score: RetrievalScoreFn,
): ScoredRetrievalEvidence[] {
  const request = RetrievalRequestSchema.parse(requestInput);
  const filtered = applyRetrievalPreScoreFilters(
    evidence,
    request.preScoreFilters,
  );
  const unique = suppressDuplicateEvidence(filtered);

  return unique
    .map((item) => ({
      ...item,
      score: score(item, request),
    }))
    .filter((item) => item.score >= (request.scoring.minScore ?? 0))
    .sort((left, right) => right.score - left.score)
    .slice(0, request.scoring.limit);
}
