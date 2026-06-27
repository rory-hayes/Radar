import { OverviewPage } from "@/components/admin/overview-page";

type AppPageProps = {
  searchParams: Promise<{
    onboarding?: string;
  }>;
};

export default async function AppPage({ searchParams }: AppPageProps) {
  const params = await searchParams;

  return (
    <OverviewPage onboardingAudience={params.onboarding === "user" ? "user" : undefined} />
  );
}
