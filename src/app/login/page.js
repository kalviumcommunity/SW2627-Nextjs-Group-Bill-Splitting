import LeftBranding from "@/components/LeftBranding";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Login | CRED Split",
  description: "Enter your credentials to access your CRED Split dashboard and manage shared expenses.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f6f3eb] text-[#0f0f12]">
      {/* Left Section: CRED Split Identity, Remark & Live Bill Split Showcase */}
      <section className="w-full lg:w-1/2 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#e6e1d4] relative">
        <LeftBranding />
      </section>

      {/* Right Section: Login Form Card */}
      <section className="w-full lg:w-1/2 flex items-center justify-center bg-[#faf8f4] relative">
        <LoginForm />
      </section>
    </main>
  );
}
