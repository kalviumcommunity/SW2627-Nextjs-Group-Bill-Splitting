"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreatorDashboard({
  initialUser = null,
}) {
  const router = useRouter();

  // User State
  const [user, setUser] = useState(
    initialUser || {
      fullName: "Alex Rivera",
      email: "alex.rivera@example.com",
    }
  );

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'closed'
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'amount_desc' | 'progress'
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ── Create Split Menu States (matching wireframe) ──
  const [expenseTitle, setExpenseTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("150.00");
  const [people, setPeople] = useState([
    { id: "p_alex", name: "Alex M.", isYou: false, amount: "75.00" },
    { id: "p_sam", name: "Sam T.", isYou: false, amount: "75.00" },
  ]);
  const [newPersonInput, setNewPersonInput] = useState("");
  const [dueDate, setDueDate] = useState("Oct 24, 2026");
  const [dueTime, setDueTime] = useState("12:00 PM");

  // Assigned amounts sum & validation
  const assignedSum = useMemo(() => {
    return people.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  }, [people]);

  const totalNum = parseFloat(totalAmount) || 0;
  const amountsMatch = Math.abs(assignedSum - totalNum) < 0.01 && totalNum > 0;

  // Split equally helper
  const handleSplitEqually = () => {
    if (people.length === 0 || totalNum <= 0) return;
    const share = (totalNum / people.length).toFixed(2);
    setPeople(
      people.map((p) => ({
        ...p,
        amount: share,
      }))
    );
  };

  // Add person helper
  const handleAddPerson = () => {
    if (!newPersonInput.trim()) return;
    const name = newPersonInput.split("@")[0].trim();
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    setPeople([
      ...people,
      {
        id: `person_${Date.now()}`,
        name: formattedName,
        isYou: false,
        amount: "0.00",
      },
    ]);
    setNewPersonInput("");
  };

  // Remove person helper
  const handleRemovePerson = (id) => {
    setPeople(people.filter((p) => p.id !== id));
  };

  // Change individual person amount
  const handlePersonAmountChange = (id, newAmt) => {
    setPeople(
      people.map((p) => (p.id === id ? { ...p, amount: newAmt } : p))
    );
  };

  // Summary Metrics from Wireframe
  const metrics = {
    totalActiveSplits: "$12,450.00",
    totalActiveCount: 8,
    collectedAmount: "$8,200.00",
    collectedCount: 8,
    pendingAmount: "$4,250.00",
    pendingPayersCount: 12,
  };

  // Created Expenses Dataset matching the wireframe
  const [expenses, setExpenses] = useState([
    {
      id: "exp_1",
      title: "Bali Retreat 2024",
      status: "Active",
      dateLabel: "Created Oct 12",
      createdAt: "2024-10-12",
      totalAmount: 4000.0,
      collectedAmount: 3000.0,
      remainingAmount: 1000.0,
      progress: 75,
    },
    {
      id: "exp_2",
      title: "Michelin Star Dinner",
      status: "Active",
      dateLabel: "Created Nov 02",
      createdAt: "2024-11-02",
      totalAmount: 850.0,
      collectedAmount: 340.0,
      remainingAmount: 510.0,
      progress: 40,
    },
    {
      id: "exp_3",
      title: "Airbnb Lake Tahoe",
      status: "Closed",
      dateLabel: "Settled Sep 15",
      createdAt: "2024-09-15",
      totalAmount: 2400.0,
      collectedAmount: 2400.0,
      remainingAmount: 0.0,
      progress: 100,
    },
  ]);

  // Filtered and Sorted Expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        const matchesSearch = exp.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim());
        const matchesStatus =
          statusFilter === "all" ||
          exp.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "amount_desc") return b.totalAmount - a.totalAmount;
        if (sortBy === "progress") return b.progress - a.progress;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [expenses, searchQuery, statusFilter, sortBy]);

  const handleCreateSplitSubmit = (e) => {
    e.preventDefault();
    if (!amountsMatch || !expenseTitle.trim()) return;

    const youAmount = parseFloat(people.find((p) => p.isYou)?.amount || 0);
    const newEntry = {
      id: `exp_${Date.now()}`,
      title: expenseTitle,
      status: "Active",
      dateLabel: "Created Just now",
      createdAt: new Date().toISOString(),
      totalAmount: totalNum,
      collectedAmount: youAmount,
      remainingAmount: totalNum - youAmount,
      progress: Math.min(100, Math.round((youAmount / totalNum) * 100)),
    };

    setExpenses([newEntry, ...expenses]);
    setShowCreateModal(false);
  };

  const handleLogout = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      router.push("/login");
    } catch (err) {
      router.push("/login");
    }
  };

  const getUserInitials = (name) => {
    if (!name) return "AR";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const userInitials = getUserInitials(user?.fullName || "Alex Rivera");

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
            {/* Home */}
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-between py-1.5 text-sm font-medium text-[#6c685f] hover:text-[#121214] transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  className="w-4 h-4 text-[#6c685f]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12l8.954-8.955a1.126 1.126 0 011.592 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                  />
                </svg>
                <span>Home</span>
              </div>
            </Link>

            {/* Creator Dashboard (Active with right indicator bar) */}
            <Link
              href="/creator"
              className="w-full flex items-center justify-between py-1.5 text-sm font-bold text-[#121214] transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-[#121214]"
                >
                  <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                <span className="font-bold">Creator Dashboard</span>
              </div>
              {/* Vertical Active Line */}
              <div className="w-[2px] h-6 bg-[#121214] -mr-6 sm:-mr-8" />
            </Link>

            {/* Payer Dashboard */}
            <Link
              href="#payer"
              className="w-full flex items-center justify-between py-1.5 text-sm font-medium text-[#6c685f] hover:text-[#121214] transition-colors"
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
            </Link>
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
        {/* Top Header - No left 'Split' text, only right items */}
        <header className="w-full bg-transparent px-6 sm:px-10 lg:px-12 pt-4 pb-2 flex items-center justify-end">
          {/* Right Header: Notification Bell & Initials Profile Avatar */}
          <div className="flex items-center gap-3">
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

            <div
              className="w-10 h-10 rounded-full bg-[#121214] text-white flex items-center justify-center font-bold text-xs tracking-wider border-2 border-[#ded6c7] hover:border-[#121214] transition-colors cursor-pointer shadow-2xs"
              title={`${user?.fullName || "User"} (${user?.email || ""})`}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="flex-1 px-6 sm:px-10 lg:px-12 pb-12 space-y-8 max-w-5xl w-full">
          {/* Page Title & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#121214] leading-tight">
                Creator Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-[#605c52] font-normal leading-relaxed mt-1">
                Manage and track your active splits.
              </p>
            </div>

            {/* Create New Split Button - Rich Terracotta Accent (#8a3d1c) */}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-[#8a3d1c] hover:bg-[#733317] text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0"
            >
              <span className="flex items-center justify-center w-4 h-4 rounded-full border border-white/50 text-xs leading-none">
                +
              </span>
              <span>Create New Split</span>
            </button>
          </div>

          {/* ───────────────────────────────────────────────────────────
              METRIC CARDS (3-column layout matching wireframe)
             ─────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Card 1: TOTAL ACTIVE SPLITS */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#dfd7c8] shadow-[0_10px_30px_-15px_rgba(40,30,15,0.03)] hover:shadow-[0_20px_45px_-15px_rgba(40,30,15,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#8a8477] mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="w-4 h-4 text-[#8a8477]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold">
                    Total Active Splits
                  </span>
                </div>
                <div className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-tight text-[#121214]">
                  {metrics.totalActiveSplits}
                </div>
              </div>
              <p className="text-xs text-[#736e65] mt-4 font-normal">
                Across {metrics.totalActiveCount} active expenses
              </p>
            </div>

            {/* Card 2: COLLECTED */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#dfd7c8] shadow-[0_10px_30px_-15px_rgba(40,30,15,0.03)] hover:shadow-[0_20px_45px_-15px_rgba(40,30,15,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#8a8477] mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 text-[#8a3d1c]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold">
                    Collected
                  </span>
                </div>
                <div className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-tight text-[#8a3d1c]">
                  {metrics.collectedAmount}
                </div>
              </div>
              <p className="text-xs text-[#736e65] mt-4 font-normal">
                Across {metrics.collectedCount} active expenses
              </p>
            </div>

            {/* Card 3: PENDING */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#dfd7c8] shadow-[0_10px_30px_-15px_rgba(40,30,15,0.03)] hover:shadow-[0_20px_45px_-15px_rgba(40,30,15,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#8a8477] mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 text-[#8a8477]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold">
                    Pending
                  </span>
                </div>
                <div className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-tight text-[#121214]">
                  {metrics.pendingAmount}
                </div>
              </div>
              <p className="text-xs text-[#736e65] mt-4 font-normal">
                From {metrics.pendingPayersCount} payers
              </p>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────
              CREATED EXPENSES LIST SECTION
             ─────────────────────────────────────────────────────────── */}
          <div className="space-y-4 pt-2">
            {/* Header with Title and Search/Sort/Filter Tools */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-tight text-[#121214]">
                Created Expenses
              </h3>

              {/* Search, Sort, Filter Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search input with icon */}
                <div className="relative min-w-[220px] sm:min-w-[260px]">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#9a9386]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search expenses..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#dfd7c8] text-[#121214] placeholder-[#9a9386] focus:outline-none focus:ring-1 focus:ring-[#121214] focus:border-[#121214] transition-all shadow-2xs"
                  />
                </div>

                {/* Sort Button & Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSortDropdown(!showSortDropdown);
                      setShowFilterDropdown(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#6c685f] hover:text-[#121214] bg-white border border-[#dfd7c8] rounded-xl hover:bg-[#faf7f0] transition-all cursor-pointer shadow-2xs"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.75}
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 7.5h18M3 12h12m-12 4.5h6"
                      />
                    </svg>
                    <span>Sort</span>
                  </button>

                  {showSortDropdown && (
                    <div className="absolute right-0 mt-1.5 w-40 bg-white border border-[#dfd7c8] rounded-xl shadow-lg py-1.5 z-20 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy("newest");
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 hover:bg-[#f6f3eb] transition-colors ${
                          sortBy === "newest" ? "font-bold text-[#8a3d1c]" : "text-[#4e4a40]"
                        }`}
                      >
                        Newest First
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy("amount_desc");
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 hover:bg-[#f6f3eb] transition-colors ${
                          sortBy === "amount_desc" ? "font-bold text-[#8a3d1c]" : "text-[#4e4a40]"
                        }`}
                      >
                        Highest Amount
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy("progress");
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 hover:bg-[#f6f3eb] transition-colors ${
                          sortBy === "progress" ? "font-bold text-[#8a3d1c]" : "text-[#4e4a40]"
                        }`}
                      >
                        Progress %
                      </button>
                    </div>
                  )}
                </div>

                {/* Filter Button & Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFilterDropdown(!showFilterDropdown);
                      setShowSortDropdown(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#6c685f] hover:text-[#121214] bg-white border border-[#dfd7c8] rounded-xl hover:bg-[#faf7f0] transition-all cursor-pointer shadow-2xs"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.75}
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                      />
                    </svg>
                    <span>Filter</span>
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-1.5 w-36 bg-white border border-[#dfd7c8] rounded-xl shadow-lg py-1.5 z-20 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("all");
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 hover:bg-[#f6f3eb] transition-colors ${
                          statusFilter === "all" ? "font-bold text-[#8a3d1c]" : "text-[#4e4a40]"
                        }`}
                      >
                        All Splits
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("active");
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 hover:bg-[#f6f3eb] transition-colors ${
                          statusFilter === "active" ? "font-bold text-[#8a3d1c]" : "text-[#4e4a40]"
                        }`}
                      >
                        Active Only
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("closed");
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 hover:bg-[#f6f3eb] transition-colors ${
                          statusFilter === "closed" ? "font-bold text-[#8a3d1c]" : "text-[#4e4a40]"
                        }`}
                      >
                        Closed Only
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Expense Cards List */}
            <div className="space-y-4">
              {filteredExpenses.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-[#dfd7c8] text-center">
                  <p className="text-sm text-[#736e65]">No expenses found matching your filter.</p>
                </div>
              ) : (
                filteredExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 border border-[#dfd7c8] shadow-[0_6px_20px_-10px_rgba(40,30,15,0.03)] hover:shadow-[0_16px_35px_-12px_rgba(40,30,15,0.08)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      {/* Left: Title + Status Badge + Date */}
                      <div className="md:w-1/4 shrink-0">
                        <h4 className="font-bold text-base sm:text-lg text-[#121214] tracking-tight">
                          {exp.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                              exp.status === "Active"
                                ? "bg-[#7a3b1d] text-white"
                                : "bg-[#706c64] text-white"
                            }`}
                          >
                            {exp.status}
                          </span>
                          <span className="text-xs text-[#736e65]">
                            {exp.dateLabel}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Collection Progress with Bar */}
                      <div className="flex-1 md:px-6">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-[#736e65] font-medium">Collection Progress</span>
                          <span className="font-bold text-[#121214]">{exp.progress}%</span>
                        </div>

                        {/* Progress Track */}
                        <div className="w-full h-2 rounded-full bg-[#f0ebd9] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              exp.status === "Closed" ? "bg-[#706c64]" : "bg-[#121214]"
                            }`}
                            style={{ width: `${exp.progress}%` }}
                          />
                        </div>

                        {/* Progress Subtext */}
                        <div className="flex items-center justify-between text-[11px] text-[#736e65] mt-2">
                          <span>
                            ${exp.collectedAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })} collected
                          </span>
                          <span>
                            ${exp.remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })} remaining
                          </span>
                        </div>
                      </div>

                      {/* Right: Total Amount */}
                      <div className="text-left md:text-right md:w-1/4 shrink-0">
                        <div className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-tight text-[#121214]">
                          ${exp.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="block text-[10px] uppercase tracking-wider text-[#8a8477] font-semibold mt-0.5">
                          Total Amount
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ───────────────────────────────────────────────────────────
          MODAL: CREATE NEW SPLIT MENU (Matching Wireframe Image)
         ─────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-10 max-w-2xl w-full border border-[#dfd7c8] shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto relative my-auto">
            {/* Header: Large luxury title & Subtitle */}
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4">
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="Split Name"
                  className="font-serif-luxury text-3xl sm:text-5xl font-bold tracking-tight text-[#121214] placeholder-[#a8a193] bg-transparent border-b border-[#ded6c7] pb-1 w-full focus:outline-none focus:border-[#121214]"
                />
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-[#9a9386] hover:text-[#121214] text-2xl font-bold p-1 cursor-pointer shrink-0"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs sm:text-sm text-[#736e65] mt-2">
                Break down costs seamlessly.
              </p>
            </div>

            {/* Stepper Flow with Vertical Connector Line */}
            <form onSubmit={handleCreateSplitSubmit} className="space-y-6">
              <div className="relative pl-9 sm:pl-10 space-y-6">
                {/* Vertical Timeline Guide Line */}
                <div className="absolute left-[15px] sm:left-[17px] top-4 bottom-6 w-[2px] bg-[#e8dfcf]" />

                {/* ── STEP 1: People Card ── */}
                <div className="relative">
                  {/* Step Node Icon: Checkmark Circle */}
                  <div className="absolute -left-[35px] sm:-left-[38px] top-3 w-7 h-7 rounded-full bg-white border border-[#ded6c7] text-[#121214] flex items-center justify-center text-xs font-bold shadow-2xs z-10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      className="w-3.5 h-3.5 text-[#167d4f]"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>

                  <div className="bg-[#fbf9f4] rounded-2xl p-5 sm:p-6 border border-[#e8dfcf]">
                    <h4 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#121214] mb-3.5">
                      People
                    </h4>

                    {/* Participant Chips */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {people.map((person) => (
                        <div
                          key={person.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#ded6c7] shadow-2xs text-xs font-semibold text-[#121214]"
                        >
                          <div className="w-5 h-5 rounded-full bg-[#121214] text-white flex items-center justify-center text-[10px] font-bold">
                            {person.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{person.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePerson(person.id)}
                            className="text-[#9a9386] hover:text-[#e74c3c] font-bold text-sm ml-0.5 cursor-pointer leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add person input */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#8a8477] mb-1.5">
                        Add by email or username
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newPersonInput}
                          onChange={(e) => setNewPersonInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddPerson();
                            }
                          }}
                          placeholder="e.g., alex@example.com"
                          className="flex-1 bg-white border border-[#ded6c7] rounded-xl px-3.5 py-2 text-xs text-[#121214] placeholder-[#9a9386] focus:outline-none focus:border-[#121214]"
                        />
                        <button
                          type="button"
                          onClick={handleAddPerson}
                          className="bg-white hover:bg-[#faf7f0] border border-[#ded6c7] rounded-xl px-4 py-2 text-xs font-bold text-[#121214] cursor-pointer transition-colors shadow-2xs"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── STEP 2: Total Amount Card ── */}
                <div className="relative">
                  {/* Step Node Icon: Checkmark Circle */}
                  <div className="absolute -left-[35px] sm:-left-[38px] top-3 w-7 h-7 rounded-full bg-white border border-[#ded6c7] text-[#121214] flex items-center justify-center text-xs font-bold shadow-2xs z-10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      className="w-3.5 h-3.5 text-[#167d4f]"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>

                  <div className="bg-[#fbf9f4] rounded-2xl p-5 sm:p-6 border border-[#e8dfcf]">
                    <h4 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#121214] mb-2">
                      Total Amount
                    </h4>

                    <div className="flex items-baseline gap-2 py-2 border-b border-[#ded6c7]">
                      <span className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#121214]">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        placeholder="150.00"
                        className="font-serif-luxury text-4xl sm:text-5xl font-bold tracking-tight text-[#121214] bg-transparent focus:outline-none w-full"
                      />
                    </div>
                    <p className="text-xs text-[#8a8477] font-medium mt-2">
                      Paid by You
                    </p>
                  </div>
                </div>

                {/* ── STEP 3: Split Details Card ── */}
                <div className="relative">
                  {/* Step Node Icon: Active dark circle with 3 */}
                  <div className="absolute -left-[35px] sm:-left-[38px] top-3 w-7 h-7 rounded-full bg-[#121214] text-white flex items-center justify-center text-xs font-bold shadow-2xs z-10">
                    3
                  </div>

                  <div className="bg-[#fbf9f4] rounded-2xl p-5 sm:p-6 border border-[#e8dfcf]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#121214]">
                        Split Details
                      </h4>
                      <button
                        type="button"
                        onClick={handleSplitEqually}
                        className="text-xs font-bold text-[#121214] hover:text-[#8a3d1c] hover:underline cursor-pointer transition-colors"
                      >
                        Split Equally
                      </button>
                    </div>

                    {/* Participant split breakdown rows */}
                    <div className="space-y-3">
                      {people.map((person) => (
                        <div
                          key={person.id}
                          className="flex items-center justify-between gap-4 py-1"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#121214] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                              {person.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-[#121214]">
                              {person.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-sm text-[#736e65]">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={person.amount}
                              onChange={(e) =>
                                handlePersonAmountChange(person.id, e.target.value)
                              }
                              className={`w-24 text-right px-2 py-1 text-sm font-semibold rounded-lg bg-white border ${
                                !amountsMatch
                                  ? "border-[#e74c3c] text-[#c0392b]"
                                  : "border-[#ded6c7] text-[#121214]"
                              } focus:outline-none focus:border-[#121214]`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Amounts mismatch warning banner matching the wireframe */}
                    {!amountsMatch && (
                      <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-3.5 sm:p-4 mt-5 flex items-start gap-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                          />
                        </svg>
                        <div>
                          <h5 className="text-xs font-bold text-[#b91c1c]">
                            Amounts do not match total
                          </h5>
                          <p className="text-[11px] text-[#991b1b] mt-0.5 leading-relaxed">
                            The assigned amounts sum to ${assignedSum.toFixed(2)}, but the total is $
                            {totalNum.toFixed(2)}. Please adjust the split.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── STEP 4: Deadline Card ── */}
                <div className="relative">
                  {/* Step Node Icon: Outline circle with 4 */}
                  <div className="absolute -left-[35px] sm:-left-[38px] top-3 w-7 h-7 rounded-full bg-white border border-[#ded6c7] text-[#8a8477] flex items-center justify-center text-xs font-bold shadow-2xs z-10">
                    4
                  </div>

                  <div className="bg-[#fbf9f4] rounded-2xl p-5 sm:p-6 border border-[#e8dfcf]">
                    <h4 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#121214] mb-3.5">
                      Deadline
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#8a8477] mb-1.5">
                          Due Date
                        </label>
                        <input
                          type="text"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          placeholder="Select date (e.g., Oct 24, 2023)"
                          className="w-full bg-transparent border-b border-[#ded6c7] py-1.5 text-xs text-[#121214] placeholder-[#9a9386] focus:outline-none focus:border-[#121214]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#8a8477] mb-1.5">
                          Time
                        </label>
                        <input
                          type="text"
                          value={dueTime}
                          onChange={(e) => setDueTime(e.target.value)}
                          placeholder="12:00 PM"
                          className="w-full bg-transparent border-b border-[#ded6c7] py-1.5 text-xs text-[#121214] placeholder-[#9a9386] focus:outline-none focus:border-[#121214]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bottom Action Footer ── */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#ede4d4]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6c685f] hover:text-[#121214] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!amountsMatch || !expenseTitle.trim() || totalNum <= 0}
                  className={`inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm ${
                    amountsMatch && expenseTitle.trim() && totalNum > 0
                      ? "bg-[#121214] hover:bg-[#27272a] text-white cursor-pointer"
                      : "bg-[#e5dfd5] text-[#9a9386] cursor-not-allowed"
                  }`}
                >
                  <span>Create Split</span>
                  <span className="text-xs">🔒</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
