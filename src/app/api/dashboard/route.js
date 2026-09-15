import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifySessionValue,
  SESSION_COOKIE_NAME,
} from "@/services/session.service";

export async function GET() {
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 1. Creator Stats: active splits created by user
    const createdExpenses = await prisma.expense.findMany({
      where: { creatorId: userId },
      include: {
        members: {
          include: {
            contributions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const activeCreated = createdExpenses.filter((e) => e.status === "ACTIVE");
    const activeCount = activeCreated.length;

    let totalPendingCollection = 0;
    activeCreated.forEach((expense) => {
      expense.members.forEach((member) => {
        const accepted = member.contributions
          .filter((c) => c.status === "ACCEPTED")
          .reduce((sum, c) => sum + Number(c.amount), 0);
        const remaining = Math.max(0, Number(member.assignedAmount) - accepted);
        totalPendingCollection += remaining;
      });
    });

    // 2. Payer Stats: expenses where user is a member
    const memberships = await prisma.expenseMember.findMany({
      where: { userId },
      include: {
        expense: true,
        contributions: true,
      },
    });

    let dueCount = 0;
    let totalDue = 0;
    memberships.forEach((m) => {
      if (m.expense && m.expense.status === "ACTIVE") {
        const accepted = m.contributions
          .filter((c) => c.status === "ACCEPTED")
          .reduce((sum, c) => sum + Number(c.amount), 0);
        const remaining = Math.max(0, Number(m.assignedAmount) - accepted);
        if (remaining > 0) {
          dueCount += 1;
          totalDue += remaining;
        }
      }
    });

    // 3. Recent Activity
    // A) Contributions received on expenses created by this user
    const receivedContributions = await prisma.contribution.findMany({
      where: {
        expenseMember: {
          expense: {
            creatorId: userId,
          },
        },
      },
      include: {
        expenseMember: {
          include: {
            user: true,
            expense: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 10,
    });

    // B) Contributions paid by this user
    const paidContributions = await prisma.contribution.findMany({
      where: {
        expenseMember: {
          userId,
        },
      },
      include: {
        expenseMember: {
          include: {
            expense: {
              include: {
                creator: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 10,
    });

    // C) Splits created by user
    const recentSplits = createdExpenses.slice(0, 5);

    const activities = [];

    receivedContributions.forEach((c) => {
      const memberName = c.expenseMember?.user?.name || "Member";
      const statusLabel =
        c.status === "ACCEPTED"
          ? "Approved"
          : c.status === "REJECTED"
          ? "Rejected"
          : "Pending Approval";
      activities.push({
        id: `rcv_${c.id}`,
        type: "payment_received",
        title: `Payment received from ${memberName}`,
        subtitle: `${c.expenseMember?.expense?.title || "Group Split"} • ${new Date(c.submittedAt).toLocaleDateString()}`,
        amount: `+₹${Number(c.amount).toFixed(2)}`,
        amountType: "positive",
        status: statusLabel,
        statusBadge: statusLabel,
        category: "creator",
        role: "creator",
        timestamp: new Date(c.submittedAt).getTime(),
      });
    });

    paidContributions.forEach((c) => {
      const creatorName = c.expenseMember?.expense?.creator?.name || "Creator";
      const statusLabel =
        c.status === "ACCEPTED"
          ? "Approved"
          : c.status === "REJECTED"
          ? "Rejected"
          : "Pending Approval";
      activities.push({
        id: `paid_${c.id}`,
        type: "payment_settled",
        title: `Contribution to ${creatorName}`,
        subtitle: `${c.expenseMember?.expense?.title || "Group Split"} • ${new Date(c.submittedAt).toLocaleDateString()}`,
        amount: `-₹${Number(c.amount).toFixed(2)}`,
        amountType: "negative",
        status: statusLabel,
        statusBadge: statusLabel,
        category: "payer",
        role: "payer",
        timestamp: new Date(c.submittedAt).getTime(),
      });
    });

    recentSplits.forEach((s) => {
      activities.push({
        id: `split_${s.id}`,
        type: "split_created",
        title: "New Split created",
        subtitle: `Total ₹${Number(s.totalAmount).toFixed(2)} • ${new Date(s.createdAt).toLocaleDateString()}`,
        amount: null,
        status: s.status,
        statusBadge: s.status === "ACTIVE" ? "Active" : "Closed",
        category: "creator",
        role: "creator",
        timestamp: new Date(s.createdAt).getTime(),
      });
    });

    // Sort by newest timestamp first
    activities.sort((a, b) => b.timestamp - a.timestamp);

    const formattedPending =
      totalPendingCollection >= 1000
        ? `₹${(totalPendingCollection / 1000).toFixed(1)}k`
        : `₹${Math.round(totalPendingCollection)}`;

    const formattedTotalDue =
      totalDue >= 1000
        ? `₹${(totalDue / 1000).toFixed(1)}k`
        : `₹${Math.round(totalDue)}`;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.name,
        email: user.email,
      },
      stats: {
        creator: {
          active: activeCount,
          pendingAmount: formattedPending,
        },
        payer: {
          dueCount,
          totalDue: formattedTotalDue,
        },
      },
      recentActivities: activities.slice(0, 8),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load dashboard data" },
      { status: 500 }
    );
  }
}
