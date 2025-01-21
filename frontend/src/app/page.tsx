"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { initializeMockData } from "@/lib/mock-data-init";

const Page = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState<"support" | "customer" | "project_admin" | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Initialize mock data when the app starts
  useEffect(() => {
    initializeMockData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const user = await api.login(email, password);
      
      toast({
        title: `Login Successful`,
        description: `Welcome to the OHF Partners Help Desk`,
      });
      
      // Route based on user role
      switch (user.role) {
        case 'project_admin':
          router.push('/project-admin');
          break;
        case 'admin':
          router.push('/admin-dashboard');
          break;
        case 'employee':
          router.push('/employee-dashboard');
          break;
        case 'client':
          router.push('/client-dashboard');
          break;
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 dark:from-purple-900 dark:via-pink-800 dark:to-orange-800">
      {/* Header */}
      <header className="w-full py-6 px-4 bg-white/10 backdrop-blur-md dark:bg-gray-900/30 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-white animate-pulse">
              OHF Partners Help Desk
            </h1>
          </div>
          <Button 
            variant="outline" 
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
          >
            Sign Up
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {!loginType ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
            <Card 
              className="bg-white/10 backdrop-blur-md border-white/20 transform hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => setLoginType("project_admin")}
            >
              <CardHeader className="text-white text-center">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-200 via-pink-300 to-purple-400 bg-clip-text text-transparent">
                  Project Admin Portal
                </CardTitle>
                <CardDescription className="text-white/80">
                  Create and manage help desk projects
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <span className="text-6xl text-white">🏢</span>
              </CardContent>
            </Card>

            <Card 
              className="bg-white/10 backdrop-blur-md border-white/20 transform hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => setLoginType("support")}
            >
              <CardHeader className="text-white text-center">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-200 via-pink-300 to-purple-400 bg-clip-text text-transparent">
                  Support Team Portal
                </CardTitle>
                <CardDescription className="text-white/80">
                  Access the support dashboard and help customers
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <span className="text-6xl text-white">🎸</span>
              </CardContent>
            </Card>

            <Card 
              className="bg-white/10 backdrop-blur-md border-white/20 transform hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => setLoginType("customer")}
            >
              <CardHeader className="text-white text-center">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-200 via-pink-300 to-purple-400 bg-clip-text text-transparent">
                  Customer Portal
                </CardTitle>
                <CardDescription className="text-white/80">
                  Track your tickets and get support
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <span className="text-6xl text-white">✌️</span>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-white">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-200 via-pink-300 to-purple-400 bg-clip-text text-transparent">
                {loginType === 'support' ? 'Support Team Login' : 
                 loginType === 'customer' ? 'Customer Login' : 
                 'Project Admin Login'}
              </CardTitle>
              <CardDescription className="text-white/80">
                Enter your credentials to access your cosmic account
                {loginType === 'project_admin' && (
                  <div className="mt-2 p-2 bg-white/10 rounded-md">
                    <p className="text-sm">Demo Credentials:</p>
                    <p className="text-sm">Email: admin@ohfpartners.com</p>
                    <p className="text-sm">Password: any password will work</p>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-white/90">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-white/90">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/20 border-white/30 text-white"
                  />
                </div>
                <div className="space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white font-bold"
                  >
                    Enter the Portal
                  </Button>
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setLoginType(null)}
                    className="w-full text-white hover:bg-white/20"
                  >
                    Back to Portal Selection
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 bg-white/10 backdrop-blur-md dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto text-center text-sm text-white/70">
          © 2024 OHF Partners Help Desk. Keep on Truckin'
        </div>
      </footer>
    </div>
  );
};

export default Page;