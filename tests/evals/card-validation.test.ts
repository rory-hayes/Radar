import {
  downgradeUnsupportedCard,
  validateGuidanceCard,
} from "@/lib/ai/card-validation";
import { runEvalSuite, assertEval } from "@/lib/evals/harness";
import { guidanceCardFixture } from "./fixtures/radar-v1-fixtures";

runEvalSuite([
  {
    name: "Answer cards require citations",
    run: () => {
      const result = validateGuidanceCard(
        guidanceCardFixture({
          citations: [],
          claims: [
            {
              id: "claim_eval_uncited",
              text: "This answer has no evidence.",
              supportStatus: "unsupported",
              citationIds: [],
            },
          ],
        }),
      );

      assertEval(!result.ok, "Uncited answer card should fail validation");
      assertEval(
        result.issues.some((issue) =>
          issue.message.includes("require at least one citation"),
        ),
        "Expected citation requirement issue",
      );
    },
  },
  {
    name: "Unsupported answer claims downgrade to Needs confirmation",
    run: () => {
      const unsupported = guidanceCardFixture({
        claims: [
          {
            id: "claim_eval_unsupported",
            text: "This claim needs a source.",
            supportStatus: "unsupported",
            citationIds: [],
          },
        ],
      });
      const downgraded = downgradeUnsupportedCard(
        unsupported,
        "needs_confirmation",
      );
      const result = validateGuidanceCard(downgraded);

      assertEval(result.ok, "Downgraded fallback card should validate");
      assertEval(
        downgraded.kind === "needs_confirmation",
        "Unsupported claim should become Needs confirmation",
      );
    },
  },
]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
