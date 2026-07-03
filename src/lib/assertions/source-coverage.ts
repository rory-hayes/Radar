import type { RadarAssertion } from "@/lib/assertions/schema";
import type { RadarSource, SourceType } from "@/lib/sources/schema";

export type SourceCoverageRequirement = {
  id: string;
  label: string;
  description: string;
  acceptableTypes: readonly SourceType[];
};

export type AssertionSourceCoverage = SourceCoverageRequirement & {
  linkedSources: readonly Pick<RadarSource, "id" | "name" | "type">[];
  isMet: boolean;
};

const knowledgeSourceTypes = ["url", "uploaded_document", "manual_text", "support_bot_endpoint"] as const;
const journeySourceTypes = ["url"] as const;
const integrationSourceTypes = ["api_endpoint", "support_bot_endpoint"] as const;

export function sourceCoverageRequirementsForAssertion(
  assertion: Pick<RadarAssertion, "runnerType" | "category">,
): SourceCoverageRequirement[] {
  if (assertion.runnerType === "journey") {
    return [
      {
        id: "journey-entry-point",
        label: "Journey entry point",
        description: "At least one URL source that represents the customer path being verified.",
        acceptableTypes: journeySourceTypes,
      },
    ];
  }

  if (assertion.runnerType === "integration") {
    return [
      {
        id: "integration-target",
        label: "Integration target",
        description: "At least one API or support-bot endpoint source needed to verify the handoff.",
        acceptableTypes: integrationSourceTypes,
      },
    ];
  }

  return [
    {
      id: `${assertion.category}-knowledge-evidence`,
      label: "Knowledge evidence",
      description: "At least one policy, help, pricing, uploaded document, manual text, or support-bot source.",
      acceptableTypes: knowledgeSourceTypes,
    },
  ];
}

export function getAssertionSourceCoverage(
  assertion: Pick<RadarAssertion, "runnerType" | "category">,
  linkedSources: readonly Pick<RadarSource, "id" | "name" | "type">[],
) {
  return sourceCoverageRequirementsForAssertion(assertion).map<AssertionSourceCoverage>((requirement) => {
    const matchingSources = linkedSources.filter((source) => requirement.acceptableTypes.includes(source.type));

    return {
      ...requirement,
      linkedSources: matchingSources,
      isMet: matchingSources.length > 0,
    };
  });
}

export function isAssertionSourceCoverageMet(coverage: readonly AssertionSourceCoverage[]) {
  return coverage.every((requirement) => requirement.isMet);
}
