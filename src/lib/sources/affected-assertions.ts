import "server-only";

import {
  listSourceChangeAffectedAssertions,
  type RadarRepositoryClient,
  type RadarSourceChangeAffectedAssertion,
} from "@/lib/repositories";

export type SourceChangeDetectionReason = "content_changed" | "content_unchanged" | "source_skipped" | "source_error";

export type SourceChangeAffectedAssertion = {
  assertionId: string;
  title: string;
  priority: RadarSourceChangeAffectedAssertion["assertion"]["priority"];
  runnerType: RadarSourceChangeAffectedAssertion["assertion"]["runnerType"];
  relationshipType: RadarSourceChangeAffectedAssertion["sourceLink"]["relationshipType"];
  isRequired: boolean;
  sourceChangeTrigger: boolean;
  scheduleEnabled: boolean;
  scheduleCadence?: RadarSourceChangeAffectedAssertion["scheduleCadence"];
  nextRunAt?: string;
  shouldRerun: boolean;
  reason: RadarSourceChangeAffectedAssertion["reason"];
};

export type SourceChangeImpactResult = {
  sourceId: string;
  changed: boolean;
  detectionReason: SourceChangeDetectionReason;
  affectedAssertions: SourceChangeAffectedAssertion[];
  rerunCandidateCount: number;
};

type DetectAffectedAssertionsInput = {
  workspaceId: string;
  sourceId: string;
  changed: boolean;
  detectionReason: SourceChangeDetectionReason;
};

export async function detectAffectedAssertionsForSourceChange(
  client: RadarRepositoryClient,
  input: DetectAffectedAssertionsInput,
): Promise<SourceChangeImpactResult> {
  if (!input.changed) {
    return {
      sourceId: input.sourceId,
      changed: false,
      detectionReason: input.detectionReason,
      affectedAssertions: [],
      rerunCandidateCount: 0,
    };
  }

  const affectedAssertions = await listSourceChangeAffectedAssertions(client, input.workspaceId, input.sourceId);
  const mappedAssertions = affectedAssertions.map(mapAffectedAssertion);

  return {
    sourceId: input.sourceId,
    changed: true,
    detectionReason: input.detectionReason,
    affectedAssertions: mappedAssertions,
    rerunCandidateCount: mappedAssertions.filter((assertion) => assertion.shouldRerun).length,
  };
}

function mapAffectedAssertion(affected: RadarSourceChangeAffectedAssertion): SourceChangeAffectedAssertion {
  const mappedAssertion: SourceChangeAffectedAssertion = {
    assertionId: affected.assertion.id,
    title: affected.assertion.title,
    priority: affected.assertion.priority,
    runnerType: affected.assertion.runnerType,
    relationshipType: affected.sourceLink.relationshipType,
    isRequired: affected.sourceLink.isRequired,
    sourceChangeTrigger: affected.sourceChangeTrigger,
    scheduleEnabled: affected.scheduleEnabled,
    shouldRerun: affected.shouldRerun,
    reason: affected.reason,
  };

  if (affected.scheduleCadence) {
    mappedAssertion.scheduleCadence = affected.scheduleCadence;
  }

  if (affected.nextRunAt) {
    mappedAssertion.nextRunAt = affected.nextRunAt;
  }

  return mappedAssertion;
}
