"use client";

import { useState } from "react";
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

  // Calculate password strength for visual feedback
  const getPasswordStrength = () => {
    const len = formData.password.length;
    if (len === 0) return 0;
    if (len < 6) return 1;
    if (len < 10) return 2;
    return 3;
  };

  const passwordStrength = getPasswordStrength();

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

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Please enter a valid full name";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

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

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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
          // Callback after successful verification
          console.log("Account activated successfully for", formData.email);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col justify-between w-full h-full p-6 sm:p-10 lg:p-14 xl:p-16">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[440px] bg-white rounded-3xl p-8 sm:p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06),0_0_1px_1px_rgba(0,0,0,0.03)] border border-[#ebe7dc] transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-block text-[10px] font-bold tracking-[0.25em] text-[#938f9c] uppercase mb-1">
              Member Registration
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-tight text-[#0f0f12] mb-1.5">
              Create Account
            </h2>
            <p className="text-xs sm:text-sm text-[#6c6a75] font-normal">
              Enter your details to register
            </p>
          </div>

          {/* Feedback Alert */}
          {serverStatus && (
            <div
              className={`mb-6 p-4 rounded-xl text-xs font-medium border flex items-start gap-3 transition-all ${
                serverStatus.type === "success"
                  ? "bg-[#f2faf4] text-[#14532d] border-[#bbf7d0]"
                  : "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]"
              }`}
            >
              <span className="text-base">{serverStatus.type === "success" ? "✓" : "⚠"}</span>
              <p className="flex-1 leading-relaxed">{serverStatus.message}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Full Name */}
            <div className="cred-input-group">
              <label htmlFor="fullName" className="cred-label">
                Full Name
              </label>
              <div
                className={`cred-input-wrapper ${
                  focusedField === "fullName" ? "is-focused" : ""
                } ${errors.fullName ? "has-error" : ""}`}
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
                  className="cred-input-field"
                  autoComplete="name"
                  disabled={isSubmitting}
                />
              </div>
              {errors.fullName && (
                <span className="text-[11px] font-medium text-[#d9383a] mt-1 block">
                  {errors.fullName}
                </span>
              )}
            </div>

            {/* Email Address & Age (Dual Column) */}
            <div className="grid grid-cols-3 gap-3.5">
              <div className="col-span-2 cred-input-group">
                <label htmlFor="email" className="cred-label">
                  Email Address
                </label>
                <div
                  className={`cred-input-wrapper ${
                    focusedField === "email" ? "is-focused" : ""
                  } ${errors.email ? "has-error" : ""}`}
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
                    className="cred-input-field"
                    autoComplete="email"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <span className="text-[11px] font-medium text-[#d9383a] mt-1 block">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="col-span-1 cred-input-group">
                <label htmlFor="age" className="cred-label">
                  Age
                </label>
                <div
                  className={`cred-input-wrapper ${
                    focusedField === "age" ? "is-focused" : ""
                  } ${errors.age ? "has-error" : ""}`}
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
                    className="cred-input-field"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.age && (
                  <span className="text-[11px] font-medium text-[#d9383a] mt-1 block">
                    {errors.age}
                  </span>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="cred-input-group">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="cred-label mb-0">
                  Password
                </label>
                {/* Password Strength Indicator */}
                {formData.password.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#787582] mr-1">
                      {passwordStrength === 1 && "Weak"}
                      {passwordStrength === 2 && "Good"}
                      {passwordStrength === 3 && "Strong"}
                    </span>
                    <span
                      className={`w-3 h-1 rounded-full ${
                        passwordStrength >= 1 ? "bg-[#d9383a]" : "bg-[#ece8de]"
                      }`}
                    />
                    <span
                      className={`w-3 h-1 rounded-full ${
                        passwordStrength >= 2 ? "bg-[#eab308]" : "bg-[#ece8de]"
                      }`}
                    />
                    <span
                      className={`w-3 h-1 rounded-full ${
                        passwordStrength >= 3 ? "bg-[#18794e]" : "bg-[#ece8de]"
                      }`}
                    />
                  </div>
                )}
              </div>
              <div
                className={`cred-input-wrapper ${
                  focusedField === "password" ? "is-focused" : ""
                } ${errors.password ? "has-error" : ""}`}
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
                  className="cred-input-field pr-12"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 text-[10px] font-bold tracking-widest text-[#787582] hover:text-[#0f0f12] transition-colors focus:outline-none cursor-pointer select-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
              {errors.password && (
                <span className="text-[11px] font-medium text-[#d9383a] mt-1 block">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full mt-7 bg-[#0f0f12] text-white hover:bg-[#25242b] active:scale-[0.99] transition-all duration-300 py-4 px-6 rounded-xl font-bold text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_10px_20px_-5px_rgba(15,15,18,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(15,15,18,0.4)]"
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
          </form>

          {/* Divider */}
          <div className="border-t border-[#f0ece2] my-6" />

          {/* Switch to Login Link */}
          <div className="text-center">
            <p className="text-xs text-[#6c6a75]">
              Already a member?{" "}
              <a
                href="#login"
                className="text-[#0f0f12] font-bold underline hover:text-[#38363f] transition-colors ml-1"
              >
                Log in
              </a>
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
