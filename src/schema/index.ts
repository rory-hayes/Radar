import * as z from "zod";

export const WorkspaceInviteRoleSchema = z.enum([
  "admin",
  "knowledge_manager",
  "approver",
  "analyst",
  "user",
  "viewer",
]);

export const InviteUserSchema = z.object({
  email: z.string().trim().email({
    message: "Enter a valid email address",
  }),
  role: WorkspaceInviteRoleSchema.default("user"),
});

export const SignInSchema = z.object({
  email: z.string().trim().email({
    message: "Enter a valid email address",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email({
    message: "Enter a valid email address",
  }),
});

export const KnowledgeSourceTypeSchema = z.enum([
  "document",
  "playbook",
  "policy",
  "faq",
  "note",
]);
