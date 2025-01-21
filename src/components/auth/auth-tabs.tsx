"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuthTabsProps {
  activeTab: "login" | "signup";
  onTabChange: (value: "login" | "signup") => void;
}

export function AuthTabs({ activeTab, onTabChange }: AuthTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as "login" | "signup")} className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-white/10">
        <TabsTrigger 
          value="login" 
          className="text-white data-[state=active]:bg-white/20"
        >
          Login
        </TabsTrigger>
        <TabsTrigger 
          value="signup" 
          className="text-white data-[state=active]:bg-white/20"
        >
          Sign Up
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
} 