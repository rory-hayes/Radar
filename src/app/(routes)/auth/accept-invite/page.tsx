import { AcceptInviteClient } from "@/components/auth/accept-invite-client";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = {
  title: "Accept Invite | Radar",
  description: "Accept a Radar workspace invitation and continue setup.",
};

export default function AcceptInvitePage() {
  return (
    <AuthShell
      title="Join your Radar workspace"
      description="Accept the invite, complete personal setup, then install the Chrome extension before your first customer conversation."
    >
      <AcceptInviteClient />
    </AuthShell>
  );
}
