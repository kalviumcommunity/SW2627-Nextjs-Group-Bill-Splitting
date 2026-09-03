import { calculateEqualSplit } from "../utils/expense-split.js";
import { validateExpenseSplitInput } from "../utils/expense-split.validation.js";

export function calculateExpenseSplit(data) {
  const validation = validateExpenseSplitInput(data);

  if (!validation.isValid) {
    return {
      success: false,
      status: 400,
      errors: validation.errors,
    };
  }

  const { totalAmount, splitType, members } = validation.data;

  if (splitType === "EQUAL") {
    const shares = calculateEqualSplit(totalAmount, members.length);

    return {
      success: true,
      status: 200,
      splitType,
      members: members.map((member, index) => ({
        userId: member.userId,
        assignedAmount: shares[index],
      })),
    };
  }

  return {
    success: true,
    status: 200,
    splitType,
    members: members.map((member) => ({
      userId: member.userId,
      assignedAmount: Number(member.assignedAmount),
    })),
  };
}