"use client";

import Image from "next/image";

export default function LeftBranding() {
  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[650px] p-6 sm:p-10 lg:p-14 overflow-hidden select-none">
      {/* Background Illustration */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/branding-bg.jpg"
          alt="CRED Split"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-center"
        />
      </div>

      {/* Center Translucent Frosted Glass Box */}
      <div className="relative z-10 w-full max-w-[420px] bg-white/45 backdrop-blur-md rounded-2xl p-8 sm:p-10 border border-white/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.07)] text-center transition-all duration-300">
        <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#121214] mb-4 leading-tight">
          CRED Split
        </h1>
        <p className="font-serif-luxury italic text-lg sm:text-xl text-[#2a2824] font-normal leading-relaxed">
          Seamlessly manage shared expenses with premium clarity and control.
        </p>
      </div>
    </div>
  );
}
