import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export default async function AppGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAuthenticatedUser();

  return <AppShell user={user}>{children}</AppShell>;
}
