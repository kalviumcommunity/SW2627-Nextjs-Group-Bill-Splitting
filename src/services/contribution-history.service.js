export async function getContributionHistory(expenseMemberId, prisma) {
  if (!expenseMemberId?.trim()) {
    return {
      success: false,
      status: 400,
      message: "Expense member ID is required",
    };
  }

  const expenseMember = await prisma.expenseMember.findUnique({
    where: { id: expenseMemberId },
  });

  if (!expenseMember) {
    return {
      success: false,
      status: 404,
      message: "Expense member not found",
    };
  }

  const contributions = await prisma.contribution.findMany({
    where: { expenseMemberId },
    include: {
      paymentProof: true,
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

  return {
    success: true,
    status: 200,
    contributions,
  };
}