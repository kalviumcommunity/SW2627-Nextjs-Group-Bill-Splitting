import LeftBranding from "@/components/LeftBranding";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = {
  title: "Forgot Password | CRED Split",
  description: "Enter your email address to receive an OTP code and reset your CRED Split account password.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f6f3eb] text-[#0f0f12]">
      {/* Left Section: CRED Split Identity, Remark & Live Bill Split Showcase */}
      <section className="w-full lg:w-1/2 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#e6e1d4] relative">
        <LeftBranding />
      </section>

      {/* Right Section: Forgot Password Card */}
      <section className="w-full lg:w-1/2 flex items-center justify-center bg-[#faf8f4] relative">
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
