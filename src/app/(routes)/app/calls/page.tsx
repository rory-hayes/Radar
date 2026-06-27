import { redirect } from "next/navigation";

export default function CallsRedirectPage() {
  redirect("/app/sessions");
}
