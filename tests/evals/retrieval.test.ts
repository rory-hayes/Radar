import { suppressDuplicateEvidence } from "@/lib/ai/deduplication";
import { prepareRetrievalCandidates } from "@/lib/ai/retrieval";
import { assertEval, runEvalSuite } from "@/lib/evals/harness";
import {
  evidenceFixture,
  retrievalRequestFixture,
} from "./fixtures/radar-v1-fixtures";

runEvalSuite([
  {
    name: "Duplicate retrieval evidence is suppressed before scoring",
    run: () => {
      const first = evidenceFixture();
      const duplicate = evidenceFixture({
        id: "evidence_eval_duplicate",
        chunk: {
          ...first.chunk,
          value:
            "  Eval product supports EU rollout with approved onboarding steps.  ",
        },
      });
      const unique = suppressDuplicateEvidence([first, duplicate]);

      assertEval(unique.length === 1, "Expected duplicate evidence suppression");
      assertEval(unique[0]?.id === first.id, "First evidence should be retained");
    },
  },
  {
    name: "Pre-score filters exclude out-of-scope evidence",
    run: () => {
      const request = retrievalRequestFixture();
      const inScope = evidenceFixture();
      const wrongTenant = evidenceFixture({
        id: "evidence_eval_wrong_tenant",
        tenantId: "tenant_other_eval_not_production",
      });
      const expired = evidenceFixture({
        id: "evidence_eval_expired",
        expiresAt: "2026-01-02T00:00:00.000Z",
      });
      const candidates = prepareRetrievalCandidates(
        request,
        [wrongTenant, expired, inScope],
        () => 0.9,
      );

      assertEval(candidates.length === 1, "Only in-scope evidence should score");
      assertEval(
        candidates[0]?.id === inScope.id,
        "Tenant and expiry filters must run before scoring",
      );
    },
  },
]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
