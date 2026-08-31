"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function OtpVerifyForm({
  email = "name@domain.com",
  onBack,
  onSuccess,
}) {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [countdown, setCountdown] = useState(58);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer for OTP Resend (from PRD / wireframe: "RESEND IN 0:58")
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Handle individual digit input
  const handleChange = (index, value) => {
    // Only accept numerical digits
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal && value !== "") return;

    const newOtp = [...otp];
    // Take only the last entered character if multiple
    newOtp[index] = cleanVal.slice(-1);
    setOtp(newOtp);
    setErrorMessage("");

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // If current box is empty, move to previous box and clear it
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

  // Handle full 6-digit paste (e.g. pasting "492015" from email)
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

    // Focus on next empty box or last box
    const nextEmptyIndex = digits.length < 6 ? digits.length : 5;
    inputRefs.current[nextEmptyIndex]?.focus();
  };

  // Resend OTP Action
  const handleResendOtp = async () => {
    if (!canResend) return;

    setCanResend(false);
    setCountdown(60);
    setErrorMessage("");
    setSuccessMessage(`A new 6-digit code has been dispatched to ${email}`);

    // Clear OTP inputs
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();

    /*
     * BACKEND CONTRACT (PRD Section 8.1 - OTP Resend):
     * Request: POST /api/auth/resend-otp { email }
     * Expects: { success: true, message: "New OTP sent" }
     */
    setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  // Verify OTP Submission
  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const enteredCode = otp.join("");

    if (enteredCode.length < 6) {
      setErrorMessage("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsVerifying(true);

    /*
     * BACKEND CONTRACT (From PRD Section 8.1 & 9.1 Authentication):
     *
     * 1. WHAT TO SEND TO BACKEND:
     *    Endpoint: POST /api/auth/verify-otp
     *    Payload: {
     *      email: email,
     *      otp: "123456"
     *    }
     *
     * 2. WHAT TO EXPECT FROM BACKEND:
     *    - Success (200):
     *      {
     *        success: true,
     *        message: "Email verified successfully. Account activated.",
     *        userId: "...",
     *        token: "..."
     *      }
     *    - Error (400 / 401):
     *      {
     *        success: false,
     *        message: "Invalid or expired OTP. Please check and try again."
     *      }
     */

    try {
      // Simulate backend OTP verification network call
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSuccessMessage("Account verified successfully! Welcome to CRED Split.");
      if (onSuccess) {
        onSuccess();
      }
      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 600);
    } catch (err) {
      setErrorMessage("Invalid verification code. Please try again.");
    } finally {
      setIsVerifying(false);
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
          {/* Header Section */}
          <div className="text-center mb-8">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-tight text-[#121214] mb-2.5">
              Verify Your Account
            </h2>
            <p className="text-xs sm:text-sm text-[#6c6a75] font-normal leading-relaxed max-w-sm mx-auto">
              We&apos;ve sent a 6-digit code to your email. Enter it below to continue.
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
          <form onSubmit={handleVerify} className="space-y-7">
            {/* 6 Tall Individual Rectangular Boxes (Matching Wireframe) */}
            <div
              className="flex flex-wrap justify-center items-center gap-2 sm:gap-3"
              onPaste={handlePaste}
            >

              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  id={`otp-box-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
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

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isVerifying || otp.join("").length < 6}
              className="w-full bg-[#121214] text-white hover:bg-[#25242b] active:scale-[0.99] transition-all duration-300 py-4 px-6 rounded-xl font-bold text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_-5px_rgba(15,15,18,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(15,15,18,0.4)]"
            >
              {isVerifying ? (
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
                  VERIFYING...
                </span>
              ) : (
                <span>VERIFY &amp; CONTINUE</span>
              )}
            </button>
          </form>

          {/* Countdown & Resend Option */}
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

          {/* Change Email / Back to Register option */}
          {onBack && (
            <div className="text-center mt-4 pt-4 border-t border-[#f0ece2]">
              <button
                type="button"
                onClick={onBack}
                className="text-xs text-[#8c8472] hover:text-[#121214] underline cursor-pointer transition-colors"
              >
                ← Back to edit registration details
              </button>
            </div>
          )}
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
