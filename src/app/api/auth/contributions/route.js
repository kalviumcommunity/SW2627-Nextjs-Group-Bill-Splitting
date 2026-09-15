import { NextResponse } from "next/server";
import { createContribution } from "../../../../services/contribution.service.js";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();

    const result = await createContribution(body, prisma);

    return NextResponse.json(
      result,
      { status: result.status }
    );
  } catch (error) {
    console.error("Contribution creation error:", error);

    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}