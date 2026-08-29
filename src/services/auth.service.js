import { hashPassword } from "../utils/password.js";
import { validateRegistrationInput } from "../utils/auth.validation.js";

export async function registerUser(data, prisma) {
  const validation = validateRegistrationInput(data);

  if (!validation.isValid) {
    return {
      success: false,
      status: 400,
      errors: validation.errors,
    };
  }

  const { fullName, email, age, password } = validation.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      success: false,
      status: 409,
      message: "Email already exists",
    };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name: fullName,
      email,
      age,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      age: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return {
    success: true,
    status: 201,
    message: "Registration successful",
    user,
  };
}