import type {
  AssertionCategory,
  AssertionPriority,
  RunnerType,
  TestCaseType,
} from "@/lib/assertions/schema";
import type { SourceType } from "@/lib/sources/schema";

export const v1AssertionPackSlugs = [
  "pricing-plan-accuracy",
  "refund-cancellation",
  "trial-onboarding",
  "billing-invoices",
  "support-escalation",
] as const;

export type V1AssertionPackSlug = (typeof v1AssertionPackSlugs)[number];

export type AssertionTemplateBlueprint = {
  title: string;
  type: TestCaseType;
  input: Record<string, unknown>;
  expectedResult: string;
};

export type V1AssertionTemplate = {
  slug: V1AssertionPackSlug;
  name: string;
  description: string;
  category: AssertionCategory;
  priority: AssertionPriority;
  runnerType: RunnerType;
  titleTemplate: string;
  purposeTemplate: string;
  expectedBehaviorTemplate: string;
  requiredSourceTypes: readonly SourceType[];
  testCaseBlueprints: readonly AssertionTemplateBlueprint[];
};

export const v1AssertionTemplates = [
  {
    slug: "pricing-plan-accuracy",
    name: "Pricing & Plan Accuracy",
    description: "Verify pricing, plan limits, checkout promises, and AI/support answers against approved pricing sources.",
    category: "pricing",
    priority: "high",
    runnerType: "knowledge",
    titleTemplate: "Pricing and plan answers match approved sources",
    purposeTemplate:
      "Verify that customer-facing pricing answers, plan limits, checkout guidance, and billing exception handling match the current approved pricing sources.",
    expectedBehaviorTemplate:
      "Customer-facing answers must match the current pricing page or uploaded pricing policy, include correct plan limits, avoid invented discounts, and escalate billing exceptions to a human owner.",
    requiredSourceTypes: ["url", "uploaded_document", "manual_text"],
    testCaseBlueprints: [
      {
        title: "Customer asks which plan includes a key limit",
        type: "customer_question",
        input: { scenario: "Ask about plan limits and upgrade requirements." },
        expectedResult: "Answer matches the approved pricing source and does not invent plan details.",
      },
    ],
  },
  {
    slug: "refund-cancellation",
    name: "Refund & Cancellation",
    description: "Verify refund, cancellation, downgrade, and retention answers against the active customer policy.",
    category: "refund_cancellation",
    priority: "high",
    runnerType: "knowledge",
    titleTemplate: "Refund and cancellation answers match policy",
    purposeTemplate:
      "Verify that customer-facing refund, cancellation, downgrade, and retention answers match the active policy and route exceptions correctly.",
    expectedBehaviorTemplate:
      "Answers must reflect the current refund and cancellation policy, state eligibility clearly, avoid unauthorized promises, and escalate ambiguous account-specific cases.",
    requiredSourceTypes: ["url", "uploaded_document", "manual_text"],
    testCaseBlueprints: [
      {
        title: "Customer asks whether they can cancel and receive a refund",
        type: "customer_question",
        input: { scenario: "Ask about refund eligibility after cancellation." },
        expectedResult: "Answer matches the approved refund policy and routes exceptions to a human owner.",
      },
    ],
  },
  {
    slug: "trial-onboarding",
    name: "Trial & Onboarding",
    description: "Verify signup, trial activation, welcome guidance, and first-run customer journeys.",
    category: "trial_onboarding",
    priority: "medium",
    runnerType: "journey",
    titleTemplate: "Trial users can start onboarding successfully",
    purposeTemplate:
      "Verify that trial users can complete the core signup and onboarding path and receive the expected first-run guidance.",
    expectedBehaviorTemplate:
      "The trial journey should load, accept valid signup inputs, show the expected onboarding destination, and avoid broken or misleading customer-facing states.",
    requiredSourceTypes: ["url"],
    testCaseBlueprints: [
      {
        title: "New trial user reaches onboarding start",
        type: "journey_scenario",
        input: { scenario: "Visit the signup entry point and verify the onboarding destination." },
        expectedResult: "The journey reaches the expected onboarding state without a customer-facing blocker.",
      },
    ],
  },
  {
    slug: "billing-invoices",
    name: "Billing & Invoices",
    description: "Verify invoice, receipt, failed-payment, and billing handoff promises.",
    category: "billing_invoices",
    priority: "high",
    runnerType: "integration",
    titleTemplate: "Billing and invoice handoffs work as promised",
    purposeTemplate:
      "Verify that customer-facing billing and invoice promises produce the expected handoff, receipt, or account state.",
    expectedBehaviorTemplate:
      "Billing checks must return the expected status, create or expose the correct invoice/receipt handoff, and avoid silently dropping customer billing requests.",
    requiredSourceTypes: ["api_endpoint", "support_bot_endpoint"],
    testCaseBlueprints: [
      {
        title: "Billing handoff returns expected state",
        type: "integration_check",
        input: { scenario: "Call the configured billing or support handoff endpoint." },
        expectedResult: "The endpoint returns the expected billing state or accepted handoff without leaking sensitive data.",
      },
    ],
  },
  {
    slug: "support-escalation",
    name: "Support Escalation",
    description: "Verify account-risk, billing, and policy exceptions route to a human instead of dead-ending.",
    category: "support_escalation",
    priority: "critical",
    runnerType: "knowledge",
    titleTemplate: "Support escalation answers route risky cases correctly",
    purposeTemplate:
      "Verify that customer-facing support answers identify account-risk, billing, and policy exception cases and route them to a human owner.",
    expectedBehaviorTemplate:
      "Support answers must avoid unsupported resolution promises, identify escalation-worthy cases, and provide the correct human handoff guidance.",
    requiredSourceTypes: ["manual_text", "support_bot_endpoint", "url"],
    testCaseBlueprints: [
      {
        title: "Customer raises an account-risk billing exception",
        type: "customer_question",
        input: { scenario: "Ask for an exception that requires human review." },
        expectedResult: "Answer acknowledges the issue and routes the customer to the approved human escalation path.",
      },
    ],
  },
] as const satisfies readonly V1AssertionTemplate[];

export function getV1AssertionTemplate(slug?: string) {
  return v1AssertionTemplates.find((template) => template.slug === slug);
}
