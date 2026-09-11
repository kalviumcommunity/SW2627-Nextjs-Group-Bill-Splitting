import { NextResponse } from "next/server";
import { validateExpenseInput } from "../../../utils/expense.validation.js";

export async function POST(request) {
  try {
    const body = await request.json();

    const validation = validateExpenseInput(body);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Database connection is not configured yet",
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Create Expense API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Invalid request",
      },
      { status: 400 }
    );
  }
}