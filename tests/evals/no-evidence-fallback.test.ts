import { buildNoEvidenceFallback } from "@/lib/ai/fallback";
import { validateGuidanceCard } from "@/lib/ai/card-validation";
import { assertEval, runEvalSuite } from "@/lib/evals/harness";
import { FIXTURE_NOW } from "./fixtures/radar-v1-fixtures";

runEvalSuite([
  {
    name: "No evidence creates a valid Needs confirmation card",
    run: () => {
      const card = buildNoEvidenceFallback({
        id: "card_eval_no_evidence",
        tenantId: "tenant_eval_not_production",
        sessionId: "session_eval_not_production",
        relatedTurnIds: ["turn_eval_001"],
        intent: "implementation",
        createdAt: FIXTURE_NOW,
      });
      const result = validateGuidanceCard(card);

      assertEval(result.ok, "No-evidence fallback should validate");
      assertEval(
        card.kind === "needs_confirmation",
        "Implementation fallback should need confirmation",
      );
      assertEval(
        card.citations.length === 0,
        "Fallback should not invent citations",
      );
    },
  },
  {
    name: "High-risk no evidence escalates",
    run: () => {
      const card = buildNoEvidenceFallback({
        id: "card_eval_escalate",
        tenantId: "tenant_eval_not_production",
        sessionId: "session_eval_not_production",
        relatedTurnIds: ["turn_eval_security"],
        intent: "security",
        highRisk: true,
        createdAt: FIXTURE_NOW,
      });

      assertEval(card.kind === "escalate", "Security fallback should escalate");
      assertEval(card.priority === "high", "Escalations should be high priority");
    },
  },
]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
