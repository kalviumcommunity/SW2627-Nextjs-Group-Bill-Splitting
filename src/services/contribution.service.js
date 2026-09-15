import { validateContributionInput } from "../utils/contribution.validation.js";

export async function createContribution(data, prisma) {
  const validation = validateContributionInput(data);

  if (!validation.isValid) {
    return {
      success: false,
      status: 400,
      errors: validation.errors,
    };
  }

  const { expenseMemberId, amount, idempotencyKey } = validation.data;

  // Prevent duplicate submissions.
  const existingContribution = await prisma.contribution.findUnique({
    where: { idempotencyKey },
  });

  if (existingContribution) {
    return {
      success: false,
      status: 409,
      message: "Contribution with this idempotency key already exists",
    };
  }

  // Find the expense member and their assigned amount.
  const expenseMember = await prisma.expenseMember.findUnique({
    where: { id: expenseMemberId },
    include: { expense: true },
  });

  if (!expenseMember) {
    return {
      success: false,
      status: 404,
      message: "Expense member not found",
    };
  }

  const now = new Date();
  const isDeadlinePassed = Boolean(
    expenseMember.expense?.deadline && new Date(expenseMember.expense.deadline) <= now
  );
  if (expenseMember.expense?.status === "CLOSED" || isDeadlinePassed) {
    return {
      success: false,
      status: 403,
      message: "This split deadline has passed and is closed. No further contributions can be accepted.",
    };
  }

  if (amount > Number(expenseMember.assignedAmount)) {
    return {
      success: false,
      status: 400,
      message: "Contribution cannot exceed the assigned amount",
    };
  }

  const contribution = await prisma.contribution.create({
    data: {
      expenseMemberId,
      amount,
      idempotencyKey,
    },
  });

  return {
    success: true,
    status: 201,
    message: "Contribution submitted successfully",
    contribution,
  };
}