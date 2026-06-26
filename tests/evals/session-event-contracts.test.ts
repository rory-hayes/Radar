import {
  EventEnvelopeSchema,
  SessionEnvelopeSchema,
} from "@/lib/domain";
import { assertEval, runEvalSuite } from "@/lib/evals/harness";
import {
  eventEnvelopeFixture,
  sessionEnvelopeFixture,
} from "./fixtures/radar-v1-fixtures";

runEvalSuite([
  {
    name: "Capturing session requires consent and a visible indicator",
    run: () => {
      const valid = SessionEnvelopeSchema.safeParse(sessionEnvelopeFixture());
      const invalid = SessionEnvelopeSchema.safeParse(
        sessionEnvelopeFixture({
          capture: {
            consentRecorded: false,
            visibleIndicator: false,
            rawAudioStored: false,
          },
        }),
      );

      assertEval(valid.success, "Valid session envelope should parse");
      assertEval(!invalid.success, "Capture without consent should fail");
    },
  },
  {
    name: "Event envelope enforces monotonic receive time",
    run: () => {
      const valid = EventEnvelopeSchema.safeParse(eventEnvelopeFixture());
      const invalid = EventEnvelopeSchema.safeParse(
        eventEnvelopeFixture({
          occurredAt: "2026-06-26T14:00:01.000Z",
          receivedAt: "2026-06-26T14:00:00.000Z",
        }),
      );

      assertEval(valid.success, "Valid event envelope should parse");
      assertEval(!invalid.success, "receivedAt before occurredAt should fail");
    },
  },
]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
