import { OverviewPage } from "@/components/admin/overview-page";

type OverviewRouteProps = {
  searchParams: Promise<{
    onboarding?: string;
  }>;
};

export default async function OverviewRoute({ searchParams }: OverviewRouteProps) {
  const params = await searchParams;

  return (
    <OverviewPage onboardingAudience={params.onboarding === "user" ? "user" : undefined} />
  );
}
