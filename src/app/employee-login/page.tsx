"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { Users } from "lucide-react";
import { AuthTabs } from "@/components/auth/auth-tabs";

export default function EmployeeLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      if (activeTab === "signup") {
        if (!name) {
          throw new Error('Please enter your name');
        }
        if (!department) {
          throw new Error('Please enter your department');
        }
      }

      // Try to sign in first, it will create the account if it doesn't exist
      await signIn(email, password, "employee");
      router.push("/project-admin");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-500 to-emerald-400 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Users className="h-12 w-12 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Employee Portal</CardTitle>
          <CardDescription className="text-white/80">
            {activeTab === "login" 
              ? "Enter your credentials to access your support dashboard"
              : "Create your employee account to get started"
            }
          </CardDescription>
          <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "signup" && (
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/20 border-white/20 text-white placeholder:text-white/50"
                  required
                  disabled={isLoading}
                  aria-label="Full Name"
                />
              </div>
            )}
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/20 border-white/20 text-white placeholder:text-white/50"
                required
                disabled={isLoading}
                aria-label="Email"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/20 border-white/20 text-white placeholder:text-white/50"
                required
                disabled={isLoading}
                aria-label="Password"
                minLength={6}
              />
              {activeTab === "login" && (
                <div className="text-right">
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-white/80 hover:text-white"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>
            {activeTab === "signup" && (
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="bg-white/20 border-white/20 text-white placeholder:text-white/50"
                  required
                  disabled={isLoading}
                  aria-label="Department"
                />
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-white/20 hover:bg-white/30 text-white disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading 
                ? (activeTab === "login" ? "Signing in..." : "Creating account...") 
                : (activeTab === "login" ? "Sign In" : "Create Account")
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 