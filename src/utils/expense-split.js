const CURRENCY_SCALE = 100;

export function calculateEqualSplit(totalAmount, memberCount) {
  if (memberCount <= 0) {
    throw new Error("Member count must be greater than 0");
  }

  const totalInCents = Math.round(Number(totalAmount) * CURRENCY_SCALE);
  const baseShare = Math.floor(totalInCents / memberCount);
  const remainder = totalInCents % memberCount;

  return Array.from({ length: memberCount }, (_, index) => {
    const shareInCents = baseShare + (index < remainder ? 1 : 0);

    return shareInCents / CURRENCY_SCALE;
  });
}

export function validateManualSplit(totalAmount, members) {
  if (!Array.isArray(members) || members.length === 0) {
    return {
      isValid: false,
      message: "At least one member is required",
    };
  }

  const totalInCents = Math.round(Number(totalAmount) * CURRENCY_SCALE);

  let assignedTotalInCents = 0;

  for (const member of members) {
    const amountInCents = Math.round(
      Number(member.assignedAmount) * CURRENCY_SCALE
    );

    if (Number.isNaN(amountInCents) || amountInCents <= 0) {
      return {
        isValid: false,
        message: "Every assigned amount must be greater than 0",
      };
    }

    assignedTotalInCents += amountInCents;
  }

  if (assignedTotalInCents !== totalInCents) {
    return {
      isValid: false,
      message: "Assigned amounts must equal the total amount",
    };
  }

  return {
    isValid: true,
  };
}