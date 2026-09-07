import { createPaymentProof } from "../../../../../services/payment-proof.service.js";

export async function POST(request) {
  try {
    const body = await request.json();

    const prisma = request.prisma;

    const result = await createPaymentProof(body, prisma);

    return Response.json(result, {
      status: result.status,
    });
  } catch (error) {
    console.error("Payment proof creation error:", error);

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