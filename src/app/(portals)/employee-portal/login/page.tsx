"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/(portals)/employee-portal/hooks/useAuth";
import { validatePassword } from "@/app/(portals)/employee-portal/utils/validation";

type AuthMode = "login" | "register" | "forgot-password";

interface RegisterData {
  email: string;
  password: string;
  name: string;
  department: string;
}

export default function EmployeeLogin() {
  const router = useRouter();
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState<RegisterData>({
    email: "",
    password: "",
    name: "",
    department: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    if (mode === "register") {
      const { errors } = validatePassword(password);
      setPasswordErrors(errors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await signIn(formData.email, formData.password, rememberMe);
        router.push("/employee-portal/projects");
      } else if (mode === "register") {
        if (passwordErrors.length > 0) {
          throw new Error("Please fix password requirements before continuing.");
        }
        await signUp(formData);
        setMode("login");
        setError("Account created! Please verify your email and then log in with your credentials.");
      } else if (mode === "forgot-password") {
        await resetPassword(formData.email);
        setError("Password reset link has been sent to your email.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setPasswordErrors([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-amber-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {mode === "login" ? "Employee Login" : mode === "register" ? "Create Employee Account" : "Reset Password"}
          </h1>
          <p className="text-white/80">
            {mode === "login" 
              ? "Access your employee dashboard" 
              : mode === "register"
              ? "Register as an employee"
              : "Enter your email to reset password"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === "register" && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="John Doe"
                  required={mode === "register"}
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-white mb-2">
                  Department
                </label>
                <input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="IT Support"
                  required={mode === "register"}
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="employee@company.com"
              required
              autoComplete="username"
            />
          </div>

          {mode !== "forgot-password" && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="••••••••"
                required={mode === "login" || mode === "register"}
                autoComplete="current-password"
              />
              {mode === "register" && passwordErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordErrors.map((error, index) => (
                    <p key={index} className="text-red-400 text-xs">
                      • {error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === "login" && (
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border border-white/20 rounded bg-white/10"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-white/80">
                Remember me
              </label>
            </div>
          )}

          {error && (
            <div className={`text-sm rounded-lg p-3 ${
              error.includes("created") || error.includes("sent")
                ? "text-green-400 bg-green-400/10 border border-green-400/20"
                : "text-red-400 bg-red-400/10 border border-red-400/20"
            }`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading 
              ? (mode === "login" ? "Signing in..." : mode === "register" ? "Creating account..." : "Sending reset link...")
              : (mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Reset Password")}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          {mode === "login" ? (
            <>
              <button
                onClick={() => toggleMode("register")}
                className="text-white/80 hover:text-white text-sm transition-colors"
              >
                Don't have an account? Create one
              </button>
              <button
                onClick={() => toggleMode("forgot-password")}
                className="text-white/80 hover:text-white text-sm transition-colors block w-full"
              >
                Forgot your password?
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleMode("login")}
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              {mode === "register" ? "Already have an account? Sign in" : "Back to login"}
            </button>
          )}
          <div>
            <Link 
              href="/" 
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              ← Back to Portal Selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 