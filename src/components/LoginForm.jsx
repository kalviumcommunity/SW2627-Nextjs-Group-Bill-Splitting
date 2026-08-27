"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Client-side validation per PRD specifications
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerStatus(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    /*
     * BACKEND CONTRACT (From PRD Section 8.1 & 9.1 Authentication):
     *
     * 1. WHAT TO SEND TO BACKEND:
     *    Endpoint: POST /api/auth/login
     *    Headers: { "Content-Type": "application/json" }
     *    Payload: {
     *      email: formData.email,
     *      password: formData.password
     *    }
     *
     * 2. WHAT TO EXPECT FROM BACKEND:
     *    - Success (200 OK):
     *      {
     *        success: true,
     *        message: "Login successful",
     *        user: {
     *          id: "usr_...",
     *          fullName: "...",
     *          email: "..."
     *        },
     *        token: "jwt_token_here"
     *      }
     *    - Verification Required (403 Forbidden):
     *      {
     *        success: false,
     *        needsVerification: true,
     *        message: "Please verify your email before logging in."
     *      }
     *    - Invalid Credentials (401 Unauthorized):
     *      {
     *        success: false,
     *        message: "Invalid email or password."
     *      }
     */

    try {
      // Simulate backend network round-trip for frontend preview
      await new Promise((resolve) => setTimeout(resolve, 800));

      setServerStatus({
        type: "success",
        message: "Welcome back! Redirecting to your dashboard...",
      });
    } catch (err) {
      setServerStatus({
        type: "error",
        message: "Unable to authenticate. Please check your credentials.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col justify-between w-full h-full p-6 sm:p-10 lg:p-14 xl:p-16">
      {/* Centered Login Card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[460px] bg-white rounded-3xl p-8 sm:p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06),0_0_1px_1px_rgba(0,0,0,0.03)] border border-[#ebe7dc] transition-all duration-300">
          
          {/* Header Section */}
          <div className="mb-8">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-tight text-[#121214] mb-2">
              Welcome Back
            </h2>
            <p className="text-xs sm:text-sm text-[#6c6a75] font-normal leading-relaxed">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {/* Server Feedback Banner */}
          {serverStatus && (
            <div
              className={`mb-6 p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                serverStatus.type === "success"
                  ? "bg-[#f2faf4] text-[#14532d] border-[#bbf7d0]"
                  : "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]"
              }`}
            >
              <span>{serverStatus.type === "success" ? "✓" : "⚠"}</span>
              <span>{serverStatus.message}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* Email Address Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#121214] tracking-wide"
              >
                Email Address
              </label>
              <div
                className={`relative rounded-xl border transition-all duration-200 bg-[#fbf9f4] ${
                  errors.email
                    ? "border-[#d9383a] bg-[#fef2f2]/30"
                    : focusedField === "email"
                    ? "border-[#121214] bg-white ring-2 ring-[#121214]/10 shadow-xs"
                    : "border-[#d8d2c4] hover:border-[#a8a29e]"
                }`}
              >
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3.5 text-sm text-[#121214] placeholder-[#a4a095] bg-transparent outline-none rounded-xl font-medium"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-[#d9383a] font-medium pl-1 flex items-center gap-1">
                  <span>⚠</span> {errors.email}
                </p>
              )}
            </div>

            {/* Password Field + Forgot Password Link */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#121214] tracking-wide"
                >
                  Password
                </label>
                <a
                  href="#forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Password recovery flow: Backend endpoint POST /api/auth/forgot-password will be called.");
                  }}
                  className="text-xs font-medium text-[#6c6a75] hover:text-[#121214] transition-colors cursor-pointer"
                >
                  Forgot?
                </a>
              </div>

              <div
                className={`relative rounded-xl border transition-all duration-200 bg-[#fbf9f4] ${
                  errors.password
                    ? "border-[#d9383a] bg-[#fef2f2]/30"
                    : focusedField === "password"
                    ? "border-[#121214] bg-white ring-2 ring-[#121214]/10 shadow-xs"
                    : "border-[#d8d2c4] hover:border-[#a8a29e]"
                }`}
              >
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3.5 pr-12 text-sm text-[#121214] placeholder-[#a4a095] bg-transparent outline-none rounded-xl font-medium"
                />
                
                {/* Password Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#706a5b] hover:text-[#121214] transition-colors p-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
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
                <p className="text-[11px] text-[#d9383a] font-medium pl-1 flex items-center gap-1">
                  <span>⚠</span> {errors.password}
                </p>
              )}
            </div>

            {/* Primary Action Button (Login →) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full group bg-[#121214] text-white hover:bg-[#25242b] active:scale-[0.99] transition-all duration-300 py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_-5px_rgba(15,15,18,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(15,15,18,0.4)]"
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
                    LOGGING IN...
                  </span>
                ) : (
                  <>
                    <span>Login</span>
                    <span className="text-base font-light transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Registration Link */}
          <div className="text-center mt-8 pt-2">
            <p className="text-xs text-[#6c6a75]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-[#121214] font-bold hover:underline transition-colors ml-1"
              >
                Create an Account
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Footer Branding Note */}
      <div className="text-center pt-6">
        <p className="text-[10px] tracking-[0.2em] font-semibold text-[#9e9a8f] uppercase">
          © {new Date().getFullYear()} CRED SPLIT. HIGH-END FINANCIAL EXPERIENCE.
        </p>
      </div>
    </div>
  );
}
