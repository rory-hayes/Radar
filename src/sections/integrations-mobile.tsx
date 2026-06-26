import googleDrive from "@/assets/images/google-drive.png";
import creativeCloud from "@/assets/images/creative-cloud.png";
import jira from "@/assets/images/jira.png";
import gmail from "@/assets/images/gmail.png";
import figma from "@/assets/images/figma-lg.png";
import outlook from "@/assets/images/outlook.png";
import slack from "@/assets/images/slack.png";

import mega from "@/assets/images/mega.png";
import airtable from "@/assets/images/airtable.png";
import googleCalendar from "@/assets/images/google-calendar.png";
import intercomm from "@/assets/images/intercomm.png";
import salesForce from "@/assets/images/salesforce.png";
import googleMeet from "@/assets/images/google-meet.png";
import hubspot from "@/assets/images/hubspot.png";

import Image from "next/image";

const IntegrationsMobile = () => {
  const row1 = [
    {
      title: "Google Drive",
      icon: googleDrive,
      href: "#",
    },
    {
      title: "Creative Cloud",
      icon: creativeCloud,
      href: "#",
    },
    {
      title: "Jira",
      icon: jira,
      href: "#",
    },
    {
      title: "Gmail",
      icon: gmail,
      href: "#",
    },
    {
      title: "Figma",
      icon: figma,
      href: "#",
    },
    {
      title: "Outlook",
      icon: outlook,
      href: "#",
    },
    {
      title: "Slack",
      icon: slack,
      href: "#",
    },
  ];

  const row2 = [
    {
      title: "Mega",
      icon: mega,
      href: "#",
    },
    {
      title: "Hubspot",
      icon: hubspot,
      href: "#",
    },
    {
      title: "Google Calendar",
      icon: googleCalendar,
      href: "#",
    },
    {
      title: "Intercomm",
      icon: intercomm,
      href: "#",
    },
    {
      title: "Airtable",
      icon: airtable,
      href: "#",
    },
    {
      title: "Salesforce",
      icon: salesForce,
      href: "#",
    },
    {
      title: "Google Meet",
      icon: googleMeet,
      href: "#",
    },
  ];

  return (
    <section id="sources-mobile" className="w-full overflow-hidden py-20 md:hidden">
      <div className=" max-w-7xl w-full flex flex-col items-center mx-auto">
        <div className=" inline-flex bg-white border rounded-full shadow-md items-center justify-center py-2 px-6">
          <p className=" text-lg">Approved Sources</p>
        </div>

        <h2 className=" text-5xl px-4 md:px-0 md:text-7xl max-w-2xl font-medium text-center mt-6 mx-auto">
          Connect the systems your team already trusts
        </h2>
        <p className="mt-4 max-w-2xl px-4 text-center text-lg leading-7 text-black/60">
          Source connectors stay disabled until admins approve ownership,
          freshness, and citation policy.
        </p>
      </div>
      <div className="mt-12 grid w-full grid-cols-3 gap-3 px-4">
        {[...row1, ...row2].map((item) => (
          <div
            key={item.title}
            className="flex aspect-square w-full items-center justify-center rounded-xl border border-input bg-white"
          >
            <div className="relative h-12 aspect-square">
              <Image
                fill
                className="object-contain"
                src={item.icon}
                alt={item.title}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default IntegrationsMobile;
