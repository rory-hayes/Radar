import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type RadarRepositoryClient = SupabaseClient;
export type JsonRecord = Record<string, unknown>;

type RepositoryErrorLike = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export class RadarRepositoryError extends Error {
  readonly code?: string;
  readonly details?: string;
  readonly hint?: string;

  constructor(message: string, error?: RepositoryErrorLike | null) {
    super(error ? `${message}: ${error.message}` : message);
    this.name = "RadarRepositoryError";
    this.code = error?.code;
    this.details = error?.details;
    this.hint = error?.hint;
  }
}

export function assertRepositorySuccess(error: RepositoryErrorLike | null, message: string) {
  if (error) {
    throw new RadarRepositoryError(message, error);
  }
}

export function requireRepositoryRow<TRow>(data: TRow | null, message: string) {
  if (!data) {
    throw new RadarRepositoryError(message);
  }

  return data;
}

export function optionalString(value: string | null | undefined) {
  return value ?? undefined;
}

export function optionalNumber(value: number | null | undefined) {
  return value ?? undefined;
}

export function jsonRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}
