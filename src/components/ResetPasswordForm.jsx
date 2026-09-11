"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm({ email = "", userId = "", onSuccess }) {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Resend timer
  const [countdown, setCountdown] = useState(58);
  const canResend = countdown === 0;

  const inputRefs = useRef([]);

  // Auto-focus first OTP input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle individual digit input
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal && value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = cleanVal.slice(-1);
    setOtp(newOtp);
    setErrorMessage("");

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().replace(/\D/g, "");
    if (!pastedData) return;

    const digits = pastedData.slice(0, 6).split("");
    const newOtp = [...otp];
    digits.forEach((digit, idx) => {
      newOtp[idx] = digit;
    });
    setOtp(newOtp);
    setErrorMessage("");
    const nextEmptyIndex = digits.length < 6 ? digits.length : 5;
    inputRefs.current[nextEmptyIndex]?.focus();
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setCountdown(60);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to resend code");

      setSuccessMessage("A new reset code has been sent to your email");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      setCountdown(0);
      setErrorMessage(error.message);
    }
  };

  // Validate password
  const validatePassword = () => {
    if (!newPassword) return "New password is required";
    const missing = [];
    if (newPassword.length < 8) missing.push("at least 8 characters");
    if (!/[A-Z]/.test(newPassword)) missing.push("1 uppercase letter");
    if (!/[a-z]/.test(newPassword)) missing.push("1 lowercase letter");
    if (!/[0-9]/.test(newPassword)) missing.push("1 number");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword)) missing.push("1 special character");
    if (missing.length > 0) return `Missing: ${missing.join(", ")}`;
    if (newPassword !== confirmPassword) return "Passwords do not match";
    return "";
  };

  // Submit reset
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const enteredCode = otp.join("");
    if (enteredCode.length < 6) {
      setErrorMessage("Please enter all 6 digits of the reset code.");
      return;
    }

    const passwordError = validatePassword();
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          userId,
          otp: enteredCode,
          newPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to reset password");

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("reset_password_email");
        sessionStorage.removeItem("reset_password_userId");
      }
      if (onSuccess) {
        onSuccess();
      }

      setSuccessMessage(result.message || "Password reset successfully!");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message || "Unable to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format seconds into MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex flex-col justify-between w-full h-full p-6 sm:p-10 lg:p-14 xl:p-16">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[460px] bg-white rounded-3xl p-8 sm:p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06),0_0_1px_1px_rgba(0,0,0,0.03)] border border-[#ebe7dc] transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-tight text-[#121214] mb-2.5">
              Reset Password
            </h2>
            <p className="text-xs sm:text-sm text-[#6c6a75] font-normal leading-relaxed max-w-sm mx-auto">
              Enter the 6-digit code sent to your email and set a new password.
            </p>
            {email && (
              <p className="text-xs font-semibold text-[#121214] mt-1">
                {email}
              </p>
            )}
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl text-xs font-medium bg-[#fef2f2] text-[#991b1b] border border-[#fecaca] flex items-center gap-2">
              <span>⚠</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3.5 rounded-xl text-xs font-medium bg-[#f2faf4] text-[#14532d] border border-[#bbf7d0] flex items-center gap-2">
              <span>✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-[11px] font-bold text-[#121214] uppercase tracking-[0.14em] mb-3">
                RESET CODE
              </label>
              <div
                className="flex flex-wrap justify-center items-center gap-2 sm:gap-3"
                onPaste={handlePaste}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    id={`reset-otp-box-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-9 sm:w-11 md:w-13 h-16 sm:h-20 text-center text-xl sm:text-2xl font-bold rounded-xl border transition-all duration-200 focus:outline-none select-none flex-shrink-0 ${
                      digit
                        ? "border-[#121214] bg-white text-[#121214] shadow-xs"
                        : "border-[#d8d2c4] bg-[#fbf9f4] text-[#121214]"
                    } focus:border-[#121214] focus:bg-white focus:ring-2 focus:ring-[#121214]/10`}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="block text-[11px] font-bold text-[#121214] uppercase tracking-[0.14em]"
              >
                NEW PASSWORD
              </label>
              <div
                className={`relative rounded-xl border transition-all duration-200 bg-[#fbf9f4] ${
                  focusedField === "newPassword"
                    ? "border-[#121214] bg-white ring-2 ring-[#121214]/10 shadow-xs"
                    : "border-[#d8d2c4] hover:border-[#a8a29e]"
                }`}
              >
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  onFocus={() => setFocusedField("newPassword")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 pr-10 text-sm text-[#121214] placeholder-[#a4a095] bg-transparent outline-none rounded-xl font-medium"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#787582] hover:text-[#121214] transition-colors focus:outline-none cursor-pointer p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="block text-[11px] font-bold text-[#121214] uppercase tracking-[0.14em]"
              >
                CONFIRM PASSWORD
              </label>
              <div
                className={`relative rounded-xl border transition-all duration-200 bg-[#fbf9f4] ${
                  focusedField === "confirmPassword"
                    ? "border-[#121214] bg-white ring-2 ring-[#121214]/10 shadow-xs"
                    : "border-[#d8d2c4] hover:border-[#a8a29e]"
                }`}
              >
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 text-sm text-[#121214] placeholder-[#a4a095] bg-transparent outline-none rounded-xl font-medium"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || otp.join("").length < 6}
              className="w-full bg-[#121214] text-white hover:bg-[#25242b] active:scale-[0.99] transition-all duration-300 py-4 px-6 rounded-xl font-bold text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_-5px_rgba(15,15,18,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(15,15,18,0.4)]"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  RESETTING...
                </span>
              ) : (
                <span>RESET PASSWORD</span>
              )}
            </button>
          </form>

          {/* Resend Code */}
          <div className="text-center mt-7 text-xs text-[#706a5b]">
            <span>Didn&apos;t receive the code? </span>
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOtp}
                className="font-bold tracking-wider text-[#121214] uppercase underline hover:opacity-80 transition-opacity cursor-pointer ml-1"
              >
                RESEND CODE
              </button>
            ) : (
              <span className="font-semibold text-[#8c8472] uppercase tracking-wider ml-1">
                RESEND IN {formatTimer(countdown)}
              </span>
            )}
          </div>

          {/* Back to Login */}
          <div className="text-center mt-4 pt-4 border-t border-[#f0ece2]">
            <Link
              href="/login"
              onClick={() => {
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem("reset_password_email");
                  sessionStorage.removeItem("reset_password_userId");
                }
              }}
              className="text-xs text-[#8c8472] hover:text-[#121214] underline cursor-pointer transition-colors"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-6">
        <p className="text-[10px] tracking-[0.2em] font-semibold text-[#9e9a8f] uppercase">
          © {new Date().getFullYear()} CRED SPLIT. HIGH-END FINANCIAL EXPERIENCE.
        </p>
      </div>
    </div>
  );
}
