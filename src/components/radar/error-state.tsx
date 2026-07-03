import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ErrorStateProps = {
  title: string;
  description: string;
  reference?: string;
  action?: React.ReactNode;
};

export function ErrorState({ title, description, reference, action }: ErrorStateProps) {
  return (
    <Alert variant="destructive" className="rounded-lg">
      <CircleAlertIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col gap-3">
          <p>{description}</p>
          {reference ? <p className="font-mono text-xs">Reference: {reference}</p> : null}
          {action ? <div className="flex items-center gap-2">{action}</div> : null}
        </div>
      </AlertDescription>
    </Alert>
  );
}
