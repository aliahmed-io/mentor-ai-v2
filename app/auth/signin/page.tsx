"use client";

import { Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { FaGoogle } from "react-icons/fa";
import { MentorLogoLong } from "@/components/globals/MentorLogo";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const error = searchParams.get("error");

  const handleSignIn = async (provider: string) => {
    await signIn(provider, { callbackUrl });
  };

  return (
    <div className="relative overflow-hidden w-full max-w-md border border-border bg-card rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-primary/5 space-y-8 flex flex-col items-center">
      {/* Decorative Top Accent Line (Primary Sage to Accent Sand to Primary Sage) */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="space-y-6 text-center pb-2 flex flex-col items-center w-full">
        {/* Official Brand Logo */}
        <div className="transform transition-transform duration-300 hover:scale-105">
          <MentorLogoLong />
        </div>

        <div className="space-y-2">
          <h2 className="text-4xl font-serif font-extrabold tracking-tight text-foreground pt-2 select-none">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground font-medium font-sans max-w-[280px] leading-relaxed mx-auto">
            Sign in to your study sanctuary to continue your mindful journey.
          </p>
        </div>

        {error && (
          <div
            className="w-full flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-2xl text-xs text-left"
            role="alert"
          >
            <span className="h-2 w-2 rounded-full bg-destructive shrink-0 animate-ping" />
            <span className="font-semibold font-sans">
              Authentication failed. Please try again.
            </span>
          </div>
        )}
      </div>

      <div className="pt-2 w-full">
        <button
          onClick={() => handleSignIn("google")}
          className="relative group w-full h-12 flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-md hover:shadow-lg font-bold text-sm rounded-full active:scale-[0.98] cursor-pointer transform hover:-translate-y-0.5"
        >
          <FaGoogle className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-sans">Sign in with Google</span>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center pt-2 w-full text-center space-y-4 border-t border-border/60">
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-bold font-sans">
          <Sparkles className="size-3 text-primary animate-pulse" />
          <span>Our Vision</span>
        </div>
        <p className="text-xs italic font-serif text-muted-foreground/80 max-w-[280px] leading-relaxed">
          "Software should feel like an open window on a warm spring afternoon."
        </p>

        <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-[280px] font-sans font-light">
          By signing in, you agree to our{" "}
          <a
            href="#"
            className="underline font-medium hover:text-foreground transition-colors duration-200"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="underline font-medium hover:text-foreground transition-colors duration-200"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden px-4 select-none">
      {/* Decorative Warm Organic Floating Blobs (Matched perfectly to Home Page) */}
      <div className="absolute top-24 -left-36 size-[450px] rounded-full bg-primary/10 blur-3xl -z-10 animate-float" />
      <div className="absolute bottom-24 -right-36 size-[500px] rounded-full bg-primary/5 blur-3xl -z-10 animate-float-delayed" />
      <div className="absolute top-1/2 left-1/3 size-[400px] rounded-full bg-secondary/20 blur-3xl -z-10 animate-pulse-slow" />

      <Suspense
        fallback={
          <div className="relative overflow-hidden w-full max-w-md border border-border bg-card rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-primary/5 space-y-8 flex flex-col items-center animate-pulse">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="space-y-4 text-center pb-2 flex flex-col items-center w-full">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/60 text-neutral-300">
                <div className="h-7 w-7 rounded bg-neutral-100 animate-pulse" />
              </div>
              <h2 className="text-4xl font-serif font-extrabold tracking-tight text-neutral-300 pt-2">
                Welcome back
              </h2>
              <p className="text-sm text-neutral-400 font-medium animate-pulse">
                Loading your sanctuary...
              </p>
            </div>

            <div className="pt-2 w-full">
              <button
                disabled
                className="w-full h-12 bg-neutral-100 text-neutral-300 rounded-full cursor-not-allowed flex items-center justify-center gap-3"
              >
                <FaGoogle className="h-4 w-4 text-neutral-200" />
                Sign in with Google
              </button>
            </div>

            <div className="flex justify-center pt-2 w-full">
              <p className="text-xs text-neutral-300 leading-relaxed max-w-[280px] text-center">
                Please wait while we establish secure access.
              </p>
            </div>
          </div>
        }
      >
        <SignInContent />
      </Suspense>
    </div>
  );
}
