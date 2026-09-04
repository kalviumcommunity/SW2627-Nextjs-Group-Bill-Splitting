import { createContribution } from "../../../../services/contribution.service.js";

export async function POST(request) {
  try {
    const body = await request.json();

    // Prisma will be connected here once the database is configured.
    // For now, the service expects Prisma to be passed in.
    const prisma = request.prisma;

    const result = await createContribution(body, prisma);

    return Response.json(
      result,
      { status: result.status }
    );
  } catch (error) {
    console.error("Contribution creation error:", error);

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