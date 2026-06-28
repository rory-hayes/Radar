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
  password: z.string().min(1, {
    message: "Enter your password",
  }),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email({
    message: "Enter a valid email address",
  }),
});

export const ResetPasswordSchema = z
  .object({
    accessToken: z.string().trim().min(20, {
      message: "Recovery token is required",
    }),
    refreshToken: z.string().trim().min(10, {
      message: "Recovery refresh token is required",
    }),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters",
    }),
    confirmPassword: z.string().min(8, {
      message: "Confirm your new password",
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const AcceptInviteSchema = z.object({
  accessToken: z.string().trim().min(20, {
    message: "Invite token is required",
  }),
});

export const KnowledgeSourceTypeSchema = z.enum([
  "document",
  "playbook",
  "policy",
  "faq",
  "note",
]);

export const ConnectorTypeSchema = z.enum([
  "google_drive",
  "confluence_jira",
  "notion",
  "support_crm",
  "other",
]);

export const ConnectorRequestSchema = z.object({
  connectorType: ConnectorTypeSchema.default("google_drive"),
  displayName: z.string().trim().min(2, {
    message: "Name the tool or source area.",
  }),
  sourceLocation: z.string().trim().max(500).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});
