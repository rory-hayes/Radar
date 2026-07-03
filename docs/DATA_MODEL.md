# Data Model

This file defines the core database entities Radar needs from MVP through production readiness.

## Core tables

- workspaces
- users or profiles
- workspace_members
- audit_logs
- sources
- source_documents
- source_chunks
- assertions
- assertion_sources
- assertion_templates
- test_cases
- runner_configs
- evaluation_runs
- test_case_results
- findings
- finding_evidence
- finding_activity
- reports
- notifications
- billing_customers

## Workspace ownership

Every product table that contains customer data must include workspace_id directly or be reachable through a workspace-owned parent with enforced RLS.

## Evidence references

Evaluation results and findings should reference source documents/chunks and artifact files rather than copying unbounded content into many records.

## Versioning

Sources, prompts, rubrics, runner definitions, and assertion templates must be versioned so historical runs remain explainable.

## Sensitive data

Secrets and credentials must be encrypted or stored in provider-managed secret stores. Sensitive source content must not be logged to analytics, Sentry, or external traces.
