"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LeftBranding from "@/components/LeftBranding";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");

  // Guard: read from sessionStorage, redirect to /forgot-password if no email or userId found
  useEffect(() => {
    const storedEmail = typeof window !== "undefined" ? sessionStorage.getItem("reset_password_email") : null;
    const storedUserId = typeof window !== "undefined" ? sessionStorage.getItem("reset_password_userId") : null;

    if (!storedEmail && !storedUserId) {
      router.replace("/forgot-password");
    } else {
      setEmail(storedEmail || "");
      setUserId(storedUserId || "");
      setMounted(true);
    }
  }, [router]);

  if (!mounted || (!email && !userId)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f6f3eb]">
        <div className="animate-spin h-6 w-6 border-2 border-[#121214] border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleSuccess = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("reset_password_email");
      sessionStorage.removeItem("reset_password_userId");
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f6f3eb] text-[#0f0f12]">
      {/* Left Section */}
      <section className="w-full lg:w-1/2 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#e6e1d4] relative">
        <LeftBranding />
      </section>

      {/* Right Section: Reset Password Form */}
      <section className="w-full lg:w-1/2 flex items-center justify-center bg-[#faf8f4] relative">
        <ResetPasswordForm
          email={email}
          userId={userId}
          onSuccess={handleSuccess}
        />
      </section>
    </main>
  );
}
