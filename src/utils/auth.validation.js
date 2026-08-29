export function validateRegistrationInput(data) {
  const errors = {};

  const fullName = data.fullName?.trim();
  const email = data.email?.trim().toLowerCase();
  const age = Number(data.age);
  const password = data.password;

  if (!fullName) {
    errors.fullName = "Full name is required";
  } else if (fullName.length < 2) {
    errors.fullName = "Full name must be at least 2 characters";
  }

  if (!email) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Invalid email address";
  }

  if (!Number.isInteger(age) || age < 18 || age > 120) {
    errors.age = "Age must be between 18 and 120";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      fullName,
      email,
      age,
      password,
    },
  };
}