"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import LeftBranding from "@/components/LeftBranding";
import OtpVerifyForm from "@/components/OtpVerifyForm";

const emptySubscribe = () => () => {};

function useSessionItem(key) {
  return useSyncExternalStore(
    emptySubscribe,
    () => (typeof window !== "undefined" ? sessionStorage.getItem(key) || "" : ""),
    () => ""
  );
}

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function VerifyOtpPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const email = useSessionItem("auth_verify_email");
  const userId = useSessionItem("auth_verify_userId");

  // Guard: redirect to /register if no session exists once client is mounted
  useEffect(() => {
    if (!isClient) return;
    if (!email && !userId) {
      router.replace("/register");
    }
  }, [isClient, email, userId, router]);

  if (!isClient || (!email && !userId)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f6f3eb]">
        <div className="animate-spin h-6 w-6 border-2 border-[#121214] border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleBack = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth_verify_email");
      sessionStorage.removeItem("auth_verify_userId");
    }
    router.push("/register");
  };

  const handleSuccess = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth_verify_email");
      sessionStorage.removeItem("auth_verify_userId");
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f6f3eb] text-[#0f0f12]">
      {/* Left Section: CRED Split Identity, Remark & Live Bill Split Showcase */}
      <section className="w-full lg:w-1/2 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#e6e1d4] relative">
        <LeftBranding />
      </section>

      {/* Right Section: OTP Verification Form Card */}
      <section className="w-full lg:w-1/2 flex items-center justify-center bg-[#faf8f4] relative">
        <OtpVerifyForm
          email={email}
          userId={userId}
          onBack={handleBack}
          onSuccess={handleSuccess}
        />
      </section>
    </main>
  );
}
