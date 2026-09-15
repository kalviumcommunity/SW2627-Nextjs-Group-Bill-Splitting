import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifySessionValue,
  SESSION_COOKIE_NAME,
} from "@/services/session.service";

/**
 * Helper to ensure PostgreSQL Expense table has title column
 */
let isSchemaMigrated = false;
async function ensureTitleColumn() {
  if (isSchemaMigrated) return;
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "title" TEXT DEFAULT \'Group Split\';'
    );
    isSchemaMigrated = true;
  } catch (err) {
    console.warn("Could not ensure title column:", err.message);
  }
}

/**
 * GET /api/expenses?role=creator|payer
 * Retrieves expenses for the logged-in user as either creator or assigned payer.
 */
export async function GET(request) {
  try {
    await ensureTitleColumn();

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    const userId = verifySessionValue(sessionCookie?.value);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "creator";

    // Load actual titles directly from PostgreSQL to guarantee user-entered title is shown
    let titleMap = {};
    try {
      const rawRows = await prisma.$queryRawUnsafe(
        'SELECT "id", "title" FROM "Expense"'
      );
      if (Array.isArray(rawRows)) {
        rawRows.forEach((r) => {
          if (r.id && r.title) {
            titleMap[r.id] = r.title;
          }
        });
      }
    } catch (e) {
      console.warn("Could not fetch raw titles:", e.message);
    }

    // Automatically close any active expenses whose deadline has arrived
    try {
      await prisma.expense.updateMany({
        where: {
          status: "ACTIVE",
          deadline: { lte: new Date() },
        },
        data: {
          status: "CLOSED",
        },
      });
    } catch (e) {
      console.warn("Could not auto-close expired expenses:", e.message);
    }

    if (role === "payer") {
      // Fetch expenses where user is a participant/member
      const memberships = await prisma.expenseMember.findMany({
        where: { userId },
        include: {
          expense: {
            include: {
              creator: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          contributions: {
            include: {
              paymentProof: true,
            },
            orderBy: { submittedAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedPayerExpenses = memberships.map((m) => {
        const assigned = Number(m.assignedAmount);
        const acceptedPaid = m.contributions
          .filter((c) => c.status === "ACCEPTED")
          .reduce((sum, c) => sum + Number(c.amount), 0);
        const pendingPaid = m.contributions
          .filter((c) => c.status === "PENDING")
          .reduce((sum, c) => sum + Number(c.amount), 0);
        const remaining = Math.max(0, assigned - acceptedPaid);
        const deadlineDate = m.expense?.deadline ? new Date(m.expense.deadline) : null;
        const now = new Date();
        const isDeadlinePassed = Boolean(deadlineDate && deadlineDate <= now);
        const isClosed = m.expense?.status === "CLOSED" || isDeadlinePassed;

        const splitTitle =
          titleMap[m.expense?.id] ||
          m.expense?.title ||
          `Split #${m.expense?.id?.slice(-6) || "Bill"}`;

        let statusText = "Pending";
        if (remaining <= 0) {
          statusText = "Settled";
        } else if (isClosed) {
          statusText = "Closed";
        } else if (pendingPaid > 0) {
          statusText = "Pending Approval";
        }

        return {
          id: m.expense?.id || m.id,
          expenseMemberId: m.id,
          title: splitTitle,
          creator: m.expense?.creator?.name || "Creator",
          creatorEmail: m.expense?.creator?.email || "",
          category: "Shared Bill",
          assigned,
          paidSoFar: acceptedPaid,
          pendingApprovalAmount: pendingPaid,
          remaining,
          dueDate: deadlineDate
            ? deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "No Deadline",
          deadline: deadlineDate
            ? deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "No Deadline",
          rawDeadline: m.expense?.deadline,
          isClosed,
          status: statusText,
          createdAt: m.expense?.createdAt || m.createdAt,
          contributions: m.contributions.map((c) => ({
            id: c.id,
            amount: Number(c.amount),
            status: c.status,
            rejectionReason: c.rejectionReason,
            submittedAt: c.submittedAt,
            paymentProof: c.paymentProof
              ? {
                  id: c.paymentProof.id,
                  fileName: c.paymentProof.fileName,
                  fileUrl: c.paymentProof.fileUrl,
                }
              : null,
          })),
        };
      });

      return NextResponse.json({
        success: true,
        expenses: formattedPayerExpenses,
      });
    }

    // Default: role === "creator"
    // Fetch all splits created by this user with complete member contribution proofs
    const createdExpenses = await prisma.expense.findMany({
      where: { creatorId: userId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            contributions: {
              include: {
                paymentProof: true,
              },
              orderBy: { submittedAt: "desc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedCreatorExpenses = createdExpenses.map((exp) => {
      const totalAmount = Number(exp.totalAmount);
      let totalCollected = 0;
      let totalPendingReview = 0;

      const members = exp.members.map((m) => {
        const memberAssigned = Number(m.assignedAmount);
        const memberAccepted = m.contributions
          .filter((c) => c.status === "ACCEPTED")
          .reduce((sum, c) => sum + Number(c.amount), 0);
        const memberPending = m.contributions
          .filter((c) => c.status === "PENDING")
          .reduce((sum, c) => sum + Number(c.amount), 0);

        totalCollected += memberAccepted;
        totalPendingReview += memberPending;

        return {
          id: m.id,
          name: m.user?.name || m.user?.email?.split("@")[0] || "Participant",
          email: m.user?.email || "",
          amount: memberAssigned,
          paidAmount: memberAccepted,
          pendingReviewAmount: memberPending,
          contributions: m.contributions.map((c) => ({
            id: c.id,
            amount: Number(c.amount),
            status: c.status,
            submittedAt: c.submittedAt,
            rejectionReason: c.rejectionReason,
            paymentProof: c.paymentProof
              ? {
                  id: c.paymentProof.id,
                  fileName: c.paymentProof.fileName,
                  fileUrl: c.paymentProof.fileUrl,
                }
              : null,
          })),
        };
      });

      const remainingAmount = Math.max(0, totalAmount - totalCollected);
      const progress = totalAmount > 0 ? Math.min(100, Math.round((totalCollected / totalAmount) * 100)) : 0;
      const deadlineDate = new Date(exp.deadline);
      const now = new Date();
      const isDeadlinePassed = deadlineDate <= now;
      const isClosed = exp.status === "CLOSED" || isDeadlinePassed;

      const splitTitle =
        titleMap[exp.id] ||
        exp.title ||
        `Split #${exp.id.slice(-6)}`;

      return {
        id: exp.id,
        title: splitTitle,
        status: isClosed ? "Closed" : "Active",
        isClosed,
        rawDeadline: exp.deadline,
        dateLabel: isClosed
          ? `Closed (${deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
          : `Due ${deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        createdAt: exp.createdAt.toISOString(),
        deadline:
          deadlineDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }) +
          " at " +
          deadlineDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        totalAmount,
        collectedAmount: totalCollected,
        pendingReviewAmount: totalPendingReview,
        remainingAmount,
        progress,
        memberCount: members.length,
        members,
      };
    });

    return NextResponse.json({
      success: true,
      expenses: formattedCreatorExpenses,
    });
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load expenses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/expenses
 * Creates a new split with registered members only and stores the exact title in PostgreSQL.
 */
export async function POST(request) {
  try {
    await ensureTitleColumn();

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    const userId = verifySessionValue(sessionCookie?.value);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, totalAmount, deadline, members } = body;

    const cleanTitle = title?.trim();
    const totalNum = Number(totalAmount);

    if (!cleanTitle) {
      return NextResponse.json(
        { success: false, message: "Split title is required" },
        { status: 400 }
      );
    }

    if (isNaN(totalNum) || totalNum <= 0) {
      return NextResponse.json(
        { success: false, message: "Total amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (!deadline || isNaN(new Date(deadline).getTime())) {
      return NextResponse.json(
        { success: false, message: "Valid deadline is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one member is required" },
        { status: 400 }
      );
    }

    // REQUIRE REGISTERED MEMBERS ONLY:
    // Every member added MUST already exist as a registered user in the database.
    const resolvedMembers = [];
    const unregisteredEmails = [];

    for (const m of members) {
      const email = m.email?.trim().toLowerCase();
      if (!email) continue;

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        unregisteredEmails.push(m.email);
      } else if (user.id === userId) {
        return NextResponse.json(
          {
            success: false,
            message: "You are the creator of this split and cannot add yourself as a member.",
          },
          { status: 400 }
        );
      } else {
        resolvedMembers.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          amount: Number(m.amount) || 0,
        });
      }
    }

    if (unregisteredEmails.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `The following member(s) are not registered on CRED Split: ${unregisteredEmails.join(", ")}. Only registered users can be added to a split.`,
        },
        { status: 400 }
      );
    }

    // Create the expense record
    const createdExpense = await prisma.expense.create({
      data: {
        creatorId: userId,
        totalAmount: totalNum,
        deadline: new Date(deadline),
        status: "ACTIVE",
        members: {
          create: resolvedMembers.map((m) => ({
            userId: m.userId,
            assignedAmount: m.amount,
          })),
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    // Write title directly into PostgreSQL Expense table
    try {
      await prisma.$executeRawUnsafe(
        'UPDATE "Expense" SET "title" = $1 WHERE "id" = $2',
        cleanTitle,
        createdExpense.id
      );
    } catch (titleErr) {
      console.warn("Could not set title via raw SQL:", titleErr.message);
    }

    const deadlineDate = new Date(createdExpense.deadline);
    const formattedDeadline =
      deadlineDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      " at " +
      deadlineDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

    const formattedExpense = {
      id: createdExpense.id,
      title: cleanTitle,
      status: "Active",
      dateLabel: `Due ${deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      createdAt: createdExpense.createdAt.toISOString(),
      deadline: formattedDeadline,
      totalAmount: totalNum,
      collectedAmount: 0.0,
      pendingReviewAmount: 0.0,
      remainingAmount: totalNum,
      progress: 0,
      memberCount: resolvedMembers.length,
      members: resolvedMembers.map((m) => ({
        id: m.userId,
        name: m.name,
        email: m.email,
        amount: m.amount,
        paidAmount: 0,
        pendingReviewAmount: 0,
        contributions: [],
      })),
    };

    return NextResponse.json(
      {
        success: true,
        message: `Split "${cleanTitle}" created successfully!`,
        expense: formattedExpense,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to create split" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/expenses?id=<expenseId>
 * Deletes an expense and cascades the deletion across all member allocations,
 * contributions, payment proofs, and shortfalls, completely removing it from
 * the creator's and all members' accounts.
 */
export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    const userId = verifySessionValue(sessionCookie?.value);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get("id");

    if (!expenseId) {
      return NextResponse.json(
        { success: false, message: "Expense ID is required" },
        { status: 400 }
      );
    }

    // Verify the split exists and the current user is the creator
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        members: {
          include: {
            contributions: true,
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 }
      );
    }

    if (expense.creatorId !== userId) {
      return NextResponse.json(
        { success: false, message: "Only the creator of this split can delete it" },
        { status: 403 }
      );
    }

    const memberIds = expense.members.map((m) => m.id);
    const contributionIds = expense.members.flatMap((m) =>
      m.contributions.map((c) => c.id)
    );

    // Delete in order to satisfy foreign key constraints
    await prisma.$transaction(async (tx) => {
      // 1. Delete payment proofs for all member contributions
      if (contributionIds.length > 0) {
        await tx.paymentProof.deleteMany({
          where: { contributionId: { in: contributionIds } },
        });

        // 2. Delete all contributions
        await tx.contribution.deleteMany({
          where: { id: { in: contributionIds } },
        });
      }

      // 3. Delete shortfalls if any
      await tx.shortfall.deleteMany({
        where: { expenseId },
      });

      // 4. Delete all expense members (erases the split from members' accounts)
      if (memberIds.length > 0) {
        await tx.expenseMember.deleteMany({
          where: { id: { in: memberIds } },
        });
      }

      // 5. Delete the expense itself
      await tx.expense.delete({
        where: { id: expenseId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Split and all member accounts updated successfully",
    });
  } catch (error) {
    console.error("DELETE /api/expenses error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to delete split" },
      { status: 500 }
    );
  }
}