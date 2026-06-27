import SignInForm from "@/components/auth/sign-in-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getAuthSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const SignIn = async () => {
  const session = await getAuthSession();

  if (session) {
    redirect("/app");
  }

  return (
    <AuthShell
      title="Sign in to Radar"
      description="Open the shared workspace, add approved knowledge, invite users, and review ended Radar calls from one clean dashboard."
    >
      <SignInForm />
    </AuthShell>
  );
};

export default SignIn;
