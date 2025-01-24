"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { validatePassword } from "../utils/validation";

export default function ResetPassword() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    const { errors } = validatePassword(newPassword);
    setPasswordErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (passwordErrors.length > 0) {
      setError("Please fix password requirements before continuing.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/client-portal/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-green-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-white/80">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
              required
            />
            {passwordErrors.length > 0 && (
              <div className="mt-2 space-y-1">
                {passwordErrors.map((error, index) => (
                  <p key={index} className="text-red-400 text-xs">
                    • {error}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-lg p-3">
              Password updated successfully! Redirecting to login...
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating Password..." : "Update Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link 
            href="/client-portal/login" 
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
} 