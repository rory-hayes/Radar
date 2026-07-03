import "server-only";

import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { checkAndRecordAbuseLimit } from "@/lib/abuse/enforcement";
import type { AbuseLimitEventType } from "@/lib/abuse/schema";
import { getAuthenticatedUser, type RadarAuthenticatedUser } from "@/lib/auth/session";
import { getActiveWorkspaceForCurrentUser } from "@/lib/workspaces/server";
import {
  describePermission,
  membershipCan,
  type WorkspacePermission,
} from "@/lib/workspaces/permissions";
import { type RadarWorkspaceMembership } from "@/lib/workspaces/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ServerInputSchema<TInput> = {
  parse(input: unknown): TInput;
};

export type ServerGuardrailCode =
  | "unauthenticated"
  | "workspace_required"
  | "unauthorized"
  | "rate_limited"
  | "validation"
  | "server_error";

export type ServerActionResponse<TData = null> =
  | {
      ok: true;
      data: TData;
    }
  | {
      ok: false;
      code: ServerGuardrailCode;
      error: string;
    };

export type AuthenticatedActionContext = {
  user: RadarAuthenticatedUser;
};

export type WorkspaceActionContext = AuthenticatedActionContext & {
  membership: RadarWorkspaceMembership;
};

type GuardedActionOptions<TInput> = {
  input: unknown;
  schema: ServerInputSchema<TInput>;
};

type GuardedWorkspaceActionOptions<TInput> = GuardedActionOptions<TInput> & {
  permission: WorkspacePermission;
};

type GuardedApiOptions<TInput> = {
  schema: ServerInputSchema<TInput>;
  successStatus?: number;
  rateLimit?: {
    eventType: AbuseLimitEventType;
    route: string;
    quantity?: number;
  };
};

type GuardedWorkspaceApiOptions<TInput> = GuardedApiOptions<TInput> & {
  permission: WorkspacePermission;
};

export class ServerGuardrailError extends Error {
  readonly code: ServerGuardrailCode;
  readonly status: number;

  constructor(code: ServerGuardrailCode, message: string, status = statusForCode(code)) {
    super(message);
    this.name = "ServerGuardrailError";
    this.code = code;
    this.status = status;
  }
}

export async function runAuthenticatedServerAction<TInput, TData>(
  options: GuardedActionOptions<TInput>,
  handler: (context: AuthenticatedActionContext & { input: TInput }) => Promise<TData>,
): Promise<ServerActionResponse<TData>> {
  try {
    const input = parseServerInput(options.schema, options.input);
    const context = await getAuthenticatedActionContext();
    const data = await handler({ ...context, input });

    return { ok: true, data };
  } catch (error) {
    return toServerActionResponse(error);
  }
}

export async function runWorkspaceServerAction<TInput, TData>(
  options: GuardedWorkspaceActionOptions<TInput>,
  handler: (context: WorkspaceActionContext & { input: TInput }) => Promise<TData>,
): Promise<ServerActionResponse<TData>> {
  try {
    const input = parseServerInput(options.schema, options.input);
    const context = await getWorkspaceActionContext(options.permission);
    const data = await handler({ ...context, input });

    return { ok: true, data };
  } catch (error) {
    return toServerActionResponse(error);
  }
}

export async function runAuthenticatedApiHandler<TInput, TData>(
  request: Request,
  options: GuardedApiOptions<TInput>,
  handler: (context: AuthenticatedActionContext & { input: TInput }) => Promise<TData>,
) {
  try {
    const input = parseServerInput(options.schema, await readJsonBody(request));
    const context = await getAuthenticatedActionContext();
    const data = await handler({ ...context, input });

    return NextResponse.json({ ok: true, data }, { status: options.successStatus ?? 200 });
  } catch (error) {
    return toJsonGuardrailResponse(error);
  }
}

export async function runWorkspaceApiHandler<TInput, TData>(
  request: Request,
  options: GuardedWorkspaceApiOptions<TInput>,
  handler: (context: WorkspaceActionContext & { input: TInput }) => Promise<TData>,
) {
  try {
    const input = parseServerInput(options.schema, await readJsonBody(request));
    const context = await getWorkspaceActionContext(options.permission);
    await enforceApiRateLimit(context, options.rateLimit);
    const data = await handler({ ...context, input });

    return NextResponse.json({ ok: true, data }, { status: options.successStatus ?? 200 });
  } catch (error) {
    return toJsonGuardrailResponse(error);
  }
}

export function serverActionError(message: string, code: ServerGuardrailCode = "server_error") {
  return new ServerGuardrailError(code, message);
}

export function serverActionErrorState(response: ServerActionResponse<unknown>) {
  return response.ok ? undefined : response.error;
}

function parseServerInput<TInput>(schema: ServerInputSchema<TInput>, input: unknown) {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ServerGuardrailError(
        "validation",
        error.issues[0]?.message ?? "Check the submitted fields and try again.",
      );
    }

    throw error;
  }
}

async function getAuthenticatedActionContext(): Promise<AuthenticatedActionContext> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new ServerGuardrailError("unauthenticated", "Sign in before continuing.");
  }

  return { user };
}

async function getWorkspaceActionContext(permission: WorkspacePermission): Promise<WorkspaceActionContext> {
  const { user } = await getAuthenticatedActionContext();
  const membership = await getActiveWorkspaceForCurrentUser();

  if (!membership) {
    throw new ServerGuardrailError("workspace_required", "Create or join a workspace before continuing.");
  }

  if (!membershipCan(membership, permission)) {
    throw new ServerGuardrailError(
      "unauthorized",
      `You do not have permission to ${describePermission(permission)}.`,
    );
  }

  return { user, membership };
}

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new ServerGuardrailError("validation", "Send a valid JSON request body.");
  }
}

function toServerActionResponse(error: unknown): ServerActionResponse<never> {
  const guardrailError = normalizeGuardrailError(error);

  return {
    ok: false,
    code: guardrailError.code,
    error: guardrailError.message,
  };
}

function toJsonGuardrailResponse(error: unknown) {
  const guardrailError = normalizeGuardrailError(error);

  return NextResponse.json(
    {
      ok: false,
      code: guardrailError.code,
      error: guardrailError.message,
    },
    { status: guardrailError.status },
  );
}

function normalizeGuardrailError(error: unknown) {
  if (error instanceof ServerGuardrailError) {
    return error;
  }

  Sentry.captureException(error, {
    tags: {
      radar_boundary: "server_guardrail",
    },
  });

  return new ServerGuardrailError("server_error", "Radar could not complete the request. Try again.");
}

function statusForCode(code: ServerGuardrailCode) {
  const statuses = {
    unauthenticated: 401,
    workspace_required: 403,
    unauthorized: 403,
    rate_limited: 429,
    validation: 400,
    server_error: 500,
  } satisfies Record<ServerGuardrailCode, number>;

  return statuses[code];
}

async function enforceApiRateLimit(
  context: WorkspaceActionContext,
  rateLimit: GuardedApiOptions<unknown>["rateLimit"],
) {
  if (!rateLimit) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new ServerGuardrailError("server_error", "Supabase is not configured for this environment.");
  }

  const decision = await checkAndRecordAbuseLimit({
    client: supabase,
    workspaceId: context.membership.workspace.id,
    userId: context.user.id,
    eventType: rateLimit.eventType,
    quantity: rateLimit.quantity,
    metadata: {
      route: rateLimit.route,
      boundary: "api",
    },
  });

  if (!decision.allowed) {
    throw new ServerGuardrailError("rate_limited", decision.message);
  }
}
