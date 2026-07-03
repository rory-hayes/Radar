import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { EmptyState } from "@/components/radar/empty-state";
import { Button } from "@/components/ui/button";

type NotFoundStateProps = {
  title?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
};

export function NotFoundState({
  title = "Page not found",
  description = "Radar has not introduced that route in the active build phase.",
  href = "/",
  actionLabel = "Return to Radar",
}: NotFoundStateProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={
        <Button asChild variant="outline">
          <Link href={href}>
            <ArrowLeftIcon data-icon="inline-start" />
            {actionLabel}
          </Link>
        </Button>
      }
    />
  );
}
