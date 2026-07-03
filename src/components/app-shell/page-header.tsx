import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";

type PageHeaderProps = {
  title: string;
  description: string;
  status?: string;
  children?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  status = "No data",
  children,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b bg-background pb-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl leading-tight font-semibold tracking-normal text-foreground md:text-3xl">
              {title}
            </h1>
            <Badge variant="secondary">{status}</Badge>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            {description}
          </p>
        </div>
        {children ? <div className="flex items-center gap-2">{children}</div> : null}
      </div>
    </header>
  );
}
