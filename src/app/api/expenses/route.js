import { validateExpenseInput } from "../../../../utils/expense.validation";

export async function POST(request) {
  try {
    const body = await request.json();

    const validation = validateExpenseInput(body);

    if (!validation.isValid) {
      return Response.json(
        {
          success: false,
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: false,
        message: "Database connection is not configured yet",
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Create Expense API error:", error);

    return Response.json(
      {
        success: false,
        message: "Invalid request",
      },
      { status: 400 }
    );
  }
}