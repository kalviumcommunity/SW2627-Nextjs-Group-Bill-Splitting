import LeftBranding from "@/components/LeftBranding";
import OtpVerifyForm from "@/components/OtpVerifyForm";

export const metadata = {
  title: "Verify Account | CRED Split",
  description: "Enter your 6-digit email OTP verification code to activate your CRED Split account.",
};

export default function VerifyOtpPage() {
  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f6f3eb] text-[#0f0f12]">
      {/* Left Section: CRED Split Identity, Remark & Live Bill Split Showcase */}
      <section className="w-full lg:w-1/2 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#e6e1d4] relative">
        <LeftBranding />
      </section>

      {/* Right Section: OTP Verification Form Card */}
      <section className="w-full lg:w-1/2 flex items-center justify-center bg-[#faf8f4] relative">
        <OtpVerifyForm email="john.doe@example.com" />
      </section>
    </main>
  );
}
