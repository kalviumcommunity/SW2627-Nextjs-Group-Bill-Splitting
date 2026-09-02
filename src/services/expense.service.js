import { validateExpenseInput } from "../utils/expense.validation.js";

export async function createExpense(data, prisma) {
  const validation = validateExpenseInput(data);

  if (!validation.isValid) {
    return {
      success: false,
      status: 400,
      errors: validation.errors,
    };
  }

  const { totalAmount, deadline, members } = validation.data;

  // Create the expense and its members together.
  const expense = await prisma.expense.create({
    data: {
      creatorId: data.creatorId,
      totalAmount,
      deadline,
      members: {
        create: members.map((member) => ({
          userId: member.userId,
          assignedAmount: member.assignedAmount,
        })),
      },
    },
    include: {
      members: true,
    },
  });

  return {
    success: true,
    status: 201,
    message: "Expense created successfully",
    expense,
  };
}