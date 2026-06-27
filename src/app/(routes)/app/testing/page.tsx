import { redirect } from "next/navigation";

export default function TestingRedirectPage() {
  redirect("/app/sessions");
}
