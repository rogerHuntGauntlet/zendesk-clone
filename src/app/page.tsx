"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to OHFdesk</h1>
          <p className="text-white/80">Choose your portal to get started</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Admin Portal */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                onClick={() => router.push('/admin-login')}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-purple-400" />
              </div>
              <CardTitle className="text-white">Admin Portal</CardTitle>
              <CardDescription className="text-white/80">
                Manage projects and teams
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Employee Portal */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                onClick={() => router.push('/employee-login')}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-blue-400" />
              </div>
              <CardTitle className="text-white">Employee Portal</CardTitle>
              <CardDescription className="text-white/80">
                Handle support tickets
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Client Portal */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                onClick={() => router.push('/client-login')}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Building2 className="h-12 w-12 text-emerald-400" />
              </div>
              <CardTitle className="text-white">Client Portal</CardTitle>
              <CardDescription className="text-white/80">
                Access support and tickets
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}