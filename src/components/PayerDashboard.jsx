"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PayerDashboard({ initialUser = null }) {
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
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pending' | 'settled'
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'remaining_desc' | 'remaining_asc' | 'assigned_desc'
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Assigned Expenses Dataset matching the wireframe and PRD
  // Note: Remaining sum = 300.00 + 85.50 + 400.00 + 455.00 = $1,240.50 (exact wireframe match)
  // Pending count = 4 (exact wireframe match)
  const [expenses, setExpenses] = useState([
    {
      id: "exp_1",
      title: "Q3 Offsite Flights",
      creator: "Sarah Jenkins",
      creatorEmail: "sarah.j@example.com",
      assigned: 450.0,
      paidSoFar: 150.0,
      remaining: 300.0,
      dueDate: "Oct 24, 2026",
      category: "Travel & Flights",
      createdAt: "2026-09-01T10:00:00Z",
    },
    {
      id: "exp_2",
      title: "Client Dinner - Q2",
      creator: "Michael Chen",
      creatorEmail: "michael.c@example.com",
      assigned: 85.5,
      paidSoFar: 0.0,
      remaining: 85.5,
      dueDate: "Nov 02, 2026",
      category: "Food & Dining",
      createdAt: "2026-09-03T14:30:00Z",
    },
    {
      id: "exp_3",
      title: "Software Licenses - Annual",
      creator: "IT Dept",
      creatorEmail: "it.admin@example.com",
      assigned: 1200.0,
      paidSoFar: 800.0,
      remaining: 400.0,
      dueDate: "Nov 15, 2026",
      category: "Subscriptions",
      createdAt: "2026-08-28T09:15:00Z",
    },
    {
      id: "exp_4",
      title: "Team Retreat Lodging",
      creator: "Maya Patel",
      creatorEmail: "maya.p@example.com",
      assigned: 655.0,
      paidSoFar: 200.0,
      remaining: 455.0,
      dueDate: "Nov 20, 2026",
      category: "Accommodation",
      createdAt: "2026-08-25T11:00:00Z",
    },
  ]);

  // Payment Modal States (PRD Settle Contribution & Proof flow)
  const [activeExpenseForPayment, setActiveExpenseForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi"); // 'upi' | 'netbanking' | 'card' | 'cash'
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const fileInputRef = useRef(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Logout Handler
  const handleLogout = () => {
    router.push("/login");
  };

  // Derived Metrics
  const pendingPaymentsCount = useMemo(() => {
    return expenses.filter((e) => e.remaining > 0).length;
  }, [expenses]);

  const totalOutstandingAmount = useMemo(() => {
    const sum = expenses.reduce((acc, e) => acc + e.remaining, 0);
    return sum.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [expenses]);

  // Filtered & Sorted Expenses
  const displayedExpenses = useMemo(() => {
    let result = [...expenses];

    // Search filter (by title, creator, or category)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.creator.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === "pending") {
      result = result.filter((e) => e.remaining > 0);
    } else if (statusFilter === "settled") {
      result = result.filter((e) => e.remaining <= 0);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "remaining_desc") return b.remaining - a.remaining;
      if (sortBy === "remaining_asc") return a.remaining - b.remaining;
      if (sortBy === "assigned_desc") return b.assigned - a.assigned;
      // Default: newest first
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
  }, [expenses, searchQuery, statusFilter, sortBy]);

  // Open Payment Modal
  const handleOpenPayment = (expense) => {
    setActiveExpenseForPayment(expense);
    setPaymentAmount(expense.remaining.toFixed(2));
    setPaymentMethod("upi");
    setPaymentProofFile(null);
    setTransactionRef("");
    setPaymentNote("");
  };

  // Close Payment Modal
  const handleClosePayment = () => {
    setActiveExpenseForPayment(null);
    setIsSubmittingPayment(false);
  };

  // File Upload Handler for Proof
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProofFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        type: file.type,
      });
    }
  };

  // Submit Payment & Proof (Frontend State Update + PRD Contract Simulation)
  const handleSubmitPayment = (e) => {
    e.preventDefault();
    if (!activeExpenseForPayment) return;

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Please enter a valid payment amount.", "error");
      return;
    }

    if (amountNum > activeExpenseForPayment.remaining + 0.001) {
      showToast("Payment amount cannot exceed remaining balance.", "error");
      return;
    }

    setIsSubmittingPayment(true);

    setTimeout(() => {
      // Update local state
      setExpenses((prev) =>
        prev.map((exp) => {
          if (exp.id === activeExpenseForPayment.id) {
            const newPaid = exp.paidSoFar + amountNum;
            const newRemaining = Math.max(0, exp.assigned - newPaid);
            return {
              ...exp,
              paidSoFar: newPaid,
              remaining: newRemaining,
            };
          }
          return exp;
        })
      );

      setIsSubmittingPayment(false);
      showToast(
        `Successfully submitted $${amountNum.toFixed(2)} payment for ${
          activeExpenseForPayment.title
        }. Proof recorded!`,
        "success"
      );
      handleClosePayment();
    }, 600);
  };

  // User Initials
  const userInitials = useMemo(() => {
    if (!user?.fullName) return "AR";
    const parts = user.fullName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return user.fullName.slice(0, 2).toUpperCase();
  }, [user]);

  return (
    <div className="flex h-screen bg-[#faf8f5] text-[#121214] font-sans antialiased selection:bg-[#121214] selection:text-white overflow-hidden">
      {/* ───────────────────────────────────────────────────────────
          1. FIXED LEFT SIDEBAR (Consistent with Home & Creator)
         ─────────────────────────────────────────────────────────── */}
      <aside className="w-64 sm:w-72 bg-[#f4efe6] border-r border-[#ede4d4] flex flex-col justify-between p-6 sm:p-8 shrink-0 h-full overflow-y-auto">
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

            {/* Creator Dashboard */}
            <Link
              href="/creator"
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
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                  />
                </svg>
                <span>Creator Dashboard</span>
              </div>
            </Link>

            {/* Payer Dashboard (Active Link with right indicator bar) */}
            <div className="w-full flex items-center justify-between py-1.5 text-sm font-bold text-[#121214] transition-colors cursor-default">
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-[#121214]"
                >
                  <path
                    fillRule="evenodd"
                    d="M1.5 7.125c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 16.875v-9.75zM3.375 7.5a.375.375 0 00-.375.375v.75c0 .207.168.375.375.375h17.25a.375.375 0 00.375-.375v-.75a.375.375 0 00-.375-.375H3.375zm0 4.5a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h17.25a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375H3.375z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-bold">Payer Dashboard</span>
              </div>
              {/* Vertical Active Line */}
              <div className="w-[2px] h-6 bg-[#121214] -mr-6 sm:-mr-8" />
            </div>
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
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
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

            {/* Profile Avatar Ring */}
            <div
              className="w-10 h-10 rounded-full bg-[#121214] text-white flex items-center justify-center font-bold text-xs tracking-wider border-2 border-[#ded6c7] hover:border-[#121214] transition-colors cursor-pointer shadow-2xs"
              title={`${user?.fullName || "User"} (${user?.email || ""})`}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 px-6 sm:px-10 lg:px-12 pb-16 space-y-8 max-w-6xl w-full">
          {/* ── Title & Subtitle (Matching Wireframe) ── */}
          <div className="pt-2">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#121214] leading-tight mb-2">
              Payer Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-[#605c52] font-normal leading-relaxed max-w-xl">
              Manage and settle your assigned expenses.
            </p>
          </div>

          {/* ── Metric Cards Section (2 Wide Cards side by side) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* CARD 1: Pending Payments */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-[#dfd7c8] shadow-[0_10px_30px_-15px_rgba(40,30,15,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center gap-2.5 text-[#5e5a50] mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="w-4 h-4 text-[#736e65]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
                  />
                </svg>
                <span className="text-xs sm:text-sm font-semibold text-[#4e4a40]">
                  Pending Payments
                </span>
              </div>
              <div>
                <div className="font-serif-luxury text-4xl sm:text-5xl font-bold text-[#121214] tracking-tight">
                  {pendingPaymentsCount}
                </div>
                <div className="text-[11px] text-[#8a8477] font-medium mt-1">
                  {pendingPaymentsCount === 1
                    ? "1 expense awaiting settlement"
                    : `${pendingPaymentsCount} expenses awaiting settlement`}
                </div>
              </div>
            </div>

            {/* CARD 2: Total Outstanding Amount */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-[#dfd7c8] shadow-[0_10px_30px_-15px_rgba(40,30,15,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center gap-2.5 text-[#5e5a50] mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="w-4 h-4 text-[#736e65]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                  />
                </svg>
                <span className="text-xs sm:text-sm font-semibold text-[#4e4a40]">
                  Total Outstanding Amount
                </span>
              </div>
              <div>
                <div className="font-serif-luxury text-4xl sm:text-5xl font-bold text-[#8a3d1c] tracking-tight">
                  ${totalOutstandingAmount}
                </div>
                <div className="text-[11px] text-[#8a8477] font-medium mt-1">
                  Across {expenses.length} assigned group splits
                </div>
              </div>
            </div>
          </div>

          {/* ── Assigned Expenses Section Header & Controls ── */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#121214]">
                Assigned Expenses
              </h3>

              {/* Controls: Search, Sort, Filter */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Bar */}
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="w-3.5 h-3.5 text-[#8a8477] absolute left-3 top-1/2 -translate-y-1/2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search expenses..."
                    className="bg-white border border-[#dfd7c8] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#121214] placeholder-[#8a8477] focus:outline-none focus:border-[#121214] w-48 sm:w-60 shadow-2xs transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8a8477] hover:text-[#121214]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sort Button / Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSortDropdown(!showSortDropdown);
                      setShowFilterDropdown(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#dfd7c8] rounded-xl text-xs font-semibold text-[#4e4a40] hover:text-[#121214] hover:bg-[#faf7f0] shadow-2xs transition-all cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6.75h16.5M3.75 12h10.5m-10.5 5.25h6.75"
                      />
                    </svg>
                    <span>Sort</span>
                  </button>

                  {showSortDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-[#ded6c7] p-2 z-20 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy("newest");
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                          sortBy === "newest"
                            ? "bg-[#ede6d8] font-bold text-[#121214]"
                            : "text-[#5e5a50] hover:bg-[#faf7f0]"
                        }`}
                      >
                        Newest First
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy("remaining_desc");
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                          sortBy === "remaining_desc"
                            ? "bg-[#ede6d8] font-bold text-[#121214]"
                            : "text-[#5e5a50] hover:bg-[#faf7f0]"
                        }`}
                      >
                        Remaining: High to Low
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy("remaining_asc");
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                          sortBy === "remaining_asc"
                            ? "bg-[#ede6d8] font-bold text-[#121214]"
                            : "text-[#5e5a50] hover:bg-[#faf7f0]"
                        }`}
                      >
                        Remaining: Low to High
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy("assigned_desc");
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                          sortBy === "assigned_desc"
                            ? "bg-[#ede6d8] font-bold text-[#121214]"
                            : "text-[#5e5a50] hover:bg-[#faf7f0]"
                        }`}
                      >
                        Total Assigned
                      </button>
                    </div>
                  )}
                </div>

                {/* Filter Button / Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFilterDropdown(!showFilterDropdown);
                      setShowSortDropdown(false);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                      statusFilter !== "all"
                        ? "bg-[#121214] text-white border-[#121214]"
                        : "bg-white border-[#dfd7c8] text-[#4e4a40] hover:text-[#121214] hover:bg-[#faf7f0]"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                      />
                    </svg>
                    <span>
                      {statusFilter === "all"
                        ? "Filter"
                        : statusFilter === "pending"
                        ? "Pending"
                        : "Settled"}
                    </span>
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-lg border border-[#ded6c7] p-2 z-20 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("all");
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                          statusFilter === "all"
                            ? "bg-[#ede6d8] font-bold text-[#121214]"
                            : "text-[#5e5a50] hover:bg-[#faf7f0]"
                        }`}
                      >
                        All Expenses
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("pending");
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                          statusFilter === "pending"
                            ? "bg-[#ede6d8] font-bold text-[#121214]"
                            : "text-[#5e5a50] hover:bg-[#faf7f0]"
                        }`}
                      >
                        Pending Only
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("settled");
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                          statusFilter === "settled"
                            ? "bg-[#ede6d8] font-bold text-[#121214]"
                            : "text-[#5e5a50] hover:bg-[#faf7f0]"
                        }`}
                      >
                        Fully Settled
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Status Capsule Filter Tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-[#8a3d1c] text-white shadow-xs"
                    : "bg-white border border-[#dfd7c8] text-[#5e5a50] hover:text-[#121214]"
                }`}
              >
                All ({expenses.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "pending"
                    ? "bg-[#8a3d1c] text-white shadow-xs"
                    : "bg-white border border-[#dfd7c8] text-[#5e5a50] hover:text-[#121214]"
                }`}
              >
                Pending ({expenses.filter((e) => e.remaining > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("settled")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "settled"
                    ? "bg-[#8a3d1c] text-white shadow-xs"
                    : "bg-white border border-[#dfd7c8] text-[#5e5a50] hover:text-[#121214]"
                }`}
              >
                Settled ({expenses.filter((e) => e.remaining <= 0).length})
              </button>
            </div>
          </div>

          {/* ── Assigned Expenses Cards List (Matching Wireframe) ── */}
          <div className="space-y-4">
            {displayedExpenses.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#dfd7c8] shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-[#f4efe6] text-[#736e65] flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                  ✓
                </div>
                <h4 className="font-serif-luxury text-xl font-bold text-[#121214] mb-1">
                  No expenses found
                </h4>
                <p className="text-xs text-[#736e65] max-w-sm mx-auto">
                  {searchQuery
                    ? `No assigned expenses match "${searchQuery}".`
                    : "You currently have no expenses matching this filter."}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-4 px-4 py-2 text-xs font-bold text-[#8a3d1c] bg-[#faebe3] rounded-xl hover:bg-[#f6ddd2] transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              displayedExpenses.map((expense) => {
                const isFullyPaid = expense.remaining <= 0;
                const paidPercentage = Math.min(
                  100,
                  Math.round((expense.paidSoFar / expense.assigned) * 100)
                );

                return (
                  <div
                    key={expense.id}
                    className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 border border-[#dfd7c8] shadow-[0_10px_30px_-15px_rgba(40,30,15,0.03)] hover:shadow-[0_20px_45px_-15px_rgba(40,30,15,0.07)] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    {/* Left Column: Title, Creator, Category */}
                    <div className="min-w-[200px] sm:min-w-[240px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#f4efe6] text-[#605c52]">
                          {expense.category}
                        </span>
                        <span className="text-[11px] text-[#8a8477]">
                          • Due {expense.dueDate}
                        </span>
                      </div>
                      <h4 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#121214] tracking-tight leading-snug">
                        {expense.title}
                      </h4>
                      <p className="text-xs text-[#736e65] mt-1 font-medium">
                        Created by {expense.creator}
                      </p>
                    </div>

                    {/* Right Column: Metrics, Progress Bar, Action Button */}
                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 sm:gap-8 lg:gap-10">
                      {/* Assigned Amount */}
                      <div className="text-left md:text-right min-w-[70px]">
                        <span className="block text-[10px] uppercase font-semibold text-[#8a8477] tracking-wider mb-0.5">
                          Assigned
                        </span>
                        <span className="text-sm sm:text-base font-bold text-[#121214]">
                          ${expense.assigned.toFixed(2)}
                        </span>
                      </div>

                      {/* Paid So Far */}
                      <div className="text-left md:text-right min-w-[70px]">
                        <span className="block text-[10px] uppercase font-semibold text-[#8a8477] tracking-wider mb-0.5">
                          Paid So Far
                        </span>
                        <span className="text-sm sm:text-base font-bold text-[#121214]">
                          ${expense.paidSoFar.toFixed(2)}
                        </span>
                      </div>

                      {/* Remaining Amount */}
                      <div className="text-left md:text-right min-w-[70px]">
                        <span className="block text-[10px] uppercase font-semibold text-[#8a8477] tracking-wider mb-0.5">
                          Remaining
                        </span>
                        <span
                          className={`text-sm sm:text-base font-bold ${
                            isFullyPaid ? "text-[#15803d]" : "text-[#8a3d1c]"
                          }`}
                        >
                          ${expense.remaining.toFixed(2)}
                        </span>
                      </div>

                      {/* Progress Bar (Matching Wireframe: Solid dark pill fill) */}
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-20 sm:w-28 h-2 sm:h-2.5 bg-[#ebe5d8] rounded-full overflow-hidden relative"
                          title={`${paidPercentage}% Paid`}
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFullyPaid ? "bg-[#15803d]" : "bg-[#121214]"
                            }`}
                            style={{ width: `${paidPercentage}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-[#8a8477] w-8">
                          {paidPercentage}%
                        </span>
                      </div>

                      {/* Action Button: View & Pay */}
                      {isFullyPaid ? (
                        <div className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs font-bold shrink-0">
                          <span>✓</span>
                          <span>Settled</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenPayment(expense)}
                          className="bg-[#121214] hover:bg-black text-white text-xs sm:text-sm font-semibold px-5 sm:px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <span>View &amp; Pay</span>
                          <span className="text-xs">→</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* ───────────────────────────────────────────────────────────
          3. "VIEW & PAY" MODAL (PRD Settle Contribution & Proof)
         ─────────────────────────────────────────────────────────── */}
      {activeExpenseForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#ded6c7] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#ede4d4] pb-4 mb-6">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#faebe3] text-[#8a3d1c] mb-1">
                  Settle Contribution
                </span>
                <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#121214]">
                  {activeExpenseForPayment.title}
                </h3>
                <p className="text-xs text-[#736e65] mt-0.5">
                  Assigned by {activeExpenseForPayment.creator} (
                  {activeExpenseForPayment.creatorEmail})
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePayment}
                className="w-8 h-8 rounded-full bg-[#f4efe6] text-[#6c685f] hover:text-[#121214] hover:bg-[#ede6d8] flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-6">
              {/* Expense Balance Summary Pill */}
              <div className="bg-[#fcfaf7] border border-[#ede4d4] rounded-2xl p-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider font-semibold text-[#8a8477]">
                    Total Assigned
                  </span>
                  <span className="text-sm sm:text-base font-bold text-[#121214] mt-0.5 block">
                    ${activeExpenseForPayment.assigned.toFixed(2)}
                  </span>
                </div>
                <div className="border-x border-[#ede4d4]">
                  <span className="block text-[10px] uppercase tracking-wider font-semibold text-[#8a8477]">
                    Paid So Far
                  </span>
                  <span className="text-sm sm:text-base font-bold text-[#121214] mt-0.5 block">
                    ${activeExpenseForPayment.paidSoFar.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider font-semibold text-[#8a3d1c]">
                    Remaining Due
                  </span>
                  <span className="text-sm sm:text-base font-bold text-[#8a3d1c] mt-0.5 block">
                    ${activeExpenseForPayment.remaining.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Amount Input with Quick Preset Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#121214] uppercase tracking-wider">
                    Payment Amount ($)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentAmount(
                          activeExpenseForPayment.remaining.toFixed(2)
                        )
                      }
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#f4efe6] text-[#6c685f] hover:text-[#121214] hover:bg-[#ede6d8] transition-colors cursor-pointer"
                    >
                      Pay Full (${activeExpenseForPayment.remaining.toFixed(2)})
                    </button>
                    {activeExpenseForPayment.remaining > 20 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentAmount(
                            (activeExpenseForPayment.remaining / 2).toFixed(2)
                          )
                        }
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#f4efe6] text-[#6c685f] hover:text-[#121214] hover:bg-[#ede6d8] transition-colors cursor-pointer"
                      >
                        Pay Half ($
                        {(activeExpenseForPayment.remaining / 2).toFixed(2)})
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8a8477]">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={activeExpenseForPayment.remaining}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-base font-bold rounded-xl border border-[#ded6c7] focus:outline-none focus:border-[#121214] transition-all bg-white"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-[#121214] uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "upi", label: "UPI", desc: "GPay / PhonePe" },
                    { id: "netbanking", label: "Net Banking", desc: "IMPS / NEFT" },
                    { id: "card", label: "Debit Card", desc: "Visa / MC" },
                    { id: "cash", label: "Cash", desc: "Offline / Direct" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? "border-[#121214] bg-[#fcfaf7] shadow-xs"
                          : "border-[#ded6c7] hover:border-[#b5ac9d]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#121214]">
                          {m.label}
                        </span>
                        {paymentMethod === m.id && (
                          <span className="w-2 h-2 rounded-full bg-[#121214]" />
                        )}
                      </div>
                      <span className="text-[10px] text-[#8a8477] block">
                        {m.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Payment Proof (PRD Requirement) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#121214] uppercase tracking-wider">
                    Upload Payment Proof / Receipt
                  </label>
                  <span className="text-[10px] text-[#8a8477]">
                    PNG, JPG, PDF up to 5MB
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  className="hidden"
                />

                {paymentProofFile ? (
                  <div className="p-3.5 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">📄</span>
                      <div>
                        <span className="text-xs font-bold text-[#166534] block truncate max-w-[260px]">
                          {paymentProofFile.name}
                        </span>
                        <span className="text-[10px] text-[#15803d]">
                          {paymentProofFile.size} • Ready to upload
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentProofFile(null)}
                      className="text-xs text-[#dc2626] hover:underline font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#ded6c7] hover:border-[#121214] rounded-2xl p-5 text-center cursor-pointer transition-colors bg-[#fcfaf7]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6 text-[#8a8477] mx-auto mb-1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                    <span className="text-xs font-semibold text-[#121214] block">
                      Click to upload receipt or screenshot
                    </span>
                    <span className="text-[10px] text-[#8a8477] mt-0.5 block">
                      Recommended for fast verification by creator
                    </span>
                  </div>
                )}
              </div>

              {/* Reference ID and Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#8a8477] mb-1">
                    Transaction / UTR Ref # (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UPI/429103810"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded6c7] focus:outline-none focus:border-[#121214] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#8a8477] mb-1">
                    Note for Creator (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="e.g. Sent via GPay"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded6c7] focus:outline-none focus:border-[#121214] bg-white"
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ede4d4]">
                <button
                  type="button"
                  onClick={handleClosePayment}
                  className="px-4 py-2.5 text-xs font-bold text-[#6c685f] hover:text-[#121214] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-6 py-2.5 bg-[#121214] hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingPayment ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Payment &amp; Proof</span>
                      <span>🔒</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          4. TOAST NOTIFICATION
         ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 ${
              toast.type === "error"
                ? "bg-[#fef2f2] border-[#fecaca] text-[#991b1b]"
                : "bg-[#121214] border-[#27272a] text-white"
            }`}
          >
            <span>{toast.type === "error" ? "⚠" : "✓"}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
