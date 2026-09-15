import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifySessionValue,
  SESSION_COOKIE_NAME,
} from "@/services/session.service";

/**
 * POST /api/contributions/review
 * Allows the creator of an expense to review (Approve or Reject) a member's submitted payment proof.
 */
export async function POST(request) {
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

    const body = await request.json();
    const { contributionId, action, rejectionReason } = body;

    if (!contributionId) {
      return NextResponse.json(
        { success: false, message: "Contribution ID is required" },
        { status: 400 }
      );
    }

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { success: false, message: "Action must be either 'APPROVE' or 'REJECT'" },
        { status: 400 }
      );
    }

    // Find contribution and verify creator ownership
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      include: {
        expenseMember: {
          include: {
            expense: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        paymentProof: true,
      },
    });

    if (!contribution) {
      return NextResponse.json(
        { success: false, message: "Contribution not found" },
        { status: 404 }
      );
    }

    const expenseCreatorId = contribution.expenseMember?.expense?.creatorId;
    if (expenseCreatorId !== userId) {
      return NextResponse.json(
        { success: false, message: "Only the creator of this split can approve or reject payments" },
        { status: 403 }
      );
    }

    const newStatus = action === "APPROVE" ? "ACCEPTED" : "REJECTED";

    const updatedContribution = await prisma.contribution.update({
      where: { id: contributionId },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedById: userId,
        rejectionReason: action === "REJECT" ? (rejectionReason?.trim() || "Proof rejected by creator") : null,
      },
      include: {
        paymentProof: true,
      },
    });

    const memberName = contribution.expenseMember?.user?.name || "Member";

    return NextResponse.json({
      success: true,
      message:
        action === "APPROVE"
          ? `Payment of ₹${Number(updatedContribution.amount).toFixed(2)} from ${memberName} approved successfully!`
          : `Payment from ${memberName} rejected.`,
      contribution: {
        id: updatedContribution.id,
        status: updatedContribution.status,
        amount: Number(updatedContribution.amount),
        reviewedAt: updatedContribution.reviewedAt,
      },
    });
  } catch (error) {
    console.error("Contribution review error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to review contribution" },
      { status: 500 }
    );
  }
}
