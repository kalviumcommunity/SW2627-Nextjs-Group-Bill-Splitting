import { validatePaymentProofInput } from "../utils/payment-proof.validation.js";

export async function createPaymentProof(data, prisma) {
  const validation = validatePaymentProofInput(data);

  if (!validation.isValid) {
    return {
      success: false,
      status: 400,
      errors: validation.errors,
    };
  }

  const { contributionId, fileUrl, fileName } = validation.data;

  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    include: {
      paymentProof: true,
    },
  });

  if (!contribution) {
    return {
      success: false,
      status: 404,
      message: "Contribution not found",
    };
  }

  if (contribution.paymentProof) {
    return {
      success: false,
      status: 409,
      message: "Payment proof already exists for this contribution",
    };
  }

  const paymentProof = await prisma.paymentProof.create({
    data: {
      contributionId,
      fileUrl,
      fileName,
    },
  });

  return {
    success: true,
    status: 201,
    message: "Payment proof submitted successfully",
    paymentProof,
  };
}