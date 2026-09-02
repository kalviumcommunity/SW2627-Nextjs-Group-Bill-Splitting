"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomeDashboard({ initialUser = null }) {
  const router = useRouter();

  // User State
  const [user, setUser] = useState(
    initialUser || {
      fullName: "Alex Rivera",
      email: "alex.rivera@example.com",
    }
  );

  const [activeTab, setActiveTab] = useState("home");
  const [activityFilter, setActivityFilter] = useState("all");
  const [currentDateTime, setCurrentDateTime] = useState("");

  // Recent 4 Activities (Creator & Payer actions)
  const [recentActivities, setRecentActivities] = useState([
    {
      id: "act_1",
      type: "payment_received",
      title: "Payment received from Alex",
      subtitle: "Dinner at Dorsia • 2 hours ago",
      amount: "+$45.00",
      amountType: "positive",
      status: "received",
      category: "creator",
      role: "creator",
    },
    {
      id: "act_2",
      type: "split_created",
      title: "New Split created",
      subtitle: "Weekend Getaway • Yesterday",
      amount: null,
      status: "Pending",
      statusBadge: "Pending Approval",
      category: "creator",
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
      category: "payer",
      role: "payer",
    },
    {
      id: "act_4",
      type: "payment_received",
      title: "Payment received from Maya",
      subtitle: "Concert Tickets • 4 days ago",
      amount: "+$65.00",
      amountType: "positive",
      status: "received",
      category: "creator",
      role: "creator",
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
    if (!name) return "AR";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const userInitials = getUserInitials(user?.fullName || "Alex Rivera");

  // Live Dynamic Clock (Updates every second)
  useEffect(() => {
    const formatLiveDateTime = (date) => {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const dayName = days[date.getDay()];
      const monthName = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();

      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours.toString().padStart(2, "0") : "12";

      return `${dayName}, ${monthName} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
    };

    const tick = () => {
      setCurrentDateTime(formatLiveDateTime(new Date()));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filtered Activities
  const filteredActivities = recentActivities.filter((item) => {
    if (activityFilter === "all") return true;
    if (activityFilter === "creator") return item.category === "creator";
    if (activityFilter === "payer") return item.category === "payer";
    return true;
  });

  /*
   * BACKEND CONTRACT (From PRD Section 8.1 & 9.1 Dashboard Summary):
   *
   * 1. GET /api/dashboard/summary
   *    Headers: { Authorization: "Bearer <token>" }
   *    Expects: { success: true, user: {...}, stats: {...} }
   *
   * 2. GET /api/dashboard/activities?limit=3
   *    Headers: { Authorization: "Bearer <token>" }
   *    Expects: { success: true, activities: [...] }
   *
   * 3. POST /api/auth/logout
   */
  const handleLogout = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      router.push("/login");
    } catch (err) {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen md:h-screen w-full flex flex-col md:flex-row bg-[#f8f5ee] text-[#121214] font-sans md:overflow-hidden">
      {/* ───────────────────────────────────────────────────────────
          1. LEFT SIDEBAR (Fixed Non-scrolling Sidebar)
         ─────────────────────────────────────────────────────────── */}
      <aside className="w-full md:w-60 lg:w-64 bg-white border-b md:border-b-0 md:border-r border-[#e8dfcf] flex flex-col justify-between p-6 sm:p-8 shrink-0 select-none md:h-full md:overflow-y-auto">
        <div>
          {/* Brand Heading */}
          <div className="mb-12">
            <Link href="/dashboard" className="inline-block">
              <h1 className="font-serif-luxury text-4xl sm:text-[42px] font-bold tracking-tight text-[#121214] leading-[0.92]">
                CRED
                <br />
                Split
              </h1>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-4">
            {/* Home (Active with right indicator bar) */}
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className={`w-full flex items-center justify-between py-1.5 text-sm font-semibold transition-colors text-left cursor-pointer ${
                activeTab === "home"
                  ? "text-[#121214]"
                  : "text-[#6c685f] hover:text-[#121214]"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-[#121214]"
                >
                  <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                  <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
                </svg>
                <span className="font-bold">Home</span>
              </div>
              {/* Vertical Active Line */}
              {activeTab === "home" && (
                <div className="w-[2px] h-6 bg-[#121214] -mr-6 sm:-mr-8" />
              )}
            </button>

            {/* Creator Dashboard */}
            <button
              type="button"
              onClick={() => setActiveTab("creator")}
              className={`w-full flex items-center justify-between py-1.5 text-sm font-medium transition-colors text-left cursor-pointer ${
                activeTab === "creator"
                  ? "text-[#121214] font-bold"
                  : "text-[#6c685f] hover:text-[#121214]"
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
              {activeTab === "creator" && (
                <div className="w-[2px] h-6 bg-[#121214] -mr-6 sm:-mr-8" />
              )}
            </button>

            {/* Payer Dashboard */}
            <button
              type="button"
              onClick={() => setActiveTab("payer")}
              className={`w-full flex items-center justify-between py-1.5 text-sm font-medium transition-colors text-left cursor-pointer ${
                activeTab === "payer"
                  ? "text-[#121214] font-bold"
                  : "text-[#6c685f] hover:text-[#121214]"
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
              {activeTab === "payer" && (
                <div className="w-[2px] h-6 bg-[#121214] -mr-6 sm:-mr-8" />
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Logout Button */}
        <div className="pt-6 border-t border-[#ede4d4]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-4 py-2.5 rounded-xl bg-[#e74c3c] hover:bg-[#d63031] text-white text-xs font-bold tracking-wider uppercase transition-all cursor-pointer shadow-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA (Scrollable Content)
         ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 md:h-full md:overflow-y-auto">
        {/* Top Header */}
        <header className="w-full bg-transparent px-6 sm:px-10 lg:px-12 pt-4 pb-2 flex items-center justify-end">
          {/* Right Header: Notification Bell inside circle & Initials Profile Avatar with Border */}
          <div className="flex items-center gap-3">
            {/* Bell Icon inside a circle */}
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-white border border-[#ded6c7] text-[#121214] flex items-center justify-center hover:bg-[#faf7f0] hover:shadow-xs transition-all cursor-pointer shadow-2xs"
              aria-label="Notifications"
            >
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
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
            </button>

            {/* Profile Avatar with Border */}
            <div
              className="w-10 h-10 rounded-full bg-[#121214] text-white flex items-center justify-center font-bold text-xs tracking-wider border-2 border-[#ded6c7] hover:border-[#121214] transition-colors cursor-pointer shadow-2xs"
              title={`${user?.fullName || "User"} (${user?.email || ""})`}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="flex-1 px-6 sm:px-10 lg:px-12 pb-12 space-y-7 max-w-5xl w-full">
          
          {/* Hero Welcome Header (With gap & dynamic user name) */}
          <div className="pt-0">
            {/* Timestamp Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ede6d8]/80 text-[11px] font-semibold text-[#4e4a40] mb-3.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8a3d1c]" />
              <span>{currentDateTime}</span>
            </div>

            {/* Main Welcome Headline with User Name */}
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-tight text-[#121214] leading-tight mb-2">
              Welcome back, {user?.fullName || "Alex Rivera"}.
            </h2>
            <p className="text-xs sm:text-sm text-[#605c52] font-normal leading-relaxed max-w-xl">
              Manage your active splits, track incoming payments, or settle your open balances.
            </p>
          </div>

          {/* ───────────────────────────────────────────────────────────
              3. ACTION CARDS (Creator & Payer)
             ─────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD 1: Creator Dashboard */}
            <div className="bg-white rounded-3xl p-8 border border-[#dfd7c8] shadow-[0_10px_30px_-15px_rgba(40,30,15,0.03)] hover:shadow-[0_20px_45px_-15px_rgba(40,30,15,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                {/* Rounded Square Icon Container */}
                <div className="w-12 h-12 rounded-2xl bg-[#f5ede2] border border-[#e5d8c3] flex items-center justify-center text-[#7a3b1d]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="w-6 h-6 text-[#7a3b1d]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                    />
                  </svg>
                </div>

                {/* Title & Description */}
                <h3 className="font-serif-luxury text-2xl sm:text-[26px] font-bold tracking-tight text-[#121214] mt-5 mb-2">
                  Creator Dashboard
                </h3>
                <p className="text-xs text-[#736e65] leading-relaxed max-w-sm mb-8">
                  Create new splits, manage participants, and track incoming payments in real-time.
                </p>
              </div>

              {/* Bottom Row */}
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="#creator-splits"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("creator");
                  }}
                  className="text-xs font-bold text-[#8a3d1c] underline underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  Create &amp; Manage Splits →
                </Link>

                {/* Metric Boxes */}
                <div className="flex items-center gap-2">
                  <div className="border border-[#ded6c7] rounded-2xl px-4 py-2 text-center bg-white min-w-[58px] shadow-2xs">
                    <span className="block text-[9px] uppercase tracking-wider text-[#8a8477] font-semibold">
                      ACTIVE
                    </span>
                    <span className="text-base font-bold text-[#121214] font-mono leading-none mt-0.5 block">
                      {stats.creator.active}
                    </span>
                  </div>

                  <div className="border border-[#ded6c7] rounded-2xl px-4 py-2 text-center bg-white min-w-[64px] shadow-2xs">
                    <span className="block text-[9px] uppercase tracking-wider text-[#8a8477] font-semibold">
                      PENDING
                    </span>
                    <span className="text-base font-serif-luxury font-bold text-[#8a3d1c] leading-none mt-0.5 block">
                      {stats.creator.pendingAmount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: Payer Dashboard */}
            <div className="bg-white rounded-3xl p-8 border border-[#dfd7c8] shadow-[0_10px_30px_-15px_rgba(40,30,15,0.03)] hover:shadow-[0_20px_45px_-15px_rgba(40,30,15,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                {/* Rounded Square Icon Container */}
                <div className="w-12 h-12 rounded-2xl bg-[#f5ede2] border border-[#e5d8c3] flex items-center justify-center text-[#7a3b1d]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="w-6 h-6 text-[#7a3b1d]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
                    />
                  </svg>
                </div>

                {/* Title & Description */}
                <h3 className="font-serif-luxury text-2xl sm:text-[26px] font-bold tracking-tight text-[#121214] mt-5 mb-2">
                  Payer Dashboard
                </h3>
                <p className="text-xs text-[#736e65] leading-relaxed max-w-sm mb-8">
                  Review your outstanding splits, view history, and settle balances securely.
                </p>
              </div>

              {/* Bottom Row */}
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="#payer-bills"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("payer");
                  }}
                  className="text-xs font-bold text-[#121214] underline underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  View &amp; Pay My Bills →
                </Link>

                {/* Metric Boxes */}
                <div className="flex items-center gap-2">
                  <div className="border border-[#ded6c7] rounded-2xl px-4 py-2 text-center bg-white min-w-[58px] shadow-2xs">
                    <span className="block text-[9px] uppercase tracking-wider text-[#8a8477] font-semibold">
                      DUE
                    </span>
                    <span className="text-base font-serif-luxury font-bold text-[#992222] leading-none mt-0.5 block">
                      {stats.payer.dueCount}
                    </span>
                  </div>

                  <div className="border border-[#ded6c7] rounded-2xl px-4 py-2 text-center bg-white min-w-[64px] shadow-2xs">
                    <span className="block text-[9px] uppercase tracking-wider text-[#8a8477] font-semibold">
                      TOTAL
                    </span>
                    <span className="text-base font-serif-luxury font-bold text-[#121214] leading-none mt-0.5 block">
                      {stats.payer.totalDue}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────
              4. RECENT ACTIVITY (With Filter Capsules matching screenshot)
             ─────────────────────────────────────────────────────────── */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-luxury text-3xl font-bold tracking-tight text-[#121214]">
                Recent Activity
              </h3>

              {/* Capsule Filter Pills matching screenshot */}
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white border border-[#e4d8c5] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActivityFilter("all")}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activityFilter === "all"
                      ? "bg-[#8a3d1c] text-white shadow-xs"
                      : "text-[#736e65] hover:text-[#121214]"
                  }`}
                >
                  All ({recentActivities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter("creator")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    activityFilter === "creator"
                      ? "bg-[#8a3d1c] text-white shadow-xs font-bold"
                      : "text-[#736e65] hover:text-[#121214]"
                  }`}
                >
                  Creator
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter("payer")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    activityFilter === "payer"
                      ? "bg-[#8a3d1c] text-white shadow-xs font-bold"
                      : "text-[#736e65] hover:text-[#121214]"
                  }`}
                >
                  Payer
                </button>
              </div>
            </div>

            {/* List Container Card */}
            <div className="bg-white rounded-3xl border border-[#dfd7c8] divide-y divide-[#f2ebd9] shadow-sm overflow-hidden">
              {filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="py-4 px-6 sm:px-7 flex items-center justify-between gap-4 hover:bg-[#faf7f0]/60 transition-colors"
                >
                  {/* Left: Icon & Description */}
                  <div className="flex items-center gap-4">
                    {/* Activity Icon Box */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        act.type === "payment_received"
                          ? "bg-[#eefaf2] border-[#c6f0d4] text-[#15803d]"
                          : act.type === "split_created"
                          ? "bg-[#fef8ea] border-[#fde8b3] text-[#b45309]"
                          : "bg-[#f0f9f4] border-[#cbece0] text-[#167d4f]"
                      }`}
                    >
                      {act.type === "payment_received" ? (
                        /* Incoming Payment Arrow */
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4.5 h-4.5 text-[#15803d]"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
                          />
                        </svg>
                      ) : act.type === "split_created" ? (
                        /* Document / Receipt Icon */
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                          stroke="currentColor"
                          className="w-4.5 h-4.5 text-[#b45309]"
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
                          strokeWidth={2.2}
                          stroke="currentColor"
                          className="w-4.5 h-4.5 text-[#167d4f]"
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
                      <h4 className="text-sm sm:text-base font-bold text-[#121214] leading-snug">
                        {act.title}
                      </h4>
                      <p className="text-xs text-[#736e65] mt-0.5">
                        {act.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount or Status Badge matching screenshot */}
                  <div className="text-right shrink-0">
                    {act.amount ? (
                      <span
                        className={`font-serif-luxury text-2xl font-bold tracking-tight ${
                          act.amountType === "positive"
                            ? "text-[#8a3d1c]"
                            : "text-[#121214]"
                        }`}
                      >
                        {act.amount}
                      </span>
                    ) : act.statusBadge ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1 rounded-full bg-[#fdf6e6] border border-[#f5deaa] text-[#925413]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#b45309]" />
                        <span>{act.statusBadge}</span>
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
