import {
  journeyDefinitionVersion,
  parseJourneyDefinition,
  type JourneyDefinition,
  type JourneyInputValue,
  type JourneySuccessCondition,
} from "@/lib/evaluation/journey-schema";

export const journeyPackSlugs = ["trial-onboarding"] as const;
export type JourneyPackSlug = (typeof journeyPackSlugs)[number];

export type TrialOnboardingJourneyPackInput = {
  signupUrl: string;
  submitButtonName?: string;
  emailCredentialName?: string;
  passwordCredentialName?: string;
  expectedUrlContains?: string;
  expectedVisibleText?: string;
};

export const trialOnboardingJourneyPack = {
  slug: "trial-onboarding",
  name: "Trial & Onboarding",
  description: "Verifies that a trial user can submit signup credentials and reach the expected onboarding state.",
  runnerType: "journey",
  requiredConfiguration: [
    "signupUrl",
    "emailCredentialName",
    "passwordCredentialName",
    "expectedUrlContains or expectedVisibleText",
  ],
} as const;

export function createTrialOnboardingJourneyDefinition(
  input: TrialOnboardingJourneyPackInput,
): JourneyDefinition {
  const submitButtonName = input.submitButtonName ?? "Start trial";
  const emailCredentialName = input.emailCredentialName ?? "trial_user_email";
  const passwordCredentialName = input.passwordCredentialName ?? "trial_user_password";
  const successConditions = trialOnboardingSuccessConditions(input);

  return parseJourneyDefinition({
    version: journeyDefinitionVersion,
    name: "Trial signup reaches onboarding",
    startUrl: input.signupUrl,
    steps: [
      {
        id: "visit-signup",
        type: "visit_url",
        label: "Visit signup page",
        url: input.signupUrl,
        waitUntil: "domcontentloaded",
      },
      {
        id: "enter-email",
        type: "fill_text",
        label: "Enter trial email",
        locator: {
          role: "textbox",
          name: "Email",
        },
        value: credentialValue(emailCredentialName),
      },
      {
        id: "enter-password",
        type: "fill_text",
        label: "Enter trial password",
        locator: {
          role: "textbox",
          name: "Password",
        },
        value: credentialValue(passwordCredentialName),
      },
      {
        id: "submit-signup",
        type: "click",
        label: "Submit signup",
        locator: {
          role: "button",
          name: submitButtonName,
        },
      },
      {
        id: "wait-for-onboarding",
        type: "wait",
        label: "Wait for onboarding destination",
        timeoutMs: 20_000,
        locator: input.expectedVisibleText
          ? {
              text: input.expectedVisibleText,
            }
          : undefined,
        durationMs: input.expectedVisibleText ? undefined : 2_000,
      },
      {
        id: "capture-onboarding-state",
        type: "screenshot",
        label: "Capture onboarding state",
        artifactLabel: "trial-onboarding-success",
      },
      ...successConditions.map((condition, index) => ({
        id: `success-${index + 1}`,
        type: "success_condition" as const,
        label: `Verify success condition ${index + 1}`,
        condition,
      })),
    ],
    successConditions,
    metadata: {
      packSlug: trialOnboardingJourneyPack.slug,
      requiredCredentialNames: [emailCredentialName, passwordCredentialName],
    },
  });
}

function trialOnboardingSuccessConditions(
  input: TrialOnboardingJourneyPackInput,
): JourneySuccessCondition[] {
  const conditions: JourneySuccessCondition[] = [];

  if (input.expectedUrlContains) {
    conditions.push({
      type: "url_contains",
      value: input.expectedUrlContains,
    });
  }

  if (input.expectedVisibleText) {
    conditions.push({
      type: "text_visible",
      locator: {
        text: input.expectedVisibleText,
      },
      text: input.expectedVisibleText,
    });
  }

  if (conditions.length === 0) {
    conditions.push({
      type: "url_contains",
      value: "onboarding",
    });
  }

  return conditions;
}

function credentialValue(name: string): JourneyInputValue {
  return {
    kind: "credential_ref",
    name,
  };
}
