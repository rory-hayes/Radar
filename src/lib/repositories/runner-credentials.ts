import "server-only";

import {
  decryptRunnerCredentialValue,
  encryptRunnerCredentialValue,
  runnerCredentialPublicMetadata,
  runnerCredentialTypes,
  type RunnerCredentialEncryptionKey,
  type RunnerCredentialTestStatus,
  type RunnerCredentialType,
} from "@/lib/credentials/runner-credentials";
import {
  assertRepositorySuccess,
  jsonRecord,
  optionalString,
  requireRepositoryRow,
  type JsonRecord,
  type RadarRepositoryClient,
} from "@/lib/repositories/client";

export type RunnerCredentialSummary = {
  id: string;
  workspaceId: string;
  name: string;
  credentialType: RunnerCredentialType;
  redactionLabel?: string;
  encryptionKeyId: string;
  lastTestedAt?: string;
  lastTestStatus: RunnerCredentialTestStatus;
  lastTestError?: string;
  createdBy: string;
  metadata: JsonRecord;
};

export type CreateRunnerCredentialInput = {
  name: string;
  credentialType: RunnerCredentialType;
  plaintextValue: string;
  redactionLabel?: string;
  createdBy: string;
  metadata?: JsonRecord;
};

export type RunnerCredentialTestResult = {
  status: Exclude<RunnerCredentialTestStatus, "untested">;
  message?: string;
  metadata?: JsonRecord;
};

export type RunnerCredentialTester = (credential: {
  id: string;
  workspaceId: string;
  name: string;
  credentialType: RunnerCredentialType;
  plaintextValue: string;
}) => Promise<RunnerCredentialTestResult>;

type RunnerCredentialRow = {
  id: string;
  workspace_id: string;
  name: string;
  credential_type: RunnerCredentialType;
  encrypted_value: string;
  encryption_key_id: string;
  redaction_label: string | null;
  last_tested_at: string | null;
  last_test_status: RunnerCredentialTestStatus;
  last_test_error: string | null;
  created_by: string;
  metadata: unknown;
};

const runnerCredentialSummarySelect =
  "id, workspace_id, name, credential_type, encryption_key_id, redaction_label, last_tested_at, last_test_status, last_test_error, created_by, metadata";
const runnerCredentialSecretSelect = `${runnerCredentialSummarySelect}, encrypted_value`;

export async function createRunnerCredential(
  client: RadarRepositoryClient,
  workspaceId: string,
  input: CreateRunnerCredentialInput,
  encryptionKey: RunnerCredentialEncryptionKey,
) {
  assertRunnerCredentialType(input.credentialType);
  const encryptedValue = encryptRunnerCredentialValue(input.plaintextValue, encryptionKey);
  const { data, error } = await client
    .from("runner_credentials")
    .insert({
      workspace_id: workspaceId,
      name: input.name,
      credential_type: input.credentialType,
      encrypted_value: encryptedValue,
      encryption_key_id: encryptionKey.keyId,
      redaction_label: input.redactionLabel ?? null,
      created_by: input.createdBy,
      metadata: input.metadata ?? {},
    })
    .select(runnerCredentialSummarySelect)
    .single<Omit<RunnerCredentialRow, "encrypted_value">>();

  assertRepositorySuccess(error, "Unable to create runner credential");
  return mapRunnerCredentialSummary(requireRepositoryRow(data, "Runner credential insert returned no row"));
}

export async function listRunnerCredentials(
  client: RadarRepositoryClient,
  workspaceId: string,
) {
  const { data, error } = await client
    .from("runner_credentials")
    .select(runnerCredentialSummarySelect)
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true })
    .returns<Omit<RunnerCredentialRow, "encrypted_value">[]>();

  assertRepositorySuccess(error, "Unable to list runner credentials");
  return (data ?? []).map(mapRunnerCredentialSummary);
}

export async function getRunnerCredentialPlaintext(
  client: RadarRepositoryClient,
  workspaceId: string,
  credentialId: string,
  encryptionKey: RunnerCredentialEncryptionKey,
) {
  const row = await getRunnerCredentialSecretRow(client, workspaceId, credentialId);

  return {
    ...mapRunnerCredentialSummary(row),
    plaintextValue: decryptRunnerCredentialValue(row.encrypted_value, encryptionKey),
  };
}

export async function testRunnerCredential(
  client: RadarRepositoryClient,
  workspaceId: string,
  credentialId: string,
  encryptionKey: RunnerCredentialEncryptionKey,
  tester: RunnerCredentialTester,
  options: { testedAt?: string } = {},
) {
  const row = await getRunnerCredentialSecretRow(client, workspaceId, credentialId);
  const plaintextValue = decryptRunnerCredentialValue(row.encrypted_value, encryptionKey);
  const result = await tester({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    credentialType: row.credential_type,
    plaintextValue,
  });
  const testedAt = options.testedAt ?? new Date().toISOString();

  return updateRunnerCredentialTestStatus(client, workspaceId, credentialId, {
    testedAt,
    status: result.status,
    errorMessage: result.status === "failed" ? result.message : undefined,
    metadata: result.metadata,
  });
}

export async function updateRunnerCredentialTestStatus(
  client: RadarRepositoryClient,
  workspaceId: string,
  credentialId: string,
  input: {
    testedAt: string;
    status: Exclude<RunnerCredentialTestStatus, "untested">;
    errorMessage?: string;
    metadata?: JsonRecord;
  },
) {
  const { data, error } = await client
    .from("runner_credentials")
    .update({
      last_tested_at: input.testedAt,
      last_test_status: input.status,
      last_test_error: input.status === "failed" ? input.errorMessage ?? "Credential test failed." : null,
      metadata: input.metadata ?? {},
    })
    .eq("workspace_id", workspaceId)
    .eq("id", credentialId)
    .select(runnerCredentialSummarySelect)
    .single<Omit<RunnerCredentialRow, "encrypted_value">>();

  assertRepositorySuccess(error, "Unable to update runner credential test status");
  return mapRunnerCredentialSummary(requireRepositoryRow(data, "Runner credential update returned no row"));
}

export function runnerCredentialSummaryForClient(summary: RunnerCredentialSummary) {
  return runnerCredentialPublicMetadata({
    id: summary.id,
    name: summary.name,
    credentialType: summary.credentialType,
    redactionLabel: summary.redactionLabel,
    lastTestStatus: summary.lastTestStatus,
    lastTestedAt: summary.lastTestedAt,
  });
}

async function getRunnerCredentialSecretRow(
  client: RadarRepositoryClient,
  workspaceId: string,
  credentialId: string,
) {
  const { data, error } = await client
    .from("runner_credentials")
    .select(runnerCredentialSecretSelect)
    .eq("workspace_id", workspaceId)
    .eq("id", credentialId)
    .single<RunnerCredentialRow>();

  assertRepositorySuccess(error, "Unable to load runner credential");
  return requireRepositoryRow(data, "Runner credential not found");
}

function mapRunnerCredentialSummary(row: Omit<RunnerCredentialRow, "encrypted_value">): RunnerCredentialSummary {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    credentialType: row.credential_type,
    redactionLabel: optionalString(row.redaction_label),
    encryptionKeyId: row.encryption_key_id,
    lastTestedAt: optionalString(row.last_tested_at),
    lastTestStatus: row.last_test_status,
    lastTestError: optionalString(row.last_test_error),
    createdBy: row.created_by,
    metadata: jsonRecord(row.metadata),
  };
}

function assertRunnerCredentialType(value: RunnerCredentialType) {
  if (!runnerCredentialTypes.includes(value)) {
    throw new RunnerCredentialRepositoryError("Unsupported runner credential type.");
  }
}

export class RunnerCredentialRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunnerCredentialRepositoryError";
  }
}
