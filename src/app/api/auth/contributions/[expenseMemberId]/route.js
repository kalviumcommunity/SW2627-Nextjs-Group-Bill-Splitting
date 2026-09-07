import { getContributionHistory } from "../../../../../services/contribution-history.service.js";

export async function GET(request, { params }) {
  try {
    const { expenseMemberId } = await params;

    const prisma = request.prisma;

    const result = await getContributionHistory(
      expenseMemberId,
      prisma
    );

    return Response.json(result, {
      status: result.status,
    });
  } catch (error) {
    console.error("Contribution history error:", error);

    return Response.json(
      {
        success: false,
        status: 500,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}