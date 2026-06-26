"use client";

import SignInForm from "@/components/auth/sign-in-form";
import Hero from "@/sections/hero";

const SignIn = () => {
  return (
    <div>
      <Hero>
        <SignInForm />
      </Hero>
    </div>
  );
};

export default SignIn;
