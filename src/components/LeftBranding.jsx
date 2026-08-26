"use client";

import { useState } from "react";

export default function LeftBranding() {
  const [selectedSplitType, setSelectedSplitType] = useState("equal");

  return (
    <div className="relative flex flex-col justify-between w-full h-full p-8 sm:p-12 lg:p-14 xl:p-16 overflow-hidden select-none bg-[#f3ede1]/80">
      {/* Refined Ambient Glow & Mesh Highlights */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-radial from-[#e8dcbe]/70 via-[#f3ede1]/30 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-radial from-[#dfd1b0]/50 via-[#f3ede1]/20 to-transparent blur-3xl pointer-events-none" />

      {/* Top Protocol Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-[#e0d6c3] shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#121214] animate-pulse" />
          <span className="text-[10px] tracking-[0.22em] font-bold text-[#35333a] uppercase">
            CRED SPLIT • EXPENSE SUITE
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7a7465]">
          <span className="text-[#18794e] font-bold">●</span>
          <span>Live Sync</span>
        </div>
      </div>

      {/* Center Branding & Visual Showcase */}
      <div className="relative z-10 my-auto py-6 max-w-xl">
        {/* Brand Headline */}
        <div className="space-y-3 mb-8">
          <div className="inline-block">
            <h1 className="font-serif-luxury text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#121214] leading-[1.02]">
              CRED Split
            </h1>
            <div className="h-0.5 w-16 bg-[#121214] mt-2" />
          </div>

          <p className="font-serif-luxury italic text-xl sm:text-2xl text-[#4e4a3f] font-normal leading-snug pt-1">
            Seamlessly manage shared expenses with premium clarity and control.
          </p>
        </div>

        {/* Hero Interactive Expense Preview Card */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-[#dfd6c4] shadow-[0_20px_40px_-15px_rgba(40,30,15,0.07)] transition-all duration-300">
          {/* Card Top: Title & Total */}
          <div className="flex items-start justify-between pb-4 border-b border-[#eee7d8]">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#8c8472] uppercase block mb-1">
                Active Group Split
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#121214] tracking-tight">
                Goa Getaway • Villa &amp; Dining
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#706a5b]">4 members</span>
                <span className="text-[#c2baa7]">•</span>
                <span className="text-xs text-[#18794e] font-semibold">3 Paid</span>
                <span className="text-[#c2baa7]">•</span>
                <span className="text-xs text-[#b45309] font-semibold">1 Pending</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8c8472] block">
                Total Bill
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[#121214] font-mono tracking-tight">
                ₹32,000
              </span>
            </div>
          </div>

          {/* Card Middle: Split Breakdown Progress Bar */}
          <div className="py-4">
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-[#524d40]">Collection Progress</span>
              <span className="text-[#121214]">75% Reconciled (₹24,000 / ₹32,000)</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="grid grid-cols-4 gap-1.5 h-2.5">
              <div className="bg-[#121214] rounded-full" title="Rahul - Paid ₹8,000" />
              <div className="bg-[#121214] rounded-full" title="Ananya - Paid ₹8,000" />
              <div className="bg-[#121214] rounded-full" title="Vikram - Paid ₹8,000" />
              <div className="bg-[#e4dccb] rounded-full relative overflow-hidden" title="You - Due ₹8,000">
                <div className="absolute inset-0 bg-[#b45309]/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Card Bottom: Member Quick Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="p-2 rounded-xl bg-[#f8f5ee] border border-[#e8dfce] flex items-center justify-between">
              <span className="font-semibold text-[#121214]">Rahul S.</span>
              <span className="text-[10px] font-bold text-[#18794e]">✓ Paid</span>
            </div>
            <div className="p-2 rounded-xl bg-[#f8f5ee] border border-[#e8dfce] flex items-center justify-between">
              <span className="font-semibold text-[#121214]">Ananya K.</span>
              <span className="text-[10px] font-bold text-[#18794e]">✓ Paid</span>
            </div>
            <div className="p-2 rounded-xl bg-[#f8f5ee] border border-[#e8dfce] flex items-center justify-between">
              <span className="font-semibold text-[#121214]">Vikram M.</span>
              <span className="text-[10px] font-bold text-[#18794e]">✓ Paid</span>
            </div>
            <div className="p-2 rounded-xl bg-[#fffcf5] border border-[#d8caa8] flex items-center justify-between shadow-xs">
              <span className="font-bold text-[#121214]">You</span>
              <span className="text-[10px] font-bold text-[#b45309]">⏳ ₹8k Due</span>
            </div>
          </div>
        </div>

        {/* Feature Highlights: 3 Clean Minimalist Horizontal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <div className="p-3.5 rounded-xl bg-white/60 backdrop-blur-xs border border-[#e4dcce] hover:bg-white/90 transition-all">
            <div className="text-sm font-bold text-[#121214] mb-0.5 flex items-center gap-1.5">
              <span>÷</span> Equal &amp; Custom
            </div>
            <p className="text-[11px] text-[#6d6657] leading-relaxed">
              Split equally or assign exact itemized shares per person.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/60 backdrop-blur-xs border border-[#e4dcce] hover:bg-white/90 transition-all">
            <div className="text-sm font-bold text-[#121214] mb-0.5 flex items-center gap-1.5">
              <span>🧾</span> Verified Proofs
            </div>
            <p className="text-[11px] text-[#6d6657] leading-relaxed">
              Submit payment screenshots for instant creator approval.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/60 backdrop-blur-xs border border-[#e4dcce] hover:bg-white/90 transition-all">
            <div className="text-sm font-bold text-[#121214] mb-0.5 flex items-center gap-1.5">
              <span>⚖️</span> Zero Shortfall
            </div>
            <p className="text-[11px] text-[#6d6657] leading-relaxed">
              Automated balance closing and shortfall settlement.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Security & Metrics Bar */}
      <div className="relative z-10 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#736c5c] border-t border-[#dfd6c4]">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-[#2b2923] flex items-center gap-1">
            <span>🛡️</span> Bank-Grade Encryption
          </span>
          <span>•</span>
          <span className="font-semibold text-[#2b2923]">100% Audit Trail</span>
        </div>

        <span className="text-[11px] tracking-wider uppercase font-medium text-[#8f8776]">
          CRED Financial Design
        </span>
      </div>
    </div>
  );
}
