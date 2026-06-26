import logoIcon from "@/assets/icons/logo-icon.svg";
import Image from "next/image";
import { Button } from "../ui/button";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SignInSchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { PasswordInput } from "../ui/password-input";
import { z } from "zod";

const SignInForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof SignInSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      console.log(values);
      console.log(error);
      console.log(success);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto relative">
      <div className="inline-flex bg-white shadow-md border rounded-xl aspect-square h-20 items-center justify-center">
        <Image width={32} height={32} src={logoIcon} alt="Logo icon" />
      </div>

      <div className=" w-full flex flex-col items-center text-center mt-6">
        <h2 className=" text-3xl font-medium text-black">Welcome back!</h2>
        <p className=" text-lg text-black/70">
          Please enter your details to continue
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 w-full">
          <div className="space-y-4 w-full mt-8">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="Email"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      disabled={isPending}
                      placeholder="Password"
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <div className=" w-full flex items-center justify-end">
              <Button
                variant="transparent"
                className=" text-primary hover:text-primary"
              >
                Forgot Password
              </Button>
            </div>
            <div className=" w-full flex flex-col gap-4">
              <Button type="submit">Sign In</Button>
              <div className="bg-[#EEEEEE] h-11 py-2 rounded-lg flex items-center justify-center gap-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 26 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.22674 9.76453C7.22545 6.93863 10.0694 4.90909 13.438 4.90909C15.2488 4.90909 16.8844 5.50909 18.1695 6.49091L21.9079 3C19.6298 1.14545 16.7091 0 13.438 0C8.3727 0 4.01162 2.6983 1.91504 6.65002L6.22674 9.76453Z"
                    fill="#E74438"
                  />
                  <path
                    d="M17.766 18.0125C16.5989 18.7162 15.1159 19.0909 13.4388 19.0909C10.0831 19.0909 7.24798 17.0768 6.23904 14.2678L1.91309 17.3349C4.00706 21.2936 8.36802 23.9999 13.4388 23.9999C16.5796 23.9999 19.5808 22.9573 21.8285 20.9995L17.766 18.0125Z"
                    fill="#44A35D"
                  />
                  <path
                    d="M21.8274 20.9998C24.1781 18.9523 25.7045 15.9038 25.7045 12.0002C25.7045 11.2911 25.5877 10.5275 25.4124 9.81836H13.4377V14.4547H20.3305C19.9904 16.0138 19.0775 17.2214 17.765 18.0128L21.8274 20.9998Z"
                    fill="#4386F3"
                  />
                  <path
                    d="M6.23807 14.2678C5.98249 13.5562 5.8441 12.7936 5.8441 11.9999C5.8441 11.2182 5.97833 10.4667 6.22653 9.76441L1.91483 6.6499C1.05446 8.26031 0.586914 10.0753 0.586914 11.9999C0.586914 13.9194 1.06323 15.73 1.91212 17.3349L6.23807 14.2678Z"
                    fill="#F8BD0B"
                  />
                </svg>
                Sign In with Google
              </div>
            </div>
          </div>
        </form>
      </Form>
      <div className=" w-full flex items-center justify-center absolute bottom-0">
        <Button
          variant="transparent"
          className=" text-primary hover:text-primary"
        >
          <span className=" text-black">Don&apos;t have an account?</span>
          Sign Up
        </Button>
      </div>
    </div>
  );
};

export default SignInForm;
