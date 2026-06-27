import { AcceptInviteClient } from "@/components/auth/accept-invite-client";
import Hero from "@/sections/hero";

export const metadata = {
  title: "Accept Invite | Radar",
  description: "Accept a Radar workspace invitation and continue setup.",
};

export default function AcceptInvitePage() {
  return (
    <div>
      <Hero>
        <AcceptInviteClient />
      </Hero>
    </div>
  );
}
