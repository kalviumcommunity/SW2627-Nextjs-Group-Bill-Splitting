import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifySessionValue,
  SESSION_COOKIE_NAME,
} from "@/services/session.service";

/**
 * POST /api/contributions
 * Records a member contribution and payment proof for an assigned split.
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
    const {
      expenseId,
      expenseMemberId,
      amount,
      transactionRef,
      note,
      proofFileName,
      proofFileUrl,
    } = body;

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid payment amount" },
        { status: 400 }
      );
    }

    // Resolve ExpenseMember
    let membership;
    if (expenseMemberId) {
      membership = await prisma.expenseMember.findUnique({
        where: { id: expenseMemberId },
        include: { expense: true },
      });
    } else if (expenseId) {
      membership = await prisma.expenseMember.findFirst({
        where: {
          expenseId,
          userId,
        },
        include: { expense: true },
      });
    }

    if (!membership) {
      return NextResponse.json(
        { success: false, message: "Assigned expense membership not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const isDeadlinePassed = Boolean(
      membership.expense?.deadline && new Date(membership.expense.deadline) <= now
    );
    const isClosed = membership.expense?.status === "CLOSED" || isDeadlinePassed;

    if (isClosed) {
      // Synchronize database status to CLOSED if deadline passed
      if (membership.expense?.status === "ACTIVE" && isDeadlinePassed) {
        await prisma.expense
          .update({
            where: { id: membership.expense.id },
            data: { status: "CLOSED" },
          })
          .catch(() => {});
      }

      return NextResponse.json(
        {
          success: false,
          message: "This split deadline has passed and is now closed. No further contributions can be made.",
        },
        { status: 403 }
      );
    }

    const idempotencyKey = `contrib_${membership.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Create the contribution record with PENDING status awaiting creator approval
    const contribution = await prisma.contribution.create({
      data: {
        expenseMemberId: membership.id,
        amount: amountNum,
        status: "PENDING", // PENDING approval by creator
        idempotencyKey,
        rejectionReason: note?.trim() || (transactionRef ? `Ref: ${transactionRef}` : null),
        paymentProof: (proofFileName || proofFileUrl)
          ? {
              create: {
                fileName: proofFileName || "receipt_proof",
                fileUrl: proofFileUrl || `/uploads/${proofFileName}`,
              },
            }
          : undefined,
      },
      include: {
        paymentProof: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payment and proof submitted successfully! Pending approval by creator.",
        contribution: {
          id: contribution.id,
          amount: Number(contribution.amount),
          status: contribution.status,
          submittedAt: contribution.submittedAt,
          paymentProof: contribution.paymentProof,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/contributions error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to record payment" },
      { status: 500 }
    );
  }
}
