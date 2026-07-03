import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { requireActiveWorkspace } from "@/lib/workspaces/server";

export default async function AppGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAuthenticatedUser();
  const membership = await requireActiveWorkspace();

  return <AppShell user={user} membership={membership}>{children}</AppShell>;
}
