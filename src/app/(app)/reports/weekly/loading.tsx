import { LoadingState } from "@/components/radar";

export default function WeeklyTrustReportLoading() {
  return (
    <LoadingState
      title="Preparing weekly trust report"
      description="Summarizing checks, exceptions, resolved findings, risky categories, and export sections."
    />
  );
}
