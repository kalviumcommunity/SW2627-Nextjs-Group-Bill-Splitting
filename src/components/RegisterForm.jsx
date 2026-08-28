"use client";

import { useState } from "react";
import Link from "next/link";
import OtpVerifyForm from "./OtpVerifyForm";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    age: "",
    password: "",
  });

  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [showOtpScreen, setShowOtpScreen] = useState(false);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    // Full Name validation (min 3 chars, no special characters or numbers)
    const trimmedName = formData.fullName.trim();
    if (!trimmedName) {
      newErrors.fullName = "Full name is required";
    } else if (trimmedName.length < 3) {
      newErrors.fullName = "Full name must be at least 3 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
      newErrors.fullName = "Full name should not include special characters or numbers";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // Age validation
    if (!formData.age) {
      newErrors.age = "Age is required";
    } else {
      const ageNum = parseInt(formData.age, 10);
      if (isNaN(ageNum) || ageNum < 18) {
        newErrors.age = "Must be 18+";
      } else if (ageNum > 120) {
        newErrors.age = "Invalid age";
      }
    }

    // Password validation: min length 8, uppercase, lowercase, number, special character
    const password = formData.password;
    if (!password) {
      newErrors.password = "Password is required";
    } else {
      const missing = [];
      if (password.length < 8) {
        missing.push("at least 8 characters");
      }
      if (!/[A-Z]/.test(password)) {
        missing.push("1 uppercase letter");
      }
      if (!/[a-z]/.test(password)) {
        missing.push("1 lowercase letter");
      }
      if (!/[0-9]/.test(password)) {
        missing.push("1 number");
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
        missing.push("1 special character");
      }

      if (missing.length > 0) {
        newErrors.password = `Missing: ${missing.join(", ")}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerStatus(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    /*
     * BACKEND CONTRACT (From PRD Section 8.1 Authentication):
     *
     * 1. WHAT TO SEND TO BACKEND:
     *    Endpoint: POST /api/auth/register
     *    Payload: {
     *      "fullName": formData.fullName,
     *      "email": formData.email,
     *      "age": Number(formData.age),
     *      "password": formData.password
     *    }
     *
     * 2. WHAT TO EXPECT FROM BACKEND:
     *    - Success: { "success": true, "message": "OTP sent to email", "email": "..." }
     *    - Error:   { "success": false, "message": "Email already exists" }
     */

    try {
      // Simulate backend registration call and transition to OTP verification
      await new Promise((resolve) => setTimeout(resolve, 600));
      setShowOtpScreen(true);
    } catch (err) {
      setServerStatus({
        type: "error",
        message: "Failed to submit registration. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render OTP Verification Screen upon registration initiation
  if (showOtpScreen) {
    return (
      <OtpVerifyForm
        email={formData.email}
        onBack={() => setShowOtpScreen(false)}
        onSuccess={() => {
          console.log("Account activated successfully for", formData.email);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col justify-between w-full h-full p-6 sm:p-10 lg:p-14 xl:p-16">
      {/* Centered Registration Card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[420px] bg-white rounded-none sm:rounded-lg p-8 sm:p-10 border border-[#ded8cc] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] transition-all duration-300">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-tight text-[#121214] mb-1">
              Create Account
            </h2>
            <p className="text-xs text-[#6c6a75] font-normal">
              Enter your details to register
            </p>
          </div>

          {/* Feedback Alert */}
          {serverStatus && (
            <div
              className={`mb-6 p-3.5 rounded-lg text-xs font-medium border flex items-start gap-2.5 transition-all ${
                serverStatus.type === "success"
                  ? "bg-[#f2faf4] text-[#14532d] border-[#bbf7d0]"
                  : "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]"
              }`}
            >
              <span>{serverStatus.type === "success" ? "✓" : "⚠"}</span>
              <p className="flex-1 leading-relaxed">{serverStatus.message}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            
            {/* FULL NAME */}
            <div className="space-y-1">
              <label
                htmlFor="fullName"
                className="block text-[10px] font-bold tracking-[0.15em] text-[#121214] uppercase"
              >
                FULL NAME
              </label>
              <div
                className={`border-b transition-colors ${
                  errors.fullName
                    ? "border-[#d9383a]"
                    : focusedField === "fullName"
                    ? "border-[#121214]"
                    : "border-[#cfc9bc] hover:border-[#9e988c]"
                }`}
              >
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("fullName")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full py-2 text-sm text-[#121214] placeholder-[#aaa498] bg-transparent outline-none font-medium"
                  autoComplete="name"
                  disabled={isSubmitting}
                />
              </div>
              {errors.fullName && (
                <span className="text-[10px] font-medium text-[#d9383a] mt-0.5 block">
                  {errors.fullName}
                </span>
              )}
            </div>

            {/* EMAIL ADDRESS & AGE (Dual Column) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3">
              {/* EMAIL ADDRESS */}
              <div className="sm:col-span-2 space-y-1">
                <label
                  htmlFor="email"
                  className="block text-[10px] font-bold tracking-[0.15em] text-[#121214] uppercase"
                >
                  EMAIL ADDRESS
                </label>
                <div
                  className={`border-b transition-colors ${
                    errors.email
                      ? "border-[#d9383a]"
                      : focusedField === "email"
                      ? "border-[#121214]"
                      : "border-[#cfc9bc] hover:border-[#9e988c]"
                  }`}
                >
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@domain.com"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full py-2 text-sm text-[#121214] placeholder-[#aaa498] bg-transparent outline-none font-medium"
                    autoComplete="email"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <span className="text-[10px] font-medium text-[#d9383a] mt-0.5 block">
                    {errors.email}
                  </span>
                )}
              </div>

              {/* AGE */}
              <div className="sm:col-span-1 space-y-1">
                <label
                  htmlFor="age"
                  className="block text-[10px] font-bold tracking-[0.15em] text-[#121214] uppercase"
                >
                  AGE
                </label>
                <div
                  className={`border-b transition-colors ${
                    errors.age
                      ? "border-[#d9383a]"
                      : focusedField === "age"
                      ? "border-[#121214]"
                      : "border-[#cfc9bc] hover:border-[#9e988c]"
                  }`}
                >
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="18"
                    max="120"
                    placeholder="18+"
                    value={formData.age}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("age")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full py-2 text-sm text-[#121214] placeholder-[#aaa498] bg-transparent outline-none font-medium"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.age && (
                  <span className="text-[10px] font-medium text-[#d9383a] mt-0.5 block">
                    {errors.age}
                  </span>
                )}
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-[10px] font-bold tracking-[0.15em] text-[#121214] uppercase"
              >
                PASSWORD
              </label>

              <div
                className={`relative border-b transition-colors ${
                  errors.password
                    ? "border-[#d9383a]"
                    : focusedField === "password"
                    ? "border-[#121214]"
                    : "border-[#cfc9bc] hover:border-[#9e988c]"
                }`}
              >
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full py-2 pr-8 text-sm text-[#121214] placeholder-[#aaa498] bg-transparent outline-none font-medium"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                
                {/* Eye Icon Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#787582] hover:text-[#121214] transition-colors focus:outline-none cursor-pointer p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    /* Eye Slashed (Hide) */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    /* Eye Open (Show) */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {errors.password && (
                <span className="text-[10px] font-medium text-[#d9383a] mt-0.5 block leading-tight">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Primary Action Button (CONTINUE →) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full bg-[#121214] text-white hover:bg-[#25242b] active:scale-[0.99] transition-all duration-300 py-3.5 px-6 rounded-md font-bold text-xs tracking-[0.18em] uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_8px_16px_-4px_rgba(15,15,18,0.25)] hover:shadow-[0_12px_20px_-4px_rgba(15,15,18,0.35)]"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    CREATING ACCOUNT...
                  </span>
                ) : (
                  <>
                    <span>CONTINUE</span>
                    <span className="text-sm font-light transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="border-t border-[#e8e4da] my-6" />

          {/* Switch to Login Link */}
          <div className="text-center">
            <p className="text-xs text-[#6c6a75]">
              Already a member?{" "}
              <Link
                href="/login"
                className="text-[#121214] font-bold underline hover:text-[#38363f] transition-colors ml-1"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Branding Note */}
      <div className="text-center pt-6">
        <p className="text-[10px] tracking-[0.2em] font-semibold text-[#9e9a8f] uppercase">
          © 2024 CRED SPLIT. HIGH-END FINANCIAL EXPERIENCE.
        </p>
      </div>
    </div>
  );
}
