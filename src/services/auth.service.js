import { hashPassword, comparePassword } from "../utils/password.js";
import {
  validateRegistrationInput,
  validateLoginInput,
} from "../utils/auth.validation.js";

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

export async function loginUser(data, prisma) {
  const validation = validateLoginInput(data);

  if (!validation.isValid) {
    return {
      success: false,
      status: 400,
      errors: validation.errors,
    };
  }

  const { email, password } = validation.data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return {
      success: false,
      status: 401,
      message: "Invalid email or password",
    };
  }

  const passwordMatches = await comparePassword(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    return {
      success: false,
      status: 401,
      message: "Invalid email or password",
    };
  }

  return {
    success: true,
    status: 200,
    message: "Login successful",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      emailVerified: user.emailVerified,
    },
  };
}