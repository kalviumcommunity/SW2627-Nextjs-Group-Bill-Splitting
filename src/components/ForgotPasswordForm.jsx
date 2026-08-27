"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [focusedField, setFocusedField] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);

  // Client-side validation per PRD specifications
  const validateEmail = (val) => {
    if (!val.trim()) {
      return "Email address is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (error) {
      setError("");
    }
    if (serverStatus) {
      setServerStatus(null);
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerStatus(null);

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    /*
     * BACKEND CONTRACT (From PRD Section 8.1 & 9.1 Authentication & Password Recovery):
     *
     * 1. WHAT TO SEND TO BACKEND:
     *    Endpoint: POST /api/auth/forgot-password
     *    Headers: { "Content-Type": "application/json" }
     *    Payload: {
     *      email: email.trim()
     *    }
     *
     * 2. WHAT TO EXPECT FROM BACKEND:
     *    - Success (200 OK):
     *      {
     *        success: true,
     *        message: "A 6-digit password reset OTP has been sent to your email address.",
     *        email: "..."
     *      }
     *    - User Not Found (404 Not Found):
     *      {
     *        success: false,
     *        message: "No account found with this email address."
     *      }
     *    - Rate Limit / Error (429 / 400):
     *      {
     *        success: false,
     *        message: "Too many reset attempts. Please try again in 15 minutes."
     *      }
     */

    try {
      // Simulate backend network delay for frontend preview
      await new Promise((resolve) => setTimeout(resolve, 800));

      setServerStatus({
        type: "success",
        message: `A 6-digit verification code has been dispatched to ${email.trim()}`,
      });
    } catch (err) {
      setServerStatus({
        type: "error",
        message: "Unable to process password reset request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col justify-between w-full h-full p-6 sm:p-10 lg:p-14 xl:p-16">
      {/* Centered Forgot Password Card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[460px] bg-white rounded-3xl p-8 sm:p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06),0_0_1px_1px_rgba(0,0,0,0.03)] border border-[#ebe7dc] transition-all duration-300">
          
          {/* Header Section */}
          <div className="mb-8">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-tight text-[#121214] mb-2">
              Forgot Password
            </h2>
            <p className="text-xs sm:text-sm text-[#6c6a75] font-normal leading-relaxed">
              Enter the email address of your account to receive otp.
            </p>
          </div>

          {/* Feedback Banner */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            
            {/* Email Address Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="forgot-email"
                className="block text-[11px] font-bold text-[#121214] uppercase tracking-[0.14em]"
              >
                EMAIL ADDRESS
              </label>
              <div
                className={`relative rounded-xl border transition-all duration-200 bg-[#fbf9f4] ${
                  error
                    ? "border-[#d9383a] bg-[#fef2f2]/30"
                    : focusedField
                    ? "border-[#121214] bg-white ring-2 ring-[#121214]/10 shadow-xs"
                    : "border-[#d8d2c4] hover:border-[#a8a29e]"
                }`}
              >
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField(true)}
                  onBlur={() => setFocusedField(false)}
                  className="w-full px-4 py-3.5 text-sm text-[#121214] placeholder-[#a4a095] bg-transparent outline-none rounded-xl font-medium"
                />
              </div>
              {error && (
                <p className="text-[11px] text-[#d9383a] font-medium pl-1 flex items-center gap-1">
                  <span>⚠</span> {error}
                </p>
              )}
            </div>

            {/* Primary Action Button (SEND OTP →) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full group bg-[#121214] text-white hover:bg-[#25242b] active:scale-[0.99] transition-all duration-300 py-3.5 px-6 rounded-xl font-bold text-xs tracking-[0.15em] uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_-5px_rgba(15,15,18,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(15,15,18,0.4)]"
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
                    SENDING OTP...
                  </span>
                ) : (
                  <>
                    <span>SEND OTP</span>
                    <span className="text-sm font-light transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Back to Login Link */}
          <div className="text-center mt-8 pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#121214] hover:text-[#524d40] hover:underline transition-all"
            >
              <span>←</span>
              <span>BACK TO LOGIN</span>
            </Link>
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
