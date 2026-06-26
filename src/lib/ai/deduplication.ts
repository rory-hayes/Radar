import type { RetrievalEvidence } from "@/lib/domain";

type EvidenceLike = Pick<
  RetrievalEvidence,
  "sourceId" | "locator" | "chunk" | "effectiveAt"
>;

const whitespacePattern = /\s+/g;

function normalizeFingerprintText(value: string): string {
  return value.trim().toLowerCase().replace(whitespacePattern, " ");
}

export function evidenceFingerprint(evidence: EvidenceLike): string {
  return [
    evidence.sourceId,
    evidence.locator ?? "no-locator",
    evidence.effectiveAt,
    normalizeFingerprintText(evidence.chunk.value),
  ].join("|");
}

export function suppressDuplicateEvidence<T extends EvidenceLike>(
  evidence: readonly T[],
): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const item of evidence) {
    const fingerprint = evidenceFingerprint(item);

    if (seen.has(fingerprint)) {
      continue;
    }

    seen.add(fingerprint);
    unique.push(item);
  }

  return unique;
}
