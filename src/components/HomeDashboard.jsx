"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomeDashboard({ initialUser = null }) {
  const router = useRouter();

  // User State (supports passed props or localStorage/default mockup user)
  const [user, setUser] = useState(
    initialUser || {
      fullName: "Alex Rivera",
      email: "alex.rivera@example.com",
    }
  );

  const [activeTab, setActiveTab] = useState("home");
  const [currentDateTime, setCurrentDateTime] = useState("");

  // Recent 3 Activities (Creator & Payer actions)
  const [recentActivities, setRecentActivities] = useState([
    {
      id: "act_1",
      type: "payment_received",
      title: "Payment received from Alex",
      subtitle: "Dinner at Dorsia • 2 hours ago",
      amount: "+$45.00",
      amountType: "positive",
      status: "received",
      role: "creator",
    },
    {
      id: "act_2",
      type: "split_created",
      title: "New Split created",
      subtitle: "Weekend Getaway • Yesterday",
      amount: null,
      status: "Pending",
      statusBadge: "Pending",
      role: "creator",
    },
    {
      id: "act_3",
      type: "payment_settled",
      title: "Settled payment to Sarah",
      subtitle: "Cab to Airport • 3 days ago",
      amount: "-$22.50",
      amountType: "negative",
      status: "Settled",
      statusBadge: "Settled",
      role: "payer",
    },
  ]);

  // Summary Metrics
  const [stats, setStats] = useState({
    creator: {
      active: 4,
      pendingAmount: "$1.2k",
    },
    payer: {
      dueCount: 2,
      totalDue: "$340",
    },
  });

  // Calculate User Initials for Top Avatar
  const getUserInitials = (name) => {
    if (!name) return "JD";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const userInitials = getUserInitials(user?.fullName || "Alex Rivera");

  // Live formatted timestamp matching design: "Tuesday, August 18, 2026 at 02:47 AM"
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      const formatted = now
        .toLocaleDateString("en-US", options)
        .replace(",", "")
        .replace(" at ", " at ");
      setCurrentDateTime(formatted);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  /*
   * BACKEND CONTRACT (From PRD Section 8.1 & 9.1 Dashboard Data Flow):
   *
   * 1. GET /api/dashboard/summary
   *    Headers: { Authorization: "Bearer <token>" }
   *    Expects:
   *    {
   *      success: true,
   *      user: { id, fullName, email },
   *      stats: {
   *        creator: { active: 4, pendingAmount: "$1.2k" },
   *        payer: { dueCount: 2, totalDue: "$340" }
   *      }
   *    }
   *
   * 2. GET /api/dashboard/activities?limit=3
   *    Headers: { Authorization: "Bearer <token>" }
   *    Expects:
   *    {
   *      success: true,
   *      activities: [
   *        { id, title, subtitle, amount, status, role, timestamp }
   *      ]
   *    }
   *
   * 3. POST /api/auth/logout
   *    Expects: { success: true, message: "Logged out successfully" }
   */

  const handleLogout = async () => {
    try {
      // Simulate logout network call
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push("/login");
    } catch (err) {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#faf8f4] text-[#121214]">
      {/* ───────────────────────────────────────────────────────────
          1. LEFT SIDEBAR NAVIGATION
         ─────────────────────────────────────────────────────────── */}
      <aside className="w-full md:w-64 lg:w-72 bg-white border-b md:border-b-0 md:border-r border-[#ebe7dc] flex flex-col justify-between p-6 sm:p-8 shrink-0 select-none">
        <div>
          {/* Brand Logo in Serif Luxury typography */}
          <div className="mb-10">
            <Link href="/dashboard" className="inline-block">
              <h1 className="font-serif-luxury text-3xl font-bold tracking-tight text-[#121214] leading-[1.05]">
                CRED
                <br />
                Split
              </h1>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {/* Home Link (Active) */}
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
                activeTab === "home"
                  ? "bg-[#faf8f4] text-[#121214] border-r-2 border-[#121214] font-bold"
                  : "text-[#6c6a75] hover:text-[#121214] hover:bg-[#fbf9f4]"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                  <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
                </svg>
                <span>Home</span>
              </div>
            </button>

            {/* Creator Dashboard Link */}
            <button
              type="button"
              onClick={() => setActiveTab("creator")}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                activeTab === "creator"
                  ? "bg-[#faf8f4] text-[#121214] border-r-2 border-[#121214] font-bold"
                  : "text-[#6c6a75] hover:text-[#121214] hover:bg-[#fbf9f4]"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.75}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                  />
                </svg>
                <span>Creator Dashboard</span>
              </div>
            </button>

            {/* Payer Dashboard Link */}
            <button
              type="button"
              onClick={() => setActiveTab("payer")}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                activeTab === "payer"
                  ? "bg-[#faf8f4] text-[#121214] border-r-2 border-[#121214] font-bold"
                  : "text-[#6c6a75] hover:text-[#121214] hover:bg-[#fbf9f4]"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.75}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                  />
                </svg>
                <span>Payer Dashboard</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Bottom Logout Button */}
        <div className="pt-8 border-t border-[#f0ece2]">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 text-xs font-bold tracking-wider text-[#6c6a75] hover:text-[#121214] transition-colors uppercase cursor-pointer py-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA
         ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="w-full bg-white/70 backdrop-blur-md border-b border-[#ebe7dc] px-6 sm:px-10 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="font-serif-luxury text-xl font-bold tracking-tight text-[#121214]">
              Split
            </span>
          </div>

          {/* Right Header: Notifications & Profile Initials Avatar */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button
              type="button"
              className="p-2 text-[#6c6a75] hover:text-[#121214] rounded-full hover:bg-[#f3ede1] transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
            </button>

            {/* Profile Avatar with User Initials */}
            <div
              className="w-9 h-9 rounded-full bg-[#121214] text-white flex items-center justify-center font-bold text-xs tracking-wider ring-2 ring-[#e2dac9] cursor-pointer shadow-xs"
              title={`${user?.fullName || "User"} (${user?.email || ""})`}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <div className="flex-1 p-6 sm:p-10 lg:p-12 space-y-9 max-w-6xl w-full mx-auto">
          {/* Hero Welcome Section */}
          <div className="space-y-3">
            {/* Date Time Live Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f1ebe0] border border-[#e0d6c3] text-[11px] font-semibold text-[#5c5647]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a35229]" />
              <span>{currentDateTime || "Tuesday, August 18, 2026 at 02:47 AM"}</span>
            </div>

            {/* Main Greeting */}
            <h2 className="font-serif-luxury text-4xl sm:text-5xl font-bold tracking-tight text-[#121214]">
              Welcome back.
            </h2>
            <p className="text-sm sm:text-base text-[#6c6a75] font-normal leading-relaxed max-w-2xl">
              Manage your active splits, track incoming payments, or settle your open balances.
            </p>
          </div>

          {/* ───────────────────────────────────────────────────────────
              3. ACTION CARDS GRID (Creator & Payer)
             ─────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD 1: Creator Dashboard */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#ebe7dc] shadow-[0_10px_25px_-15px_rgba(0,0,0,0.04)] flex flex-col justify-between transition-all hover:shadow-[0_15px_30px_-15px_rgba(0,0,0,0.08)]">
              <div>
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#f8f5ee] border border-[#ded7c8] flex items-center justify-center text-[#121214] mb-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                    />
                  </svg>
                </div>

                {/* Title & Description */}
                <h3 className="font-serif-luxury text-2xl font-bold tracking-tight text-[#121214] mb-2">
                  Creator Dashboard
                </h3>
                <p className="text-xs sm:text-sm text-[#6c6a75] leading-relaxed mb-6">
                  Create new splits, manage participants, and track incoming payments in real-time.
                </p>
              </div>

              {/* Bottom Row */}
              <div className="pt-4 border-t border-[#f0ece2] flex items-center justify-between gap-4">
                <Link
                  href="#creator-splits"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("creator");
                  }}
                  className="text-xs font-bold text-[#8a4220] hover:text-[#5e2b13] transition-colors flex items-center gap-1.5"
                >
                  <span>Create &amp; Manage Splits</span>
                  <span>→</span>
                </Link>

                {/* Metrics Badges */}
                <div className="flex items-center gap-2">
                  <div className="border border-[#ded7c8] rounded-md px-3 py-1 text-center bg-[#fcfbf8]">
                    <span className="block text-[9px] uppercase tracking-wider text-[#8a8474] font-semibold">
                      Active
                    </span>
                    <span className="text-base font-bold text-[#121214] font-mono leading-none">
                      {stats.creator.active}
                    </span>
                  </div>

                  <div className="border border-[#ded7c8] rounded-md px-3 py-1 text-center bg-[#fcfbf8]">
                    <span className="block text-[9px] uppercase tracking-wider text-[#8a8474] font-semibold">
                      Pending
                    </span>
                    <span className="text-base font-serif-luxury font-bold text-[#8a4220] leading-none">
                      {stats.creator.pendingAmount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: Payer Dashboard */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#ebe7dc] shadow-[0_10px_25px_-15px_rgba(0,0,0,0.04)] flex flex-col justify-between transition-all hover:shadow-[0_15px_30px_-15px_rgba(0,0,0,0.08)]">
              <div>
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#f8f5ee] border border-[#ded7c8] flex items-center justify-center text-[#121214] mb-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
                    />
                  </svg>
                </div>

                {/* Title & Description */}
                <h3 className="font-serif-luxury text-2xl font-bold tracking-tight text-[#121214] mb-2">
                  Payer Dashboard
                </h3>
                <p className="text-xs sm:text-sm text-[#6c6a75] leading-relaxed mb-6">
                  Review your outstanding splits, view history, and settle balances securely.
                </p>
              </div>

              {/* Bottom Row */}
              <div className="pt-4 border-t border-[#f0ece2] flex items-center justify-between gap-4">
                <Link
                  href="#payer-bills"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("payer");
                  }}
                  className="text-xs font-bold text-[#121214] hover:text-[#5e2b13] transition-colors flex items-center gap-1.5"
                >
                  <span>View &amp; Pay My Bills</span>
                  <span>→</span>
                </Link>

                {/* Metrics Badges */}
                <div className="flex items-center gap-2">
                  <div className="border border-[#ded7c8] rounded-md px-3 py-1 text-center bg-[#fcfbf8]">
                    <span className="block text-[9px] uppercase tracking-wider text-[#8a8474] font-semibold">
                      Due
                    </span>
                    <span className="text-base font-serif-luxury font-bold text-[#992222] leading-none">
                      {stats.payer.dueCount}
                    </span>
                  </div>

                  <div className="border border-[#ded7c8] rounded-md px-3 py-1 text-center bg-[#fcfbf8]">
                    <span className="block text-[9px] uppercase tracking-wider text-[#8a8474] font-semibold">
                      Total
                    </span>
                    <span className="text-base font-serif-luxury font-bold text-[#121214] leading-none">
                      {stats.payer.totalDue}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────
              4. RECENT ACTIVITY SECTION (Last 3 Activities)
             ─────────────────────────────────────────────────────────── */}
          <div className="space-y-4 pt-2">
            <h3 className="font-serif-luxury text-2xl font-bold tracking-tight text-[#121214]">
              Recent Activity
            </h3>

            <div className="bg-white rounded-2xl border border-[#ebe7dc] divide-y divide-[#f0ece2] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#fdfcf9] transition-colors"
                >
                  {/* Left: Icon & Description */}
                  <div className="flex items-center gap-3.5 sm:gap-4">
                    {/* Activity Icon Container */}
                    <div className="w-10 h-10 rounded-xl bg-[#f8f5ee] border border-[#ded7c8] flex items-center justify-center text-[#121214] shrink-0">
                      {act.type === "payment_received" ? (
                        /* Incoming Payment Arrow */
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4 text-[#8a4220]"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
                          />
                        </svg>
                      ) : act.type === "split_created" ? (
                        /* Receipt / Document Icon */
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.75}
                          stroke="currentColor"
                          className="w-4 h-4 text-[#121214]"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                          />
                        </svg>
                      ) : (
                        /* Outgoing Settled Check Icon */
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4 text-[#18794e]"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Text Title & Subtitle */}
                    <div>
                      <h4 className="text-sm font-semibold text-[#121214]">
                        {act.title}
                      </h4>
                      <p className="text-xs text-[#787582] mt-0.5">
                        {act.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount or Status Badge */}
                  <div className="text-right shrink-0">
                    {act.amount ? (
                      <span
                        className={`font-serif-luxury text-lg font-bold ${
                          act.amountType === "positive"
                            ? "text-[#8a4220]"
                            : "text-[#121214]"
                        }`}
                      >
                        {act.amount}
                      </span>
                    ) : act.statusBadge ? (
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-[#fbf7ee] border border-[#e2d8c3] text-[#8a5d24]">
                        {act.statusBadge}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
