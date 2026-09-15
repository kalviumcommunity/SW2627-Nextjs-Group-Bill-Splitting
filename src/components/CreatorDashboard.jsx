"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreatorDashboard({ initialUser = null }) {
  const router = useRouter();
  const [isCreateSplitOpen, setIsCreateSplitOpen] = useState(false);

  // User State: loaded dynamically
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'closed'
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'amount_desc' | 'progress'
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // ── Create Split Form States ──
  const [expenseTitle, setExpenseTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [people, setPeople] = useState([]);
  const [newPersonInput, setNewPersonInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [createSuccessMessage, setCreateSuccessMessage] = useState("");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);

  // ── Deadline (simple datetime-local input) ──
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    // Format as YYYY-MM-DDTHH:MM for datetime-local
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  // ── Form Validation ──
  const [formErrors, setFormErrors] = useState({});

  // Created Expenses Dataset: starts empty, no stale dummy data
  const [expenses, setExpenses] = useState([]);

  // Fetch live user & creator data from backend
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [dashRes, expRes] = await Promise.allSettled([
          fetch("/api/dashboard", { credentials: "include" }),
          fetch("/api/expenses?role=creator", { credentials: "include" }),
        ]);

        if (dashRes.status === "fulfilled" && dashRes.value.status === 401) {
          router.push("/login");
          return;
        }

        if (dashRes.status === "fulfilled" && dashRes.value.ok) {
          const data = await dashRes.value.json();
          if (isMounted && data.success && data.user) {
            setUser(data.user);
          }
        }

        if (expRes.status === "fulfilled" && expRes.value.ok) {
          const expData = await expRes.value.json();
          if (isMounted && expData.success && Array.isArray(expData.expenses)) {
            setExpenses(expData.expenses);
          }
        }
      } catch (err) {
        console.warn("Could not load creator data:", err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Assigned amounts sum & validation
  const assignedSum = useMemo(() => {
    return people.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  }, [people]);

  const totalNum = parseFloat(totalAmount) || 0;
  const amountsMatch =
    people.length > 0 && Math.abs(assignedSum - totalNum) < 0.01;

  // Split equally helper
  const handleSplitEqually = () => {
    if (people.length === 0 || totalNum <= 0) return;
    const count = people.length;
    const share = (totalNum / count).toFixed(2);
    setPeople(
      people.map((p) => ({
        ...p,
        amount: share,
      }))
    );
  };

  // Add person helper (Verifies that user is already registered on CRED Split)
  const handleAddPerson = async () => {
    const trimmed = newPersonInput.trim().toLowerCase();
    if (!trimmed) return;

    // Strict email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (people.some((p) => p.email.toLowerCase() === trimmed)) {
      setEmailError("This email has already been added");
      return;
    }

    setEmailError("");
    setIsCheckingUser(true);

    try {
      const res = await fetch(`/api/users/check?email=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!data.exists) {
        setEmailError(`"${trimmed}" is not a registered user on CRED Split. Only registered users can be added.`);
        setIsCheckingUser(false);
        return;
      }

      const displayName = data.user?.name || trimmed.split("@")[0];

      setPeople([
        ...people,
        {
          id: data.user?.id || `person_${Date.now()}`,
          name: displayName,
          email: trimmed,
          amount: "0.00",
        },
      ]);
      setNewPersonInput("");
    } catch (err) {
      console.warn("Could not verify user:", err);
      setEmailError("Unable to verify user registration. Please try again.");
    } finally {
      setIsCheckingUser(false);
    }
  };

  // Review contribution helper (Approve or Reject member payment proof)
  const handleReviewContribution = async (contributionId, action) => {
    setReviewingId(contributionId);
    try {
      const res = await fetch("/api/contributions/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contributionId, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh expenses to get updated calculations from DB
        const expRes = await fetch("/api/expenses?role=creator", { credentials: "include" });
        if (expRes.ok) {
          const expData = await expRes.json();
          if (expData.success && Array.isArray(expData.expenses)) {
            setExpenses(expData.expenses);
            const updatedCurrent = expData.expenses.find((e) => e.id === selectedExpense?.id);
            if (updatedCurrent) {
              setSelectedExpense(updatedCurrent);
            }
          }
        }
      } else {
        alert(data.message || "Failed to process review");
      }
    } catch (err) {
      console.warn("Review contribution error:", err);
    } finally {
      setReviewingId(null);
    }
  };

  // Remove person helper
  const handleRemovePerson = (id) => {
    setPeople(people.filter((p) => p.id !== id));
  };

  // Change individual person amount (no spin buttons)
  const handlePersonAmountChange = (id, newAmt) => {
    // Only allow numbers and at most one decimal point
    const clean = newAmt.replace(/[^0-9.]/g, "");
    const parts = clean.split(".");
    if (parts.length > 2) return;

    setPeople(
      people.map((p) => (p.id === id ? { ...p, amount: clean } : p))
    );
  };

  // Dynamic Metrics computed from actual expenses (in Rupee ₹)
  const metrics = useMemo(() => {
    const now = new Date();
    const activeExpenses = expenses.filter((e) => {
      if (e.status === "Closed" || e.isClosed) return false;
      if (e.rawDeadline && new Date(e.rawDeadline) <= now) return false;
      return true;
    });
    const activeCount = activeExpenses.length;
    const totalActive = activeExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
    const collected = expenses.reduce((sum, e) => sum + e.collectedAmount, 0);
    const pending = activeExpenses.reduce((sum, e) => sum + e.remainingAmount, 0);

    return {
      totalActiveSplits: `₹${totalActive.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalActiveCount: activeCount,
      collectedAmount: `₹${collected.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      collectedCount: expenses.length,
      pendingAmount: `₹${pending.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      pendingPayersCount: activeExpenses.reduce((sum, e) => sum + (e.memberCount || 0), 0),
    };
  }, [expenses]);

  // Filtered and Sorted Expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses
      .map((exp) => {
        const isClosed =
          exp.status === "Closed" ||
          exp.isClosed ||
          (exp.rawDeadline && new Date(exp.rawDeadline) <= now);
        return {
          ...exp,
          status: isClosed ? "Closed" : "Active",
          isClosed,
        };
      })
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

  // ── Validate Form ──
  const validateForm = () => {
    const errors = {};
    if (!expenseTitle.trim()) errors.title = "Split name is required.";
    if (!totalAmount || totalNum <= 0) errors.amount = "Total amount must be greater than ₹0.";
    if (people.length === 0) errors.people = "Add at least one member.";
    if (people.length > 0 && !amountsMatch) errors.match = "Member shares must equal the total amount.";
    if (!deadline) {
      errors.deadline = "Deadline is required.";
    } else if (new Date(deadline) <= new Date()) {
      errors.deadline = "Deadline must be in the future.";
    }
    return errors;
  };

  // Handle Form Submission
  const handleCreateSplitSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const deadlineDate = new Date(deadline);
    const formattedDeadline = deadlineDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " at " + deadlineDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const localEntry = {
      id: `exp_${Date.now()}`,
      title: expenseTitle.trim(),
      status: "Active",
      dateLabel: `Due ${deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      createdAt: new Date().toISOString(),
      deadline: formattedDeadline,
      totalAmount: totalNum,
      collectedAmount: 0.0,
      remainingAmount: totalNum,
      progress: 0,
      memberCount: people.length,
      members: people.map((p) => ({
        name: p.name,
        email: p.email,
        amount: parseFloat(p.amount) || 0,
        paidAmount: 0,
      })),
    };

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: expenseTitle.trim(),
          totalAmount: totalNum,
          deadline,
          members: people.map((p) => ({
            name: p.name,
            email: p.email,
            amount: parseFloat(p.amount) || 0,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormErrors({ server: data.message || "Failed to create split. Please verify all members are registered." });
        return;
      }

      if (data.expense) {
        setExpenses((prev) => [data.expense, ...prev.filter((x) => x.id !== data.expense.id)]);
      }
    } catch (err) {
      console.warn("Could not save split to backend:", err);
      setFormErrors({ server: "Network error creating split. Please try again." });
      return;
    }

    setCreateSuccessMessage(`Split "${expenseTitle}" created successfully!`);
    setIsCreateSplitOpen(false);

    // Reset form
    setExpenseTitle("");
    setTotalAmount("");
    setPeople([]);
    setNewPersonInput("");
    setFormErrors({});
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const pad = (n) => String(n).padStart(2, "0");
    setDeadline(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);

    setTimeout(() => {
      setCreateSuccessMessage("");
    }, 4000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      // ignore
    } finally {
      router.push("/login");
    }
  };

  const getUserInitials = (name) => {
    if (!name || !name.trim()) return "•";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const userInitials = getUserInitials(user?.fullName || user?.name || "");

  // Minimum datetime value for deadline input (current moment)
  const minDeadline = useMemo(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }, []);

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
              href="/payer"
              className="w-full flex items-center justify-between py-1.5 text-sm font-medium text-[#6c685f] hover:text-[#121214] transition-colors cursor-pointer"
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
        {/* Top Header */}
        <header className="w-full bg-transparent px-6 sm:px-10 lg:px-12 pt-4 pb-2 flex items-center justify-end">
          <div className="flex items-center gap-3">
            {/* Profile Avatar with Border & Dynamic Initials */}
            <div
              className="w-10 h-10 rounded-full bg-[#121214] text-white flex items-center justify-center font-bold text-xs tracking-wider border-2 border-[#ded6c7] hover:border-[#121214] transition-colors cursor-pointer shadow-2xs"
              title={`${user?.fullName || "User"} (${user?.email || ""})`}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="flex-1 px-6 sm:px-10 lg:px-12 pb-16 space-y-8 max-w-5xl w-full">
          {/* Page Title & Smooth Scroll Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#121214] leading-tight">
                Creator Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-[#605c52] font-normal leading-relaxed mt-1">
                Manage and track your active splits with clarity.
              </p>
            </div>

            {/* Create New Split Button: Opens popup modal screen */}
            <button
              type="button"
              onClick={() => setIsCreateSplitOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-[#8a3d1c] hover:bg-[#733317] text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0"
            >
              <span className="flex items-center justify-center w-4 h-4 rounded-full border border-white/50 text-xs leading-none">
                +
              </span>
              <span>Create New Split</span>
            </button>
          </div>

          {/* Feedback Banner upon Creation */}
          {createSuccessMessage && (
            <div className="p-4 rounded-2xl bg-[#f2faf4] border border-[#bbf7d0] text-[#14532d] text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-in fade-in">
              <span className="text-sm">✓</span>
              <span>{createSuccessMessage}</span>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────
              METRIC CARDS (3-column layout with Rupee ₹)
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
                  {isLoading ? "—" : metrics.totalActiveSplits}
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
                  {isLoading ? "—" : metrics.collectedAmount}
                </div>
              </div>
              <p className="text-xs text-[#736e65] mt-4 font-normal">
                Across {metrics.collectedCount} expenses
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
                  {isLoading ? "—" : metrics.pendingAmount}
                </div>
              </div>
              <p className="text-xs text-[#736e65] mt-4 font-normal">
                From {metrics.pendingPayersCount} assigned members
              </p>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────
              CREATED EXPENSES LIST SECTION
             ─────────────────────────────────────────────────────────── */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-tight text-[#121214]">
                Created Expenses
              </h3>

              {/* Search, Sort, Filter Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
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

                {/* Sort Dropdown */}
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5h18M3 12h12m-12 4.5h6" />
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

                {/* Filter Dropdown */}
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

            {/* Expense Cards List / Placeholder Message */}
            <div className="space-y-4">
              {expenses.length === 0 ? (
                /* Primary Empty State */
                <div className="bg-white rounded-3xl p-10 sm:p-12 border border-[#dfd7c8] text-center shadow-xs">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#f5ede2] border border-[#e5d8c3] flex items-center justify-center text-[#8a3d1c]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-7 h-7"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-serif-luxury text-2xl font-bold text-[#121214] mb-2">
                    No Created Expenses Yet
                  </h4>
                  <p className="text-xs sm:text-sm text-[#736e65] max-w-md mx-auto leading-relaxed mb-6">
                    You haven&apos;t created any group splits yet. Use the Create New Split section below to set up a bill, add members by email, and track incoming payments in real time.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreateSplitOpen(true)}
                    className="inline-flex items-center gap-2 bg-[#8a3d1c] hover:bg-[#733317] text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider"
                  >
                    <span>+ Create First Split</span>
                  </button>
                </div>
              ) : filteredExpenses.length === 0 ? (
                /* Filter Empty State */
                <div className="bg-white rounded-3xl p-10 border border-[#dfd7c8] text-center shadow-xs">
                  <p className="text-sm font-medium text-[#736e65]">
                    No expenses found matching &quot;{searchQuery}&quot;.
                  </p>
                </div>
              ) : (
                filteredExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    onClick={() => setSelectedExpense(exp)}
                    className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 border border-[#dfd7c8] shadow-[0_6px_20px_-10px_rgba(40,30,15,0.03)] hover:shadow-[0_16px_35px_-12px_rgba(40,30,15,0.08)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      {/* Left: Title + Status + Date */}
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

                      {/* Middle: Progress */}
                      <div className="flex-1 md:px-6">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-[#736e65] font-medium">Collection Progress</span>
                          <span className="font-bold text-[#121214]">{exp.progress}%</span>
                        </div>

                        <div className="w-full h-2 rounded-full bg-[#f0ebd9] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              exp.status === "Closed" ? "bg-[#706c64]" : "bg-[#121214]"
                            }`}
                            style={{ width: `${exp.progress}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#736e65] mt-2">
                          <span>
                            ₹{exp.collectedAmount.toLocaleString("en-IN", { minimumFractionDigits: 0 })} collected
                          </span>
                          <span>
                            ₹{exp.remainingAmount.toLocaleString("en-IN", { minimumFractionDigits: 0 })} remaining
                          </span>
                        </div>
                      </div>

                      {/* Right: Total in Rupee ₹ */}
                      <div className="text-left md:text-right md:w-1/4 shrink-0">
                        <div className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-tight text-[#121214]">
                          ₹{exp.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

          {/* ───────────────────────────────────────────────────────────
              SPLIT DETAIL VIEW (Shown when an expense card is clicked)
             ─────────────────────────────────────────────────────────── */}
          {selectedExpense && (
            <div className="fixed inset-0 z-50 bg-[#f8f5ee] overflow-y-auto">
              <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-12 py-8">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setSelectedExpense(null)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#6c685f] hover:text-[#121214] transition-colors cursor-pointer mb-6 group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  <span>Back to Dashboard</span>
                </button>

                {/* Split Header */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dfd7c8] shadow-xs mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                            selectedExpense.status === "Active"
                              ? "bg-[#7a3b1d] text-white"
                              : "bg-[#706c64] text-white"
                          }`}
                        >
                          {selectedExpense.status}
                        </span>
                        <span className="text-xs text-[#736e65]">
                          {selectedExpense.dateLabel}
                        </span>
                      </div>
                      <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-tight text-[#121214] leading-tight">
                        {selectedExpense.title}
                      </h2>
                      {selectedExpense.deadline && (
                        <p className="text-xs text-[#736e65] mt-1.5 font-medium">
                          📅 Deadline: {selectedExpense.deadline}
                        </p>
                      )}
                      <p className="text-xs text-[#8a8477] mt-1">
                        Created {new Date(selectedExpense.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <div className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-tight text-[#121214]">
                        ₹{selectedExpense.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-[#8a8477] font-semibold">
                        Total Amount
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6 pt-5 border-t border-[#eee7da]">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-[#736e65] font-medium">Collection Progress</span>
                      <span className="font-bold text-[#121214]">{selectedExpense.progress}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#f0ebd9] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          selectedExpense.status === "Closed" ? "bg-[#706c64]" : "bg-[#121214]"
                        }`}
                        style={{ width: `${selectedExpense.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Summary Metrics Row */}
                  <div className="grid grid-cols-3 gap-4 mt-5">
                    <div className="bg-[#fbf9f4] rounded-xl p-4 border border-[#e8dfcf] text-center">
                      <span className="block text-[10px] uppercase tracking-wider font-semibold text-[#8a8477] mb-1">
                        Collected
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-[#15803d]">
                        ₹{selectedExpense.collectedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-[#fbf9f4] rounded-xl p-4 border border-[#e8dfcf] text-center">
                      <span className="block text-[10px] uppercase tracking-wider font-semibold text-[#8a8477] mb-1">
                        Remaining
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-[#8a3d1c]">
                        ₹{selectedExpense.remainingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-[#fbf9f4] rounded-xl p-4 border border-[#e8dfcf] text-center">
                      <span className="block text-[10px] uppercase tracking-wider font-semibold text-[#8a8477] mb-1">
                        Members
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-[#121214]">
                        {selectedExpense.members?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Members Contribution Table */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dfd7c8] shadow-xs">
                  <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-tight text-[#121214] mb-1">
                    Member Contributions
                  </h3>
                  <p className="text-xs text-[#736e65] mb-6">
                    Track each member&apos;s assigned share and payment status.
                  </p>

                  {!selectedExpense.members || selectedExpense.members.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-[#736e65]">No members assigned to this split.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Table Header */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-[#8a8477]">
                        <div className="col-span-4">Member</div>
                        <div className="col-span-2 text-right">Assigned</div>
                        <div className="col-span-2 text-right">Paid</div>
                        <div className="col-span-2 text-right">Remaining</div>
                        <div className="col-span-2 text-right">Status</div>
                      </div>

                      {/* Member Rows */}
                      {selectedExpense.members.map((member, idx) => {
                        const assignedAmt = member.amount || 0;
                        const paidAmt = member.paidAmount || 0;
                        const memberRemaining = Math.max(0, assignedAmt - paidAmt);
                        const memberProgress = assignedAmt > 0 ? Math.min(100, Math.round((paidAmt / assignedAmt) * 100)) : 0;

                        let statusLabel = "Pending";
                        let statusColor = "bg-[#fef3c7] text-[#92400e]";
                        if (memberRemaining <= 0 && assignedAmt > 0) {
                          statusLabel = "Settled";
                          statusColor = "bg-[#dcfce7] text-[#166534]";
                        } else if (paidAmt > 0) {
                          statusLabel = "Partial";
                          statusColor = "bg-[#dbeafe] text-[#1e40af]";
                        }

                        return (
                          <div
                            key={idx}
                            className="bg-[#fbf9f4] rounded-2xl p-4 sm:p-5 border border-[#e8dfcf] hover:border-[#ded6c7] transition-colors"
                          >
                            <div className="sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center">
                              {/* Member Identity */}
                              <div className="col-span-4 flex items-center gap-3 mb-3 sm:mb-0">
                                <div className="w-9 h-9 rounded-full bg-[#121214] text-white flex items-center justify-center text-xs font-bold shadow-2xs shrink-0">
                                  {member.email ? member.email.slice(0, 2).toUpperCase() : member.name?.slice(0, 2).toUpperCase() || "??"}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-sm font-semibold text-[#121214] block truncate">
                                    {member.name}
                                  </span>
                                  <span className="text-[11px] text-[#736e65] block truncate">
                                    {member.email}
                                  </span>
                                </div>
                              </div>

                              {/* Assigned */}
                              <div className="col-span-2 text-right mb-2 sm:mb-0">
                                <span className="sm:hidden text-[10px] uppercase tracking-wider font-semibold text-[#8a8477] mr-2">Assigned: </span>
                                <span className="text-sm font-bold text-[#121214]">
                                  ₹{assignedAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>

                              {/* Paid */}
                              <div className="col-span-2 text-right mb-2 sm:mb-0">
                                <span className="sm:hidden text-[10px] uppercase tracking-wider font-semibold text-[#8a8477] mr-2">Paid: </span>
                                <span className="text-sm font-bold text-[#15803d]">
                                  ₹{paidAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>

                              {/* Remaining */}
                              <div className="col-span-2 text-right mb-2 sm:mb-0">
                                <span className="sm:hidden text-[10px] uppercase tracking-wider font-semibold text-[#8a8477] mr-2">Remaining: </span>
                                <span className={`text-sm font-bold ${memberRemaining > 0 ? "text-[#8a3d1c]" : "text-[#15803d]"}`}>
                                  ₹{memberRemaining.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>

                              {/* Status Badge */}
                              <div className="col-span-2 text-right">
                                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${statusColor}`}>
                                  {statusLabel}
                                </span>
                              </div>
                            </div>

                            {/* Mini Progress Bar */}
                            <div className="mt-3 flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-[#f0ebd9] overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    memberRemaining <= 0 ? "bg-[#15803d]" : paidAmt > 0 ? "bg-[#3b82f6]" : "bg-[#d4a574]"
                                  }`}
                                  style={{ width: `${memberProgress}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-[#8a8477] w-8 text-right">
                                {memberProgress}%
                              </span>
                            </div>

                            {/* Submitted Payment Proofs & Review Actions for Creator */}
                            {member.contributions && member.contributions.length > 0 && (
                              <div className="mt-4 pt-3.5 border-t border-[#eee7da] space-y-2.5">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-[#8a8477] block">
                                  Payment Submissions &amp; Proofs:
                                </span>
                                {member.contributions.map((c) => (
                                  <div
                                    key={c.id}
                                    className="bg-white rounded-xl p-3 sm:p-3.5 border border-[#ded6c7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                                  >
                                    <div className="flex items-start sm:items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-[#faf7f0] border border-[#e8dfcf] flex items-center justify-center text-sm shrink-0">
                                        📄
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-[#121214]">
                                            ₹{c.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                          </span>
                                          <span
                                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                              c.status === "ACCEPTED"
                                                ? "bg-[#dcfce7] text-[#166534]"
                                                : c.status === "REJECTED"
                                                ? "bg-[#fee2e2] text-[#991b1b]"
                                                : "bg-[#fef3c7] text-[#92400e]"
                                            }`}
                                          >
                                            {c.status === "ACCEPTED"
                                              ? "Approved"
                                              : c.status === "REJECTED"
                                              ? "Rejected"
                                              : "Pending Approval"}
                                          </span>
                                        </div>

                                        {c.paymentProof && (
                                          <button
                                            type="button"
                                            onClick={() => setPreviewDoc(c.paymentProof)}
                                            className="text-[11px] font-semibold text-[#8a3d1c] hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                                          >
                                            <span>View Uploaded Document ({c.paymentProof.fileName})</span>
                                            <span>↗</span>
                                          </button>
                                        )}

                                        {c.rejectionReason && (
                                          <span className="text-[10px] text-[#8a8477] block mt-0.5">
                                            {c.rejectionReason}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action Buttons: Only shown if Pending Approval */}
                                    {c.status === "PENDING" && (
                                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                        <button
                                          type="button"
                                          disabled={reviewingId === c.id}
                                          onClick={() => handleReviewContribution(c.id, "APPROVE")}
                                          className="px-3.5 py-1.5 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                        >
                                          <span>✓</span>
                                          <span>Approve</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={reviewingId === c.id}
                                          onClick={() => handleReviewContribution(c.id, "REJECT")}
                                          className="px-3.5 py-1.5 rounded-lg bg-white border border-[#dc2626] text-[#dc2626] hover:bg-[#fef2f2] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                        >
                                          <span>✕</span>
                                          <span>Reject</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Document Preview Modal */}
              {previewDoc && (
                <div
                  className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in"
                  onClick={() => setPreviewDoc(null)}
                >
                  <div
                    className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#ded6c7] max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-[#ede4d4] pb-3 mb-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8a8477]">Uploaded Payment Proof</span>
                        <h4 className="font-bold text-base text-[#121214] truncate max-w-md">
                          {previewDoc.fileName}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(null)}
                        className="w-8 h-8 rounded-full bg-[#f4efe6] text-[#6c685f] hover:text-[#121214] flex items-center justify-center font-bold text-sm cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto flex items-center justify-center p-2 bg-[#faf8f4] rounded-2xl border border-[#eee7da]">
                      {previewDoc.fileUrl?.match(/\.(jpeg|jpg|png|webp|gif|svg)$/i) ? (
                        <img
                          src={previewDoc.fileUrl}
                          alt={previewDoc.fileName}
                          className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
                        />
                      ) : (
                        <iframe
                          src={previewDoc.fileUrl}
                          title={previewDoc.fileName}
                          className="w-full h-[60vh] rounded-lg"
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#ede4d4]">
                      <a
                        href={previewDoc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#8a3d1c] hover:underline flex items-center gap-1"
                      >
                        <span>Open original in new tab</span>
                        <span>↗</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(null)}
                        className="px-5 py-2 rounded-xl bg-[#121214] text-white text-xs font-bold cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────
              CREATE NEW SPLIT POPUP MODAL SCREEN
             ─────────────────────────────────────────────────────────── */}
          {isCreateSplitOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in"
              onClick={() => {
                setIsCreateSplitOpen(false);
                setFormErrors({});
              }}
            >
              <div
                className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-10 shadow-2xl border border-[#dfd7c8] my-auto max-h-[92vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-[#ded6c7] pb-4 mb-6 shrink-0">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8a8477] tracking-wider block">
                      New Split
                    </span>
                    <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-tight text-[#121214]">
                      Create Group Split
                    </h3>
                    <p className="text-xs text-[#736e65] mt-1">
                      Set up the split details, add members, and allocate shares.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateSplitOpen(false);
                      setFormErrors({});
                    }}
                    className="w-9 h-9 rounded-full bg-[#f4efe6] text-[#6c685f] hover:text-[#121214] hover:bg-[#e9e1d1] flex items-center justify-center font-bold text-base cursor-pointer transition-colors shrink-0 ml-4"
                  >
                    ✕
                  </button>
                </div>

                {/* Stepper Form with Scrollable Content */}
                <form onSubmit={handleCreateSplitSubmit} className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-6">
                  {/* Split Title Input */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#8a8477] mb-1.5">
                      Split Name / Title
                    </label>
                    <input
                      type="text"
                      value={expenseTitle}
                      onChange={(e) => {
                        setExpenseTitle(e.target.value);
                        if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: undefined }));
                      }}
                      placeholder="Enter Split Name (e.g., Goa Trip, Weekend Dinner, Rent)"
                      className="w-full bg-[#faf7f0] border border-[#ded6c7] rounded-xl px-4 py-3 text-base font-semibold text-[#121214] placeholder-[#9a9386] focus:outline-none focus:border-[#121214] focus:bg-white transition-all shadow-2xs"
                    />
                    {formErrors.title && (
                      <p className="text-[11px] text-[#d9383a] font-medium mt-1.5 flex items-center gap-1">
                        <span>⚠</span> {formErrors.title}
                      </p>
                    )}
                  </div>

                  <div className="relative pl-9 sm:pl-10 space-y-6">
                    {/* Vertical Timeline Guide Line */}
                    <div className="absolute left-[15px] sm:left-[17px] top-4 bottom-6 w-[2px] bg-[#e8dfcf]" />

                    {/* ── STEP 1: People Card (Add by email only) ── */}
                    <div className="relative">
                      <div className="absolute -left-[35px] sm:-left-[38px] top-3 w-7 h-7 rounded-full bg-white border border-[#ded6c7] text-[#121214] flex items-center justify-center text-xs font-bold shadow-2xs z-10">
                        1
                      </div>

                      <div className="bg-[#fbf9f4] rounded-2xl p-5 sm:p-6 border border-[#e8dfcf]">
                        <h4 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#121214] mb-1">
                          People
                        </h4>
                        <p className="text-xs text-[#736e65] mb-3.5">
                          Add members to this split using their registered email address.
                        </p>

                        {/* Participant Chips */}
                        {people.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            {people.map((person) => (
                              <div
                                key={person.id}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#ded6c7] shadow-2xs text-xs font-semibold text-[#121214]"
                              >
                                <div className="w-5 h-5 rounded-full bg-[#121214] text-white flex items-center justify-center text-[10px] font-bold">
                                  {person.email.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-medium text-[#4e4a40]">{person.email}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePerson(person.id)}
                                  className="text-[#9a9386] hover:text-[#e74c3c] font-bold text-sm ml-1 cursor-pointer leading-none"
                                  title="Remove participant"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add person input (EMAIL ONLY) */}
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#8a8477] mb-1.5">
                            Add by email
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="email"
                              value={newPersonInput}
                              onChange={(e) => {
                                setNewPersonInput(e.target.value);
                                if (emailError) setEmailError("");
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddPerson();
                                }
                              }}
                              placeholder="name@example.com"
                              className="flex-1 bg-white border border-[#ded6c7] rounded-xl px-3.5 py-2.5 text-xs text-[#121214] placeholder-[#9a9386] focus:outline-none focus:border-[#121214]"
                            />
                            <button
                              type="button"
                              disabled={isCheckingUser}
                              onClick={handleAddPerson}
                              className="bg-white hover:bg-[#faf7f0] border border-[#ded6c7] rounded-xl px-4 py-2.5 text-xs font-bold text-[#121214] cursor-pointer transition-colors shadow-2xs shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isCheckingUser ? "Verifying..." : "+ Add Person"}
                            </button>
                          </div>
                          {emailError && (
                            <p className="text-[11px] text-[#d9383a] font-medium mt-1.5 flex items-center gap-1">
                              <span>⚠</span> {emailError}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── STEP 2: Total Amount Card (Rupee ₹ and no spin arrows) ── */}
                    <div className="relative">
                      <div className="absolute -left-[35px] sm:-left-[38px] top-3 w-7 h-7 rounded-full bg-white border border-[#ded6c7] text-[#121214] flex items-center justify-center text-xs font-bold shadow-2xs z-10">
                        2
                      </div>

                      <div className="bg-[#fbf9f4] rounded-2xl p-5 sm:p-6 border border-[#e8dfcf]">
                        <h4 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#121214] mb-2">
                          Total Amount
                        </h4>

                        <div className="flex items-baseline gap-2 py-2 border-b border-[#ded6c7]">
                          <span className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#121214]">
                            ₹
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={totalAmount}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, "");
                              const parts = val.split(".");
                              if (parts.length > 2) return;
                              setTotalAmount(val);
                            }}
                            placeholder="0.00"
                            className="font-serif-luxury text-4xl sm:text-5xl font-bold tracking-tight text-[#121214] bg-transparent focus:outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <p className="text-xs text-[#8a8477] font-medium mt-2">
                          Total expense amount paid by you as creator
                        </p>
                      </div>
                    </div>

                    {/* ── STEP 3: Split Details Card (Rupee ₹ and no spin arrows) ── */}
                    <div className="relative">
                      <div className="absolute -left-[35px] sm:-left-[38px] top-3 w-7 h-7 rounded-full bg-[#121214] text-white flex items-center justify-center text-xs font-bold shadow-2xs z-10">
                        3
                      </div>

                      <div className="bg-[#fbf9f4] rounded-2xl p-5 sm:p-6 border border-[#e8dfcf]">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#121214]">
                              Split Details
                            </h4>
                            <p className="text-xs text-[#736e65] mt-0.5">
                              Allocate individual contributions among members.
                            </p>
                          </div>
                          {people.length > 0 && (
                            <button
                              type="button"
                              onClick={handleSplitEqually}
                              className="text-xs font-bold text-[#8a3d1c] hover:underline cursor-pointer transition-colors bg-white border border-[#dfd7c8] px-3 py-1.5 rounded-lg shadow-2xs shrink-0"
                            >
                              Split Equally
                            </button>
                          )}
                        </div>

                        {people.length === 0 ? (
                          <p className="text-xs text-[#8a8477] italic py-2">
                            Add members in Step 1 to distribute the split amounts.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {people.map((person) => (
                              <div
                                key={person.id}
                                className="flex items-center justify-between gap-4 py-1.5 border-b border-[#eee7da] last:border-b-0"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#121214] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                                    {person.email.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="text-xs sm:text-sm font-semibold text-[#121214] block">
                                      {person.name}
                                    </span>
                                    <span className="text-[11px] text-[#736e65]">
                                      {person.email}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-semibold text-[#736e65]">₹</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={person.amount}
                                    onChange={(e) =>
                                      handlePersonAmountChange(person.id, e.target.value)
                                    }
                                    placeholder="0.00"
                                    className={`w-28 text-right px-2.5 py-1.5 text-sm font-semibold rounded-lg bg-white border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                      !amountsMatch
                                        ? "border-[#e74c3c] text-[#c0392b]"
                                        : "border-[#ded6c7] text-[#121214]"
                                    } focus:outline-none focus:border-[#121214]`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {people.length > 0 && !amountsMatch && (
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
                                The assigned member shares sum to ₹{assignedSum.toFixed(2)}, but the total is ₹
                                {totalNum.toFixed(2)}. Click &quot;Split Equally&quot; or adjust shares manually.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── STEP 4: Deadline (Simple date & time input) ── */}
                    <div className="relative">
                      <div className="absolute -left-[35px] sm:-left-[38px] top-3 w-7 h-7 rounded-full bg-white border border-[#ded6c7] text-[#8a8477] flex items-center justify-center text-xs font-bold shadow-2xs z-10">
                        4
                      </div>

                      <div className="bg-[#fbf9f4] rounded-2xl p-5 sm:p-6 border border-[#e8dfcf]">
                        <h4 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#121214] mb-1">
                          Deadline
                        </h4>
                        <p className="text-xs text-[#736e65] mb-4">
                          Set a payment deadline date and cutoff time.
                        </p>

                        <input
                          type="datetime-local"
                          value={deadline}
                          min={minDeadline}
                          onChange={(e) => {
                            setDeadline(e.target.value);
                            if (formErrors.deadline) setFormErrors((prev) => ({ ...prev, deadline: undefined }));
                          }}
                          className="w-full sm:w-auto bg-white border border-[#ded6c7] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#121214] focus:outline-none focus:border-[#121214] transition-all shadow-2xs"
                        />

                        {deadline && (
                          <p className="text-xs text-[#736e65] mt-2 font-medium">
                            📅 Deadline: {new Date(deadline).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} at {new Date(deadline).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}

                        {formErrors.deadline && (
                          <p className="text-[11px] text-[#d9383a] font-medium mt-1.5 flex items-center gap-1">
                            <span>⚠</span> {formErrors.deadline}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Validation Errors Summary ── */}
                  {Object.keys(formErrors).length > 0 && (
                    <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-3.5 sm:p-4 flex flex-col gap-1">
                      <h5 className="text-xs font-bold text-[#b91c1c] mb-0.5">Please fix the following:</h5>
                      {Object.values(formErrors).filter(Boolean).map((err, i) => (
                        <p key={i} className="text-[11px] text-[#991b1b] flex items-center gap-1">
                          <span>•</span> {err}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* ── Modal Footer Buttons ── */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ede4d4] shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateSplitOpen(false);
                        setFormErrors({});
                      }}
                      className="px-6 py-2.5 text-xs font-bold tracking-wider text-[#6c685f] hover:text-[#121214] rounded-xl border border-[#ded6c7] hover:bg-[#f8f5ee] transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-7 py-2.5 text-xs font-bold tracking-wider uppercase rounded-xl transition-all shadow-md bg-[#8a3d1c] hover:bg-[#733317] text-white cursor-pointer hover:shadow-lg"
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
      </main>
    </div>
  );
}
