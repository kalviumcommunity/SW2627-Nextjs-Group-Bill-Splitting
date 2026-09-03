export function validateExpenseInput(data) {
  const errors = {};

  const totalAmount = Number(data.totalAmount);
  const deadline = data.deadline;
  const members = data.members;
  const splitType = data.splitType;

  if (
    data.totalAmount === undefined ||
    data.totalAmount === null ||
    data.totalAmount === ""
  ) {
    errors.totalAmount = "Total amount is required";
  } else if (Number.isNaN(totalAmount) || totalAmount <= 0) {
    errors.totalAmount = "Total amount must be greater than 0";
  }

  if (!deadline) {
    errors.deadline = "Deadline is required";
  } else if (Number.isNaN(new Date(deadline).getTime())) {
    errors.deadline = "Invalid deadline";
  }

  if (!Array.isArray(members) || members.length === 0) {
    errors.members = "At least one member is required";
  } else if (members.some((member) => !member.userId)) {
    errors.members = "Every member must have a user ID";
  } else if (splitType === "MANUAL") {
    if (
      members.some(
        (member) =>
          Number.isNaN(Number(member.assignedAmount)) ||
          Number(member.assignedAmount) <= 0
      )
    ) {
      errors.members = "Every assigned amount must be greater than 0";
    } else {
      const assignedTotal = members.reduce(
        (sum, member) => sum + Number(member.assignedAmount),
        0
      );

      if (assignedTotal !== totalAmount) {
        errors.members = "Assigned amounts must equal the total amount";
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      totalAmount,
      deadline: deadline ? new Date(deadline) : undefined,
      members,
    },
  };
}