import { AuthForm } from "@/components/auth/auth-form";
import { normalizeAuthRedirectPath } from "@/lib/auth/redirects";

type SignUpPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;

  return <AuthForm mode="sign-up" nextPath={normalizeAuthRedirectPath(params.next)} />;
}
