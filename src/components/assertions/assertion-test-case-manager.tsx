"use client";

import { useActionState, useId } from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";

import {
  approveTestCaseAction,
  createTestCaseAction,
  deleteTestCaseAction,
  generateSuggestedTestCasesAction,
  disableTestCaseAction,
  updateTestCaseAction,
  type TestCaseFormState,
  type TestCaseSuggestionState,
} from "@/app/(app)/assertions/actions";
import { EmptyState, StatusBadge, type StatusTone } from "@/components/radar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  testCaseTypes,
  type RadarAssertion,
  type RadarTestCase,
  type TestCaseStatus,
  type TestCaseType,
} from "@/lib/assertions/schema";

type AssertionTestCaseManagerProps = {
  assertion: RadarAssertion;
  testCases: readonly RadarTestCase[];
  canEdit: boolean;
};

const initialState: TestCaseFormState = {};
const initialSuggestionState: TestCaseSuggestionState = {};

export function AssertionTestCaseManager({
  assertion,
  testCases,
  canEdit,
}: AssertionTestCaseManagerProps) {
  return (
    <div className="flex flex-col gap-4">
      {canEdit ? (
        <>
          <TestCaseSuggestionPanel assertion={assertion} />
          <TestCaseCreateForm assertion={assertion} nextOrdinal={nextOrdinal(testCases)} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Viewers can inspect test cases but cannot change them.</p>
      )}
      <TestCaseInventory assertion={assertion} testCases={testCases} canEdit={canEdit} />
    </div>
  );
}

function TestCaseSuggestionPanel({ assertion }: { assertion: RadarAssertion }) {
  const [state, formAction, isPending] = useActionState(generateSuggestedTestCasesAction, initialSuggestionState);
  const maxSuggestionsId = useId();

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Generate test case drafts</CardTitle>
        <CardDescription>
          Use this assertion and linked source evidence to draft realistic customer-facing checks for review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <input type="hidden" name="assertionId" value={assertion.id} />
          <FieldGroup>
            {state.error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Drafts not generated</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            {state.success ? (
              <Alert>
                <CheckCircle2Icon />
                <AlertTitle>Drafts generated</AlertTitle>
                <AlertDescription>{state.success}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-3 md:grid-cols-[12rem_1fr]">
              <Field data-disabled={isPending ? true : undefined}>
                <FieldLabel htmlFor={maxSuggestionsId}>Draft count</FieldLabel>
                <Input
                  id={maxSuggestionsId}
                  name="maxSuggestions"
                  type="number"
                  min={1}
                  max={5}
                  defaultValue={3}
                  disabled={isPending}
                />
                <FieldDescription>Generated drafts remain editable and unapproved.</FieldDescription>
              </Field>
              <div className="flex items-end justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <SparklesIcon data-icon="inline-start" />}
                  Generate draft test cases
                </Button>
              </div>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function TestCaseCreateForm({
  assertion,
  nextOrdinal,
}: {
  assertion: RadarAssertion;
  nextOrdinal: number;
}) {
  const [state, formAction, isPending] = useActionState(createTestCaseAction, initialState);

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Create test case</CardTitle>
        <CardDescription>
          Add an explicit customer question, journey scenario, or integration check for this assertion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TestCaseForm
          action={formAction}
          assertionId={assertion.id}
          state={state}
          isPending={isPending}
          submitLabel="Create draft test case"
          submitIcon={PlusIcon}
          defaultOrdinal={nextOrdinal}
        />
      </CardContent>
    </Card>
  );
}

function TestCaseInventory({
  assertion,
  testCases,
  canEdit,
}: {
  assertion: RadarAssertion;
  testCases: readonly RadarTestCase[];
  canEdit: boolean;
}) {
  if (testCases.length === 0) {
    return (
      <EmptyState
        title="No test cases configured"
        description="Create explicit checks that show exactly how this assertion will be verified."
        details={["Scenario or question", "Expected result", "Approval status"]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {testCases.map((testCase) => (
        <Card key={testCase.id} size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">{testCase.title}</CardTitle>
            <CardDescription>
              {formatTestCaseType(testCase.type)} / Order {testCase.ordinal}
            </CardDescription>
            <CardAction>
              <StatusBadge tone={testCaseStatusTone(testCase.status)} label={formatTestCaseStatus(testCase.status)} />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <DetailBlock label="Input" value={testCaseInputText(testCase)} />
              <DetailBlock label="Expected result" value={testCase.expectedResult} />
            </div>
            {canEdit ? <TestCaseRowActions assertion={assertion} testCase={testCase} /> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TestCaseRowActions({
  assertion,
  testCase,
}: {
  assertion: RadarAssertion;
  testCase: RadarTestCase;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
      <TestCaseEditDialog assertion={assertion} testCase={testCase} />
      {testCase.status !== "approved" ? (
        <form action={approveTestCaseAction}>
          <input type="hidden" name="assertionId" value={assertion.id} />
          <input type="hidden" name="testCaseId" value={testCase.id} />
          <Button type="submit" variant="outline" size="sm">
            <ShieldCheckIcon data-icon="inline-start" />
            Approve
          </Button>
        </form>
      ) : null}
      {testCase.status !== "disabled" ? (
        <form action={disableTestCaseAction}>
          <input type="hidden" name="assertionId" value={assertion.id} />
          <input type="hidden" name="testCaseId" value={testCase.id} />
          <Button type="submit" variant="outline" size="sm">
            Disable
          </Button>
        </form>
      ) : null}
      <form action={deleteTestCaseAction}>
        <input type="hidden" name="assertionId" value={assertion.id} />
        <input type="hidden" name="testCaseId" value={testCase.id} />
        <Button type="submit" variant="outline" size="sm">
          <Trash2Icon data-icon="inline-start" />
          Delete
        </Button>
      </form>
    </div>
  );
}

function TestCaseEditDialog({
  assertion,
  testCase,
}: {
  assertion: RadarAssertion;
  testCase: RadarTestCase;
}) {
  const [state, formAction, isPending] = useActionState(updateTestCaseAction, initialState);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <PencilIcon data-icon="inline-start" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit test case</DialogTitle>
          <DialogDescription>
            Update the inspectable check content. Approval and disabling remain explicit actions.
          </DialogDescription>
        </DialogHeader>
        <TestCaseForm
          action={formAction}
          assertionId={assertion.id}
          testCase={testCase}
          state={state}
          isPending={isPending}
          submitLabel="Save test case"
          submitIcon={SaveIcon}
        />
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

function TestCaseForm({
  action,
  assertionId,
  testCase,
  state,
  isPending,
  submitLabel,
  submitIcon: SubmitIcon,
  defaultOrdinal = 0,
}: {
  action: (formData: FormData) => void;
  assertionId: string;
  testCase?: RadarTestCase;
  state: TestCaseFormState;
  isPending: boolean;
  submitLabel: string;
  submitIcon: typeof SaveIcon;
  defaultOrdinal?: number;
}) {
  const titleId = useId();
  const typeId = useId();
  const inputId = useId();
  const expectedResultId = useId();
  const ordinalId = useId();

  return (
    <form action={action}>
      <input type="hidden" name="assertionId" value={assertionId} />
      {testCase ? <input type="hidden" name="testCaseId" value={testCase.id} /> : null}
      <FieldGroup>
        {state.error ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Test case not saved</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        {state.success ? (
          <Alert>
            <CheckCircle2Icon />
            <AlertTitle>Test case saved</AlertTitle>
            <AlertDescription>{state.success}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem_8rem]">
          <Field data-disabled={isPending ? true : undefined}>
            <FieldLabel htmlFor={titleId}>Title</FieldLabel>
            <Input
              id={titleId}
              name="title"
              defaultValue={testCase?.title}
              placeholder="Customer asks for current Pro plan limits"
              minLength={4}
              maxLength={180}
              disabled={isPending}
              required
            />
          </Field>
          <Field data-disabled={isPending ? true : undefined}>
            <FieldLabel htmlFor={typeId}>Type</FieldLabel>
            <Select name="type" defaultValue={testCase?.type ?? "customer_question"} disabled={isPending} required>
              <SelectTrigger id={typeId}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {testCaseTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatTestCaseType(type)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field data-disabled={isPending ? true : undefined}>
            <FieldLabel htmlFor={ordinalId}>Order</FieldLabel>
            <Input
              id={ordinalId}
              name="ordinal"
              type="number"
              min={0}
              max={999}
              defaultValue={testCase?.ordinal ?? defaultOrdinal}
              disabled={isPending}
              required
            />
          </Field>
        </div>
        <Field data-disabled={isPending ? true : undefined}>
          <FieldLabel htmlFor={inputId}>Input</FieldLabel>
          <Textarea
            id={inputId}
            name="inputText"
            defaultValue={testCase ? testCaseInputText(testCase) : ""}
            placeholder="What would a customer ask, do, or send?"
            minLength={4}
            maxLength={2000}
            disabled={isPending}
            required
          />
          <FieldDescription>Keep this in customer-facing language, not internal eval instructions.</FieldDescription>
        </Field>
        <Field data-disabled={isPending ? true : undefined}>
          <FieldLabel htmlFor={expectedResultId}>Expected result</FieldLabel>
          <Textarea
            id={expectedResultId}
            name="expectedResult"
            defaultValue={testCase?.expectedResult}
            placeholder="The answer should match the current pricing source and avoid unsupported discounts."
            minLength={8}
            maxLength={2000}
            disabled={isPending}
            required
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <SubmitIcon data-icon="inline-start" />}
            {submitLabel}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Badge variant="outline">Inspectable</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function nextOrdinal(testCases: readonly RadarTestCase[]) {
  return testCases.reduce((maxOrdinal, testCase) => Math.max(maxOrdinal, testCase.ordinal + 1), 0);
}

function testCaseInputText(testCase: RadarTestCase) {
  const text = testCase.input.text;

  if (typeof text === "string") {
    return text;
  }

  return JSON.stringify(testCase.input);
}

function testCaseStatusTone(status: TestCaseStatus): StatusTone {
  const tones: Record<TestCaseStatus, StatusTone> = {
    draft: "neutral",
    approved: "pass",
    disabled: "warning",
    archived: "neutral",
  };

  return tones[status];
}

function formatTestCaseType(type: TestCaseType) {
  const labels: Record<TestCaseType, string> = {
    customer_question: "Customer question",
    journey_scenario: "Journey scenario",
    integration_check: "Integration check",
  };

  return labels[type];
}

function formatTestCaseStatus(status: TestCaseStatus) {
  return status
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
