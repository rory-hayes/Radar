import SignInForm from "@/components/auth/sign-in-form";
import { getAuthSession } from "@/lib/auth/session";
import Hero from "@/sections/hero";
import { redirect } from "next/navigation";

const SignIn = async () => {
  const session = await getAuthSession();

  if (session) {
    redirect("/app");
  }

  return (
    <div>
      <Hero>
        <SignInForm />
      </Hero>
    </div>
  );
};

export default SignIn;
