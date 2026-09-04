export function validateContributionInput(data) {
  const errors = {};

  const expenseMemberId = data.expenseMemberId?.trim();
  const amount = Number(data.amount);
  const idempotencyKey = data.idempotencyKey?.trim();

  if (!expenseMemberId) {
    errors.expenseMemberId = "Expense member ID is required";
  }

  if (
    data.amount === undefined ||
    data.amount === null ||
    data.amount === ""
  ) {
    errors.amount = "Contribution amount is required";
  } else if (Number.isNaN(amount) || amount <= 0) {
    errors.amount = "Contribution amount must be greater than 0";
  }

  if (!idempotencyKey) {
    errors.idempotencyKey = "Idempotency key is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      expenseMemberId,
      amount,
      idempotencyKey,
    },
  };
}