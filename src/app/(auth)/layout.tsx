export default function AuthGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <div className="flex w-full max-w-5xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            R
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Radar</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Customer-facing business verification for assertion-led teams.
            </p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
