import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Password Recovery | Radar",
  description: "Recover access to a Radar workspace account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your Radar password"
      description="Enter your workspace email and Radar will send a reset link if that account has access."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
