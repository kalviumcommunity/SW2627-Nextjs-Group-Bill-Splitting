import LeftBranding from "@/components/LeftBranding";
import RegisterForm from "@/components/RegisterForm";

export const metadata = {
  title: "Register | CRED Split",
  description: "Create your CRED Split account to start splitting group expenses with premium clarity and control.",
};

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f6f3eb] text-[#0f0f12]">
      {/* Left Section: CRED Split Identity, Remark & Live Bill Split Showcase */}
      <section className="w-full lg:w-1/2 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#e6e1d4] relative">
        <LeftBranding />
      </section>

      {/* Right Section: Register Account Card */}
      <section className="w-full lg:w-1/2 flex items-center justify-center bg-[#faf8f4] relative">
        <RegisterForm />
      </section>
    </main>
  );
}
