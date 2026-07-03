import { AuthForm } from "@/components/auth/auth-form";
import { normalizeAuthRedirectPath } from "@/lib/auth/redirects";

type SignInPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;

  return <AuthForm mode="sign-in" nextPath={normalizeAuthRedirectPath(params.next)} routeError={params.error} />;
}
